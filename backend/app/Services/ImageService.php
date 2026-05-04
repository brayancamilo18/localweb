<?php

namespace App\Services;

use App\Enums\ImageSection;
use App\Models\Business;
use App\Models\BusinessImage;
use Illuminate\Filesystem\FilesystemAdapter;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Intervention\Image\Drivers\Gd\Driver;
use Intervention\Image\ImageManager;
use Intervention\Image\Interfaces\ImageInterface;

class ImageService
{
    public function uploadImage(UploadedFile|string $file, Business $business, ImageSection $section, int $order): BusinessImage
    {
        $manager = new ImageManager(Driver::class);
        $image = $this->decodeSource($manager, $file);

        if ($image->width() > 2000) {
            $image = $image->scale(width: 2000);
        }

        $encoded = $image->encodeUsingFileExtension('webp', 85);
        $path = sprintf(
            'businesses/%d/%s/%s.webp',
            $business->id,
            $section->value,
            (string) Str::uuid()
        );

        /** @var FilesystemAdapter $disk */
        $disk = Storage::disk('r2');
        $disk->put($path, $encoded->toString(), ['visibility' => 'public']);

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
