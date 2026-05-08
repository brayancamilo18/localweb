<?php

namespace App\Listeners;

use App\Models\Business;
use App\Models\ProcessedStripeEvent;
use App\Models\User;
use App\Services\OnboardingMediaFinalizeService;
use Illuminate\Support\Facades\Log;
use Laravel\Cashier\Events\WebhookReceived;
use Throwable;

class StripeEventListener
{
    public function handle(WebhookReceived $event): void
    {
        $payload = $event->payload;
        $eventType = $payload['type'] ?? null;
        $eventId = $payload['id'] ?? null;

        if (! $eventId) {
            return;
        }

        $marker = ProcessedStripeEvent::firstOrCreate(
            ['event_id' => $eventId],
            ['event_type' => $eventType ?? 'unknown', 'processed_at' => now()],
        );

        if (! $marker->wasRecentlyCreated) {
            Log::info('Stripe event duplicate, skipping', [
                'event_id' => $eventId,
                'event_type' => $eventType,
            ]);

            return;
        }

        try {
            match ($eventType) {
                'checkout.session.completed' => $this->handleCheckoutCompleted($payload['data']['object'] ?? []),
                'customer.subscription.deleted' => $this->handleSubscriptionDeleted($payload['data']['object'] ?? []),
                'customer.subscription.updated' => $this->handleSubscriptionUpdated($payload['data']['object'] ?? []),
                'customer.subscription.trial_will_end' => $this->handleTrialWillEnd($payload['data']['object'] ?? []),
                'invoice.payment_failed' => $this->handleInvoicePaymentFailed($payload),
                'payment_intent.succeeded' => $this->handlePaymentIntentSucceeded($payload),
                'invoice.paid' => $this->handleInvoicePaid($payload),
                'invoice.payment_succeeded' => $this->handleInvoicePaymentSucceeded($payload),
                default => null,
            };
        } catch (Throwable $e) {
            // Borramos el marcador para que el reintento de Stripe vuelva a procesar el evento.
            $marker->delete();
            throw $e;
        }
    }

    protected function handleCheckoutCompleted(array $object): void
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

    protected function handleSubscriptionDeleted(array $object): void
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

    /**
     * Maneja transiciones de estado de la suscripción.
     *
     * Reglas:
     *  - Estados terminales (canceled, incomplete_expired, unpaid) → degradar a free + plan_activated_at=null.
     *  - past_due → log warning, NO degradar (Stripe puede recuperar el cobro).
     *  - active con previousStatus en (past_due, trialing, incomplete) → asegurar pro y conservar
     *    plan_activated_at si ya existía (no resetear en simple recuperación).
     *
     * Idempotencia: cualquier llamada repetida produce el mismo estado final
     * (Eloquent no dispara updated cuando no hay cambios efectivos).
     */
    protected function handleSubscriptionUpdated(array $object): void
    {
        $stripeCustomerId = $object['customer'] ?? null;
        $status = $object['status'] ?? null;
        $previousStatus = $object['previous_attributes']['status'] ?? null;

        $user = $stripeCustomerId ? User::where('stripe_id', $stripeCustomerId)->first() : null;
        if (! $user?->business) {
            return;
        }

        if (in_array($status, ['canceled', 'incomplete_expired', 'unpaid'], true)) {
            $user->business->update([
                'plan' => 'free',
                'plan_activated_at' => null,
            ]);

            Log::info('Stripe subscription terminal state, downgraded', [
                'user_id' => $user->id,
                'business_id' => $user->business->id,
                'status' => $status,
                'previous_status' => $previousStatus,
            ]);

            return;
        }

        if ($status === 'past_due') {
            Log::warning('Stripe subscription in collection risk state', [
                'user_id' => $user->id,
                'business_id' => $user->business->id,
                'status' => $status,
            ]);

            return;
        }

        if ($status === 'active' && in_array($previousStatus, ['past_due', 'trialing', 'incomplete'], true)) {
            $user->business->update([
                'plan' => 'pro',
                // Conservar plan_activated_at si ya existía (recuperación de past_due / trial→active).
                'plan_activated_at' => $user->business->plan_activated_at ?? now(),
            ]);

            Log::info('Stripe subscription transitioned to active', [
                'user_id' => $user->id,
                'business_id' => $user->business->id,
                'previous_status' => $previousStatus,
            ]);
        }
    }

    protected function handleTrialWillEnd(array $object): void
    {
        Log::info('Stripe subscription trial_will_end', [
            'subscription' => $object['id'] ?? null,
            'customer' => $object['customer'] ?? null,
            'trial_end' => $object['trial_end'] ?? null,
        ]);
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    protected function handleInvoicePaymentFailed(array $payload): void
    {
        $object = $payload['data']['object'] ?? [];

        // No degradamos aquí: dejamos que Stripe transicione la subscription a past_due/unpaid
        // y reaccionamos en handleSubscriptionUpdated. Solo registramos el aviso.
        Log::warning('Stripe invoice.payment_failed', [
            'event_id' => $payload['id'] ?? null,
            'invoice' => $object['id'] ?? null,
            'customer' => $object['customer'] ?? null,
            'attempt_count' => $object['attempt_count'] ?? null,
        ]);
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    protected function handlePaymentIntentSucceeded(array $payload): void
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
    protected function handleInvoicePaid(array $payload): void
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
    protected function handleInvoicePaymentSucceeded(array $payload): void
    {
        $object = $payload['data']['object'] ?? [];
        Log::info('Stripe invoice.payment_succeeded', [
            'event_id' => $payload['id'] ?? null,
            'invoice' => $object['id'] ?? null,
            'customer' => $object['customer'] ?? null,
        ]);
    }
}
