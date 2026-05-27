<?php

namespace App\Support;

use Illuminate\Support\Facades\Storage;

final class OnboardingDraftMediaPath
{
    /**
     * Ruta absoluta solo si el borrador apunta a un archivo temporal bajo onboarding/{userId}/.
     * Ignora marcadores __synced__ (media ya en business_images / R2).
     */
    public static function resolve(int $userId, mixed $relative): ?string
    {
        if (! is_string($relative) || $relative === '' || $relative === '__synced__') {
            return null;
        }

        $expectedPrefix = "onboarding/{$userId}/";
        if (! str_starts_with($relative, $expectedPrefix)) {
            return null;
        }

        $absolute = Storage::disk('local')->path($relative);

        return is_file($absolute) ? $absolute : null;
    }
}
