<?php

namespace App\Http\Controllers\Api\Public;

use App\Http\Controllers\Controller;
use App\Support\R2PublicUrl;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class StorageMediaController extends Controller
{
    public function show(Request $request, string $path): StreamedResponse
    {
        $path = ltrim($path, '/');

        if (! R2PublicUrl::isAllowedPath($path)) {
            abort(404);
        }

        /** @var \Illuminate\Filesystem\FilesystemAdapter $disk */
        $disk = Storage::disk('r2');

        if (! $disk->exists($path)) {
            abort(404);
        }

        $mime = $disk->mimeType($path) ?: 'application/octet-stream';

        return response()->stream(function () use ($disk, $path): void {
            $stream = $disk->readStream($path);
            if (! is_resource($stream)) {
                return;
            }
            fpassthru($stream);
            fclose($stream);
        }, 200, [
            'Content-Type' => $mime,
            'Cache-Control' => 'public, max-age=31536000, immutable',
        ]);
    }
}
