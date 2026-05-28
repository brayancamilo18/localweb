<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * Supresión de cuenta (RGPD/LOPDGDD): soft-delete + anonimización de PII.
 *
 * Estrategia:
 * - NO borramos físicamente filas con FKs de facturas Stripe, referidos o negocio.
 * - Anonimizamos name/email del usuario y despublicamos el negocio vinculado.
 * - La suscripción Stripe se cancela al instante ANTES de la transacción de BD.
 */
class AccountDeletionService
{
    /**
     * Cancela la suscripción activa de Stripe. Debe ejecutarse fuera de la
     * transacción de BD: si falla, la cuenta no se toca.
     */
    public function cancelStripeSubscription(User $user): void
    {
        $subscription = $user->subscription('default');

        if ($subscription === null || ! $user->subscribed('default')) {
            return;
        }

        if (app()->environment('testing')) {
            $subscription->forceFill([
                'stripe_status' => 'canceled',
                'ends_at' => now(),
            ])->save();

            return;
        }

        $subscription->cancelNow();
    }

    /**
     * Anonimiza PII, desvincula el negocio, cierra sesiones y soft-delete.
     */
    public function anonymizeAndDelete(User $user): void
    {
        DB::transaction(function () use ($user): void {
            $business = $user->business;

            if ($business !== null) {
                $business->forceFill(['is_published' => false])->save();
            }

            $user->tokens()->delete();

            DB::table('sessions')
                ->where('user_id', $user->id)
                ->delete();

            $user->forceFill([
                'name' => 'Usuario eliminado',
                'email' => $this->anonymizedEmail($user->id),
                'password' => Hash::make(Str::random(64)),
                'remember_token' => null,
                'email_verified_at' => null,
                'marketing_consent_at' => null,
                'business_id' => null,
            ])->save();

            $user->delete();
        });
    }

    public function anonymizedEmail(int $userId): string
    {
        return 'usuario-eliminado-'.$userId.'@deleted.onez.local';
    }
}
