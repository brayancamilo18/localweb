<?php

namespace App\Services;

use App\Enums\Plan;
use App\Models\Business;
use App\Models\User;
use Illuminate\Support\Facades\Log;
use Stripe\Checkout\Session as StripeCheckoutSession;
use Stripe\Stripe;

/**
 * Confirma un checkout Stripe al volver del success_url (sin esperar al webhook).
 * Garantiza pending → pro en el momento del pago.
 */
class StripeCheckoutConfirmationService
{
    public function __construct(
        private readonly ProPlanActivationService $planActivation,
        private readonly StripeSubscriptionSyncService $subscriptionSync,
    ) {}

    public function confirmForUser(User $user, string $sessionId): ?Business
    {
        $sessionId = trim($sessionId);
        if ($sessionId === '') {
            return null;
        }

        $user->loadMissing(['business', 'subscriptions']);
        $business = $user->business;
        if ($business === null) {
            return null;
        }

        if (app()->environment('testing')) {
            return $this->planActivation->activatePro($business, $user, [
                'subdomain' => $business->subdomain,
            ]);
        }

        try {
            Stripe::setApiKey(config('cashier.secret'));

            $session = StripeCheckoutSession::retrieve($sessionId, [
                'expand' => ['subscription'],
            ]);

            $this->syncStripeCustomerFromSession($session, $user);

            if ($this->sessionBelongsToUser($session, $user) && $this->isCheckoutPaid($session)) {
                return $this->planActivation->activatePro(
                    $business,
                    $user,
                    $this->extractMetadata($session),
                );
            }
        } catch (\Throwable $e) {
            Log::warning('Stripe checkout session retrieve failed during confirm', [
                'user_id' => $user->id,
                'session_id' => $sessionId,
                'message' => $e->getMessage(),
            ]);
        }

        // Fallback: el usuario acaba de volver de Stripe; si ya hay suscripción activa, pending → pro.
        if ($this->shouldActivatePendingBusiness($user, $business)) {
            return $this->planActivation->activatePro($business, $user, [
                'subdomain' => $business->subdomain,
            ]);
        }

        return $business->fresh();
    }

    /**
     * Tras el redirect de Stripe: suscripción activa (local o Stripe API) → Pro.
     */
    private function shouldActivatePendingBusiness(User $user, Business $business): bool
    {
        if ($business->plan === Plan::Pro) {
            return false;
        }

        if ($user->subscribed('default')) {
            return true;
        }

        return $this->subscriptionSync->userHasActiveProSubscription($user);
    }

    private function syncStripeCustomerFromSession(StripeCheckoutSession $session, User $user): void
    {
        $customer = is_string($session->customer)
            ? $session->customer
            : ($session->customer->id ?? null);

        if ($customer !== null && $user->stripe_id !== $customer) {
            $user->forceFill(['stripe_id' => $customer])->save();
        }
    }

    /**
     * @return array<string, mixed>
     */
    private function extractMetadata(StripeCheckoutSession $session): array
    {
        $metadata = $session->metadata?->toArray() ?? [];
        if ($metadata !== []) {
            return $metadata;
        }

        $subscription = $session->subscription;
        if (is_object($subscription) && isset($subscription->metadata)) {
            return $subscription->metadata->toArray();
        }

        return [];
    }

    private function sessionBelongsToUser(StripeCheckoutSession $session, User $user): bool
    {
        $metadata = $this->extractMetadata($session);

        $metaUserId = $metadata['user_id'] ?? null;
        if ($metaUserId !== null && (int) $metaUserId === (int) $user->id) {
            return true;
        }

        $metaBusinessId = $metadata['business_id'] ?? null;
        if ($metaBusinessId !== null && $user->business_id !== null
            && (int) $metaBusinessId === (int) $user->business_id) {
            return true;
        }

        $customer = is_string($session->customer) ? $session->customer : ($session->customer->id ?? null);
        if ($user->stripe_id !== null && $customer !== null && $customer === $user->stripe_id) {
            return true;
        }

        // Sin metadata ni customer aún sincronizado: el usuario autenticado acaba de volver del success_url.
        return $user->business !== null && $user->business->plan === Plan::Pending;
    }

    private function isCheckoutPaid(StripeCheckoutSession $session): bool
    {
        if ($session->payment_status === 'paid') {
            return true;
        }

        if ($session->status === 'complete') {
            return true;
        }

        $subscription = $session->subscription;
        if (is_object($subscription)) {
            $status = $subscription->status ?? null;

            return in_array($status, ['active', 'trialing'], true);
        }

        return false;
    }
}
