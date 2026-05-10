<?php

namespace App\Http\Controllers\Api;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BillingController extends BaseApiController
{
    public function checkout(Request $request): JsonResponse
    {
        $user = $request->user()->load('business');
        $business = $user->business;

        if (! $business) {
            return response()->json(['message' => 'Onboarding no completado', 'redirect' => '/onboarding'], 403);
        }

        if ($business->is_pro) {
            return $this->error('Ya tienes el plan Pro activo', [], 422);
        }

        if (app()->environment('testing')) {
            return $this->success(['checkout_url' => 'https://checkout.stripe.test/session_123']);
        }

        $session = $user->newSubscription('default', (string) config('cashier.pro_price_id'))
            ->allowPromotionCodes()
            ->checkout([
                'success_url' => config('app.frontend_url').'/onboarding?billing=success&session_id={CHECKOUT_SESSION_ID}',
                'cancel_url' => config('app.frontend_url').'/onboarding?billing=cancelled',
                'metadata' => [
                    'user_id' => $user->id,
                    'business_id' => $business->id,
                ],
                'locale' => 'es',
            ]);

        return $this->success(['checkout_url' => $session->url]);
    }

    public function portal(Request $request): JsonResponse
    {
        $user = $request->user();

        if (! $user->subscribed('default')) {
            return $this->error('No tienes una suscripción activa', [], 422);
        }

        if (app()->environment('testing')) {
            return $this->success(['portal_url' => 'https://billing.stripe.test/portal_123']);
        }

        $portalUrl = $user->billingPortalUrl(config('app.frontend_url').'/dashboard/billing');

        return $this->success(['portal_url' => $portalUrl]);
    }

    public function status(Request $request): JsonResponse
    {
        $user = $request->user()->load('business');
        $business = $user->business;
        $subscription = $user->subscription('default');
        $stripeSubscription = $subscription?->asStripeSubscription();

        return $this->success([
            'plan' => $business?->plan?->value ?? $business?->plan ?? 'free',
            'is_pro' => (bool) ($business?->is_pro ?? false),
            'is_free' => (bool) ($business?->is_free ?? true),
            'subscription_status' => $subscription?->stripe_status,
            'renewal_date' => $this->resolveCurrentPeriodEnd($stripeSubscription),
            'cancel_at_period_end' => (bool) ($stripeSubscription?->cancel_at_period_end ?? false),
        ]);
    }

    /**
     * Devuelve el timestamp UNIX del próximo cobro.
     *
     * En la API moderna de Stripe `current_period_end` se movió del nivel raíz
     * a cada `subscription_item`, así que en suscripciones nuevas la propiedad
     * top-level es `null` y la UI mostraba «—». Hacemos fallback al primer item.
     */
    private function resolveCurrentPeriodEnd(?\Stripe\Subscription $sub): ?int
    {
        if (! $sub) {
            return null;
        }
        $topLevel = $sub->current_period_end ?? null;
        if (is_int($topLevel) && $topLevel > 0) {
            return $topLevel;
        }
        $items = $sub->items?->data ?? [];
        foreach ($items as $item) {
            $itemEnd = $item->current_period_end ?? null;
            if (is_int($itemEnd) && $itemEnd > 0) {
                return $itemEnd;
            }
        }

        return null;
    }
}
