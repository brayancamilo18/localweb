<?php

namespace App\Services;

use App\Enums\ImageSection;
use App\Models\Business;
use App\Models\BusinessImage;
use finfo;
use Illuminate\Filesystem\FilesystemAdapter;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Intervention\Image\Drivers\Gd\Driver as GdDriver;
use Intervention\Image\Drivers\Imagick\Driver as ImagickDriver;
use Intervention\Image\ImageManager;
use Intervention\Image\Interfaces\EncodedImageInterface;
use Intervention\Image\Interfaces\ImageInterface;

class ImageService
{
    public function uploadImage(UploadedFile|string $file, Business $business, ImageSection $section, int $order): BusinessImage
    {
        $preserveTransparency = $this->sourceMayHaveTransparency($file);
        $manager = $this->createImageManager();
        $image = $this->decodeSource($manager, $file);

        if ($image->width() > 2000) {
            $image = $image->scale(width: 2000);
        }

        $extension = $preserveTransparency ? 'png' : 'webp';
        $path = sprintf(
            'businesses/%d/%s/%s.%s',
            $business->id,
            $section->value,
            (string) Str::uuid(),
            $extension
        );

        $this->persistToR2($image, $preserveTransparency, $path);

        return BusinessImage::create([
            'business_id' => $business->id,
            'path' => $path,
            'section' => $section->value,
            'display_order' => $order,
            'width' => $image->width(),
            'height' => $image->height(),
        ]);
    }

    public function deleteImage(BusinessImage $image): void
    {
        /** @var FilesystemAdapter $disk */
        $disk = Storage::disk('r2');
        $disk->delete($image->path);
        $image->delete();
    }

    /**
     * Logo del negocio en `businesses/{id}/logo/{uuid}.webp` o `.png`, máx. 400 px en el lado mayor.
     *
     * @param  UploadedFile|string  $file  Multipart o ruta absoluta en disco local (onboarding).
     */
    public function replaceBusinessLogo(UploadedFile|string $file, Business $business): void
    {
        $preserveTransparency = $this->sourceMayHaveTransparency($file);

        Log::info('Logo upload debug', [
            'mime' => $this->resolveSourceMimeType($file),
            'preserveTransparency' => $preserveTransparency,
            'file_class' => is_object($file) ? get_class($file) : gettype($file),
            'client_mime' => $file instanceof UploadedFile ? $file->getClientMimeType() : null,
            'client_original_name' => $file instanceof UploadedFile ? $file->getClientOriginalName() : null,
            'driver' => extension_loaded('imagick') ? 'imagick' : 'gd',
        ]);

        $manager = $this->createImageManager();
        $image = $this->decodeSource($manager, $file);

        if ($image->width() > 400 || $image->height() > 400) {
            $image = $image->scaleDown(width: 400, height: 400);
        }

        $extension = $preserveTransparency ? 'png' : 'webp';
        $path = sprintf(
            'businesses/%d/logo/%s.%s',
            $business->id,
            (string) Str::uuid(),
            $extension
        );

        Log::info('Logo upload debug (output)', [
            'extension' => $extension,
            'path' => $path,
            'business_id' => $business->id,
        ]);

        /** @var FilesystemAdapter $disk */
        $disk = Storage::disk('r2');
        if ($business->logo_path) {
            $disk->delete($business->logo_path);
        }

        $this->persistToR2($image, $preserveTransparency, $path);

        $business->update(['logo_path' => $path]);
    }

    public function deleteBusinessLogo(Business $business): void
    {
        if (! $business->logo_path) {
            return;
        }

        /** @var FilesystemAdapter $disk */
        $disk = Storage::disk('r2');
        $disk->delete($business->logo_path);
        $business->update(['logo_path' => null]);
    }

    public function reorder(Business $business, array $imageIds): void
    {
        DB::transaction(function () use ($business, $imageIds): void {
            foreach (array_values($imageIds) as $order => $imageId) {
                BusinessImage::query()
                    ->where('business_id', $business->id)
                    ->whereKey($imageId)
                    ->update(['display_order' => $order]);
            }
        });
    }

    private function createImageManager(): ImageManager
    {
        if (extension_loaded('imagick')) {
            return new ImageManager(new ImagickDriver);
        }

        return new ImageManager(new GdDriver);
    }

    private function persistToR2(ImageInterface $image, bool $preserveTransparency, string $path): void
    {
        $encoded = $this->encodeImage($image, $preserveTransparency);
        $mimeType = $preserveTransparency ? 'image/png' : 'image/webp';

        /** @var FilesystemAdapter $disk */
        $disk = Storage::disk('r2');
        $disk->put($path, $encoded->toString(), [
            'visibility' => 'public',
            'ContentType' => $mimeType,
        ]);
    }

    private function encodeImage(ImageInterface $image, bool $preserveTransparency): EncodedImageInterface
    {
        if ($preserveTransparency) {
            return $image->encodeUsingFileExtension('png');
        }

        return $image->encodeUsingFileExtension('webp', 85);
    }

    /**
     * PNG y GIF pueden llevar canal alpha; JPEG/WebP sin alpha se convierten a WebP.
     */
    private function sourceMayHaveTransparency(UploadedFile|string $file): bool
    {
        if ($file instanceof UploadedFile) {
            // 1. Comprobar extensión original del cliente
            $ext = strtolower($file->getClientOriginalExtension());
            if (in_array($ext, ['png', 'gif'], true)) {
                return true;
            }

            // 2. Comprobar MIME del cliente
            $clientMime = strtolower((string) $file->getClientMimeType());
            if (in_array($clientMime, ['image/png', 'image/gif'], true)) {
                return true;
            }

            // 3. Comprobar MIME detectado por el servidor (más fiable)
            $serverMime = strtolower((string) $file->getMimeType());
            if (in_array($serverMime, ['image/png', 'image/gif'], true)) {
                return true;
            }

            // 4. Leer los primeros bytes del archivo para detectar por magic bytes
            $handle = fopen($file->getRealPath(), 'rb');
            if ($handle) {
                $header = fread($handle, 8);
                fclose($handle);
                if (str_starts_with($header, "\x89PNG\r\n\x1a\n") ||
                    str_starts_with($header, 'GIF87a') ||
                    str_starts_with($header, 'GIF89a')) {
                    return true;
                }
            }

            return false;
        }

        // Para strings (rutas de archivo o base64)
        $mime = $this->resolveSourceMimeType($file);

        return in_array($mime, ['image/png', 'image/gif'], true);
    }

    private function resolveSourceMimeType(UploadedFile|string $file): string
    {
        if ($file instanceof UploadedFile) {
            return strtolower((string) $file->getMimeType());
        }

        if (is_string($file) && $file !== '' && is_file($file)) {
            $mime = mime_content_type($file);

            return is_string($mime) ? strtolower($mime) : '';
        }

        $binary = $this->resolveStringImagePayload(is_string($file) ? $file : '');

        return $this->mimeFromBinary($binary);
    }

    private function mimeFromBinary(string $binary): string
    {
        if ($binary === '') {
            return '';
        }

        if (str_starts_with($binary, "\x89PNG\r\n\x1a\n")) {
            return 'image/png';
        }

        if (str_starts_with($binary, 'GIF87a') || str_starts_with($binary, 'GIF89a')) {
            return 'image/gif';
        }

        if (str_starts_with($binary, "\xff\xd8\xff")) {
            return 'image/jpeg';
        }

        $finfo = new finfo(FILEINFO_MIME_TYPE);
        $detected = $finfo->buffer($binary);

        return is_string($detected) ? strtolower($detected) : '';
    }

    /**
     * @param  UploadedFile|string  $file  Subida multipart, ruta absoluta en disco (onboarding) u otro binario/base64.
     */
    private function decodeSource(ImageManager $manager, UploadedFile|string $file): ImageInterface
    {
        if ($file instanceof UploadedFile) {
            return $manager->decodeBinary((string) $file->getContent());
        }

        if (is_string($file) && $file !== '' && is_file($file)) {
            return $manager->decodePath($file);
        }

        return $manager->decodeBinary($this->resolveStringImagePayload($file));
    }

    private function resolveStringImagePayload(string $file): string
    {
        $payload = $file;
        if (str_contains($payload, ',')) {
            [, $payload] = explode(',', $payload, 2);
        }

        $decoded = base64_decode($payload, true);

        return $decoded !== false ? $decoded : $payload;
    }
}
