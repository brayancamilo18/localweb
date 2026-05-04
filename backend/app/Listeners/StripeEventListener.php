<?php

namespace App\Listeners;

use App\Models\Business;
use App\Models\User;
use App\Services\OnboardingMediaFinalizeService;
use Illuminate\Support\Facades\Log;
use Laravel\Cashier\Events\WebhookReceived;

class StripeEventListener
{
    public function handle(WebhookReceived $event): void
    {
        $payload = $event->payload;
        $eventType = $payload['type'] ?? null;

        match ($eventType) {
            'checkout.session.completed' => $this->handleCheckoutCompleted($payload['data']['object'] ?? []),
            'customer.subscription.deleted' => $this->handleSubscriptionDeleted($payload['data']['object'] ?? []),
            'customer.subscription.updated' => $this->handleSubscriptionUpdated($payload['data']['object'] ?? []),
            'payment_intent.succeeded' => $this->handlePaymentIntentSucceeded($payload),
            'invoice.paid' => $this->handleInvoicePaid($payload),
            'invoice.payment_succeeded' => $this->handleInvoicePaymentSucceeded($payload),
            default => null,
        };
    }

    private function handleCheckoutCompleted(array $object): void
    {
        $metadata = $object['metadata'] ?? [];
        $businessId = $metadata['business_id'] ?? null;

        $business = $businessId ? Business::find($businessId) : null;
        if (! $business) {
            Log::warning('Stripe checkout completed with invalid business_id', ['business_id' => $businessId]);

            return;
        }

        $updates = [
            'plan' => 'pro',
            'plan_activated_at' => now(),
            'is_published' => true,
        ];

        if (($business->subdomain_type === 'random') && ! empty($metadata['subdomain'])) {
            $updates['subdomain'] = $metadata['subdomain'];
        }

        $business->update($updates);

        $userId = isset($metadata['user_id']) ? (int) $metadata['user_id'] : null;
        $user = $userId ? User::find($userId) : null;
        if ($user) {
            try {
                app(OnboardingMediaFinalizeService::class)->finalizeFromCache($user, $business->fresh());
            } catch (\Throwable $e) {
                Log::error('Onboarding media finalize after Stripe checkout failed', [
                    'user_id' => $user->id,
                    'business_id' => $business->id,
                    'exception' => $e->getMessage(),
                ]);
            }
        }

        Log::info('Stripe checkout completed and business upgraded', [
            'user_id' => $metadata['user_id'] ?? null,
            'business_id' => $business->id,
            'payment_status' => $object['payment_status'] ?? null,
        ]);
    }

    private function handleSubscriptionDeleted(array $object): void
    {
        $stripeCustomerId = $object['customer'] ?? null;
        if (! $stripeCustomerId) {
            return;
        }

        $user = User::where('stripe_id', $stripeCustomerId)->first();
        if (! $user?->business) {
            return;
        }

        $user->business->update([
            'plan' => 'free',
            'plan_activated_at' => null,
        ]);

        Log::info('Stripe subscription deleted, downgraded business', [
            'user_id' => $user->id,
            'business_id' => $user->business->id,
        ]);
    }

    private function handleSubscriptionUpdated(array $object): void
    {
        $stripeCustomerId = $object['customer'] ?? null;
        $status = $object['status'] ?? null;
        $previousStatus = $object['previous_attributes']['status'] ?? null;

        $user = $stripeCustomerId ? User::where('stripe_id', $stripeCustomerId)->first() : null;
        if (! $user?->business) {
            return;
        }

        if (in_array($status, ['past_due', 'unpaid'], true)) {
            Log::warning('Stripe subscription in collection risk state', [
                'user_id' => $user->id,
                'status' => $status,
            ]);

            return;
        }

        if ($status === 'active' && $previousStatus === 'past_due') {
            $user->business->update([
                'plan' => 'pro',
                'plan_activated_at' => $user->business->plan_activated_at ?? now(),
            ]);

            Log::info('Stripe subscription recovered to active', [
                'user_id' => $user->id,
            ]);
        }
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    private function handlePaymentIntentSucceeded(array $payload): void
    {
        $object = $payload['data']['object'] ?? [];
        Log::info('Stripe payment_intent.succeeded', [
            'event_id' => $payload['id'] ?? null,
            'payment_intent' => $object['id'] ?? null,
            'customer' => $object['customer'] ?? null,
        ]);
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    private function handleInvoicePaid(array $payload): void
    {
        $object = $payload['data']['object'] ?? [];
        Log::info('Stripe invoice.paid', [
            'event_id' => $payload['id'] ?? null,
            'invoice' => $object['id'] ?? null,
            'customer' => $object['customer'] ?? null,
        ]);
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    private function handleInvoicePaymentSucceeded(array $payload): void
    {
        $object = $payload['data']['object'] ?? [];
        Log::info('Stripe invoice.payment_succeeded', [
            'event_id' => $payload['id'] ?? null,
            'invoice' => $object['id'] ?? null,
            'customer' => $object['customer'] ?? null,
        ]);
    }
}
