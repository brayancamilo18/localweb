<?php

namespace App\Services;

use App\Enums\ImageSection;
use App\Models\Business;
use App\Models\User;
use App\Support\OnboardingDraftMediaPath;
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

        $userId = (int) $user->id;

        $coverPath = OnboardingDraftMediaPath::resolve($userId, $draft['cover_path'] ?? null);
        if ($coverPath !== null) {
            $this->imageService->uploadImage($coverPath, $business, ImageSection::Cover, 0);
        }
        $coverPath2 = OnboardingDraftMediaPath::resolve($userId, $draft['cover_path_2'] ?? null);
        if ($coverPath2 !== null) {
            $this->imageService->uploadImage($coverPath2, $business, ImageSection::Cover, 1);
        }
        $coverPath3 = OnboardingDraftMediaPath::resolve($userId, $draft['cover_path_3'] ?? null);
        if ($coverPath3 !== null) {
            $this->imageService->uploadImage($coverPath3, $business, ImageSection::Cover, 2);
        }
        $aboutPath = OnboardingDraftMediaPath::resolve($userId, $draft['about_photo_path'] ?? null);
        if ($aboutPath !== null) {
            $this->imageService->uploadImage($aboutPath, $business, ImageSection::About, 0);
        }
        foreach (($draft['gallery_paths'] ?? []) as $index => $path) {
            $galleryPath = OnboardingDraftMediaPath::resolve($userId, $path);
            if ($galleryPath === null) {
                continue;
            }
            $this->imageService->uploadImage($galleryPath, $business, ImageSection::Gallery, (int) $index);
        }

        Storage::disk('local')->deleteDirectory("onboarding/{$user->id}");
        Cache::forget($key);
    }
}
