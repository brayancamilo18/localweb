<?php

namespace App\Services;

use App\Enums\Plan;
use App\Models\Business;
use App\Models\User;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;

/** @see ProPlanReconciliationService Usuarios con suscripción activa no deben perder Pro al cerrar sesión. */

/**
 * Vuelve el onboarding al paso 1 (elegir plantilla) sin borrar datos del registro
 * (nombre, sector, ciudad, país).
 */
class OnboardingResetService
{
    public function __construct(
        private readonly ImageService $imageService,
        private readonly ProPlanReconciliationService $planReconciliation,
    ) {}

    /**
     * @return bool true si se reinició el negocio incompleto; false si se omitió (p. ej. ya pagó Pro).
     */
    public function resetForUser(User $user): bool
    {
        $user->loadMissing(['business', 'subscriptions']);

        if ($this->planReconciliation->hasPaidAccess($user)) {
            $this->clearDraftCacheAndStorage($user->id);

            return false;
        }

        $this->clearDraftCacheAndStorage($user->id);

        $business = $user->business;
        if ($business === null || $business->onboarding_completed_at !== null) {
            return false;
        }

        $this->resetIncompleteBusiness($business);

        return true;
    }

    private function clearDraftCacheAndStorage(int $userId): void
    {
        Cache::forget("onboarding:{$userId}");
        Storage::disk('local')->deleteDirectory("onboarding/{$userId}");
    }

    private function resetIncompleteBusiness(Business $business): void
    {
        $business->load('images');

        foreach ($business->images as $image) {
            $this->imageService->deleteImage($image);
        }

        $this->imageService->deleteBusinessLogo($business);

        $business->forceFill([
            'template_id' => null,
            'tagline' => null,
            'description' => null,
            'schedule' => null,
            'phone' => null,
            'email' => null,
            'address' => null,
            'lat' => null,
            'lng' => null,
            'brand_color' => null,
            'is_published' => false,
            'plan' => Plan::Free,
        ])->save();
    }
}
