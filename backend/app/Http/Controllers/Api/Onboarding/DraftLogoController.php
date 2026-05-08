<?php

namespace App\Http\Controllers\Api\Onboarding;

use App\Http\Controllers\Api\BaseApiController;
use Illuminate\Filesystem\FilesystemAdapter;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;

class DraftLogoController extends BaseApiController
{
    /**
     * Sirve el logo del borrador desde disco local (`onboarding/{userId}/logo/*`).
     */
    public function __invoke(Request $request)
    {
        $userId = (int) $request->user()->id;
        $draft = Cache::get("onboarding:{$userId}", []);
        $relative = $draft['logo_path'] ?? null;

        if (! is_string($relative) || $relative === '') {
            abort(404);
        }

        $expectedPrefix = "onboarding/{$userId}/logo/";
        if (! str_starts_with($relative, $expectedPrefix)) {
            abort(404);
        }

        /** @var FilesystemAdapter $disk */
        $disk = Storage::disk('local');

        if (! $disk->exists($relative)) {
            abort(404);
        }

        return $disk->response($relative);
    }
}
