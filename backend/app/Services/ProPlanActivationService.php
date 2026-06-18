<?php

namespace App\Services;

use App\Enums\Plan;
use App\Models\Business;
use App\Models\User;
use Illuminate\Support\Facades\Log;

/**
 * Promueve un negocio a plan Pro tras un pago confirmado (checkout o suscripción activa).
 */
class ProPlanActivationService
{
    public function __construct(
        private readonly OnboardingMediaFinalizeService $mediaFinalize,
    ) {}

    /**
     * Idempotente: si ya es Pro, no sobrescribe fechas ni repite finalize innecesariamente.
     *
     * @param  array<string, mixed>  $metadata  Metadatos del checkout Stripe (subdomain, etc.).
     */
    public function activatePro(Business $business, User $user, array $metadata = []): Business
    {
        $wasPro = $business->plan === Plan::Pro;

        $updates = [
            'plan' => Plan::Pro,
            'plan_activated_at' => $business->plan_activated_at ?? now(),
        ];

        if (! $business->is_published) {
            $updates['is_published'] = false;
        }

        $subdomain = isset($metadata['subdomain']) ? (string) $metadata['subdomain'] : '';
        if ($business->subdomain_type === 'random' && $subdomain !== '') {
            $updates['subdomain'] = $subdomain;
        }

        $business->forceFill($updates)->save();
        $business = $business->fresh();

        if (! $wasPro) {
            try {
                $this->mediaFinalize->finalizeFromCache($user, $business);
            } catch (\Throwable $e) {
                Log::error('Onboarding media finalize after Pro activation failed', [
                    'user_id' => $user->id,
                    'business_id' => $business->id,
                    'exception' => $e->getMessage(),
                ]);
            }
        }

        return $business->fresh();
    }
}
