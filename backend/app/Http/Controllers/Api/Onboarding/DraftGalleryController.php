<?php

namespace App\Http\Controllers\Api\Onboarding;

use App\Http\Controllers\Api\BaseApiController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;

class DraftGalleryController extends BaseApiController
{
    /**
     * Sirve una foto de galería del borrador en disco local (onboarding/{userId}/gallery/*).
     */
    public function __invoke(Request $request, int $index)
    {
        $userId = (int) $request->user()->id;
        $draft = Cache::get("onboarding:{$userId}", []);
        $paths = $draft['gallery_paths'] ?? [];

        if (! is_array($paths) || $index < 0 || $index >= count($paths)) {
            abort(404);
        }

        $relative = $paths[$index];
        if (! is_string($relative) || $relative === '' || $relative === '__synced__') {
            abort(404);
        }

        $expectedPrefix = "onboarding/{$userId}/gallery/";
        if (! str_starts_with($relative, $expectedPrefix)) {
            abort(404);
        }

        /** @var \Illuminate\Filesystem\FilesystemAdapter $disk */
        $disk = Storage::disk('local');

        if (! $disk->exists($relative)) {
            abort(404);
        }

        return $disk->response($relative);
    }
}
