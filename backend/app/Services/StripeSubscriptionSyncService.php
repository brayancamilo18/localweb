<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Log;
use Stripe\Stripe;
use Stripe\Subscription as StripeSubscription;

/**
 * Consulta suscripciones activas en Stripe cuando Cashier aún no tiene fila local
 * (p. ej. webhook no configurado en local). Crea/actualiza la suscripción local
 * para que `subscribed('default')` y la reconciliación de plan funcionen.
 */
class StripeSubscriptionSyncService
{
    /**
     * @internal Solo tests: simula una suscripción activa devuelta por Stripe API.
     *
     * @var object{id: string, status: string, trial_end?: int|null, items: object{data: list<object{price?: object{id?: string}, quantity?: int}>}}|null
     */
    public static ?object $stripeSubscriptionForTests = null;

    /**
     * True si el usuario tiene suscripción Pro activa/trial (local o en Stripe).
     * Si solo existe en Stripe, sincroniza la fila local de Cashier.
     */
    public function userHasActiveProSubscription(User $user): bool
    {
        $user->loadMissing('subscriptions');

        if ($user->subscribed('default')) {
            return true;
        }

        if ($user->stripe_id === null || $user->stripe_id === '') {
            return false;
        }

        $stripeSub = $this->fetchActiveSubscriptionFromStripe($user);
        if ($stripeSub === null) {
            return false;
        }

        $this->upsertLocalSubscription($user, $stripeSub);
        $user->unsetRelation('subscriptions');

        return $user->fresh(['subscriptions'])->subscribed('default');
    }

    private function fetchActiveSubscriptionFromStripe(User $user): ?object
    {
        if (app()->environment('testing')) {
            return self::$stripeSubscriptionForTests;
        }

        try {
            Stripe::setApiKey(config('cashier.secret'));

            foreach (['active', 'trialing'] as $status) {
                $list = StripeSubscription::all([
                    'customer' => $user->stripe_id,
                    'status' => $status,
                    'limit' => 1,
                ]);

                if (! empty($list->data)) {
                    return $list->data[0];
                }
            }
        } catch (\Throwable $e) {
            Log::warning('Stripe subscription lookup failed', [
                'user_id' => $user->id,
                'stripe_id' => $user->stripe_id,
                'message' => $e->getMessage(),
            ]);
        }

        return null;
    }

    private function upsertLocalSubscription(User $user, object $stripeSub): void
    {
        $items = $stripeSub->items->data ?? [];
        $firstItem = $items[0] ?? null;
        $priceId = $firstItem->price->id ?? null;
        $quantity = $firstItem->quantity ?? 1;
        $trialEnd = $stripeSub->trial_end ?? null;

        $user->subscriptions()->updateOrCreate(
            ['stripe_id' => (string) $stripeSub->id],
            [
                'type' => 'default',
                'stripe_status' => (string) ($stripeSub->status ?? 'active'),
                'stripe_price' => $priceId !== null ? (string) $priceId : null,
                'quantity' => is_numeric($quantity) ? (int) $quantity : 1,
                'trial_ends_at' => is_int($trialEnd) && $trialEnd > 0
                    ? \Illuminate\Support\Carbon::createFromTimestamp($trialEnd)
                    : null,
                'ends_at' => null,
            ],
        );
    }
}
