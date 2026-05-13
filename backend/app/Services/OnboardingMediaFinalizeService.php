<?php

namespace App\Services;

use App\Enums\ImageSection;
use App\Models\Business;
use App\Models\User;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;

final class OnboardingMediaFinalizeService
{
    public function __construct(private ImageService $imageService) {}

    /**
     * Sube portada, sobre y galería desde el borrador en caché y limpia el borrador local.
     * Se llama tras un pago Pro exitoso (webhook Stripe).
     */
    public function finalizeFromCache(User $user, Business $business): void
    {
        $key = 'onboarding:'.$user->id;
        $draft = Cache::get($key, []);

        if (! empty($draft['cover_path'])) {
            $this->imageService->uploadImage(
                Storage::disk('local')->path($draft['cover_path']),
                $business,
                ImageSection::Cover,
                0
            );
        }
        if (! empty($draft['cover_path_2'])) {
            $this->imageService->uploadImage(
                Storage::disk('local')->path($draft['cover_path_2']),
                $business,
                ImageSection::Cover,
                1
            );
        }
        if (! empty($draft['cover_path_3'])) {
            $this->imageService->uploadImage(
                Storage::disk('local')->path($draft['cover_path_3']),
                $business,
                ImageSection::Cover,
                2
            );
        }
        if (! empty($draft['about_photo_path'])) {
            $this->imageService->uploadImage(
                Storage::disk('local')->path($draft['about_photo_path']),
                $business,
                ImageSection::About,
                0
            );
        }
        foreach (($draft['gallery_paths'] ?? []) as $index => $path) {
            $this->imageService->uploadImage(
                Storage::disk('local')->path($path),
                $business,
                ImageSection::Gallery,
                (int) $index
            );
        }

        Storage::disk('local')->deleteDirectory("onboarding/{$user->id}");
        Cache::forget($key);
    }
}
