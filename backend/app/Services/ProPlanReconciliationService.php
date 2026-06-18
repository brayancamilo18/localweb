<?php

namespace App\Services;

use App\Enums\Plan;
use App\Models\Business;
use App\Models\User;
use App\Services\ProPlanActivationService;

/**
 * Alinea `business.plan` con la suscripción Stripe real (Cashier).
 *
 * Cubre el drift `free_with_subscription` (p. ej. logout en onboarding que
 * reseteó el negocio a Free mientras la suscripción sigue activa).
 */
class ProPlanReconciliationService
{
    /**
     * Promueve el negocio a Pro si el owner tiene suscripción activa y el plan local no coincide.
     */
    public function reconcile(User $user): ?Business
    {
        $user->loadMissing(['business', 'subscriptions']);
        $business = $user->business;

        if ($business === null) {
            return null;
        }

        if (! $this->shouldPromoteToPro($user, $business)) {
            return $business;
        }

        return app(ProPlanActivationService::class)->activatePro($business, $user, [
            'subdomain' => $business->subdomain,
        ]);
    }

    /**
     * El usuario pagó Pro: plan local Pro/Pending o suscripción Stripe activa.
     */
    public function hasPaidAccess(User $user, ?Business $business = null): bool
    {
        $business ??= $user->business;

        if ($business === null) {
            return false;
        }

        if (in_array($business->plan, [Plan::Pro, Plan::Pending], true)) {
            return true;
        }

        $user->loadMissing('subscriptions');

        return $user->subscribed('default');
    }

    private function shouldPromoteToPro(User $user, Business $business): bool
    {
        if ($business->plan === Plan::Pro) {
            return false;
        }

        $user->loadMissing('subscriptions');

        if ($user->subscribed('default')) {
            return true;
        }

        if ($user->stripe_id === null || $user->stripe_id === '') {
            return false;
        }

        // Webhook ausente: consultar Stripe API y sincronizar suscripción local.
        return app(StripeSubscriptionSyncService::class)->userHasActiveProSubscription($user);
    }
}
