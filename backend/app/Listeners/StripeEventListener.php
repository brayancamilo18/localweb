<?php

namespace App\Listeners;

use App\Mail\ReferrerReachedTemplateGift;
use App\Mail\WelcomeProOnez;
use App\Models\Business;
use App\Models\ProcessedStripeEvent;
use App\Models\Referral;
use App\Models\User;
use App\Services\OnboardingMediaFinalizeService;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
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
                'invoice.payment_succeeded' => $this->handleInvoicePaymentSucceededWithReferral($payload),
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
        ];

        // Conservar la visibilidad de negocios Free ya publicados; los que aún
        // no estaban publicados (onboarding Pro directo) siguen su flujo normal
        // de publicación en step 8/9.
        if (! $business->is_published) {
            $updates['is_published'] = false;
        }

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

            $this->sendWelcomeProEmail($user, $business->fresh(), $object);
        }

        Log::info('Stripe checkout completed and business upgraded', [
            'user_id' => $metadata['user_id'] ?? null,
            'business_id' => $business->id,
            'payment_status' => $object['payment_status'] ?? null,
        ]);
    }

    /**
     * Envía el correo de bienvenida Pro tras activar el plan.
     *
     * Va envuelto en su propio try/catch para que un fallo de SMTP no propague
     * y deje el marcador `processed_stripe_events` sin tocar — si dejáramos
     * que la excepción burbujease, el `handle()` borraría el marcador y
     * Stripe reintentaría, lo que activaría el plan de nuevo y duplicaría el
     * correo en cuanto el SMTP volviese.
     *
     * Usamos `sendNow()` para enviar inline (sin queue worker), porque el
     * worker no está garantizado en local. El webhook sigue cumpliendo el
     * SLA de Stripe (~30 s).
     *
     * @param  array<string, mixed>  $object  Payload `data.object` del checkout.
     */
    protected function sendWelcomeProEmail(User $user, ?Business $business, array $object): void
    {
        if (! $business) {
            return;
        }

        try {
            $frontend = rtrim((string) config('app.frontend_url'), '/');

            $price = $this->formatStripeAmount($object['amount_total'] ?? null) ?? '8,99';
            $cycle = 'Mensual';
            $period = 'mes';
            $renewalDate = now()->addMonth()->format('d/m/Y');

            $mailable = new WelcomeProOnez(
                name: $user->name ?: '',
                email: $user->email,
                businessName: $business->name ?: 'tu negocio',
                dashboardUrl: $frontend.'/dashboard',
                billingUrl: $frontend.'/dashboard/account?tab=plan',
                cycle: $cycle,
                price: $price,
                period: $period,
                renewalDate: $renewalDate,
            );

            Mail::to($user->email)->sendNow($mailable);

            Log::info('Welcome Pro email sent after Stripe checkout', [
                'user_id' => $user->id,
                'business_id' => $business->id,
                'to' => $user->email,
            ]);
        } catch (\Throwable $e) {
            Log::error('Welcome Pro email after Stripe checkout failed', [
                'user_id' => $user->id,
                'business_id' => $business->id,
                'exception' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Convierte `amount_total` de Stripe (entero en céntimos) a un string
     * con coma decimal (formato español). Devuelve null si el valor no es
     * un entero válido para que el caller use su propio fallback.
     */
    protected function formatStripeAmount(mixed $amountCents): ?string
    {
        if (! is_int($amountCents) && ! (is_string($amountCents) && ctype_digit($amountCents))) {
            return null;
        }

        $cents = (int) $amountCents;
        if ($cents <= 0) {
            return null;
        }

        return number_format($cents / 100, 2, ',', '.');
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
    protected function handleInvoicePaymentSucceededWithReferral(array $payload): void
    {
        try {
            $this->processReferralOnPayment($payload);
        } catch (Throwable $e) {
            Log::error('Referral processing on invoice.payment_succeeded failed', [
                'event_id' => $payload['id'] ?? null,
                'invoice_id' => $payload['data']['object']['id'] ?? null,
                'exception' => $e->getMessage(),
            ]);
        }

        $this->handleInvoicePaymentSucceeded($payload);
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    protected function processReferralOnPayment(array $payload): void
    {
        $invoice = $payload['data']['object'] ?? [];
        $invoiceId = $invoice['id'] ?? null;
        $amountPaid = (int) ($invoice['amount_paid'] ?? 0);
        $customerId = $invoice['customer'] ?? null;

        if (! $invoiceId || ! $customerId) {
            return;
        }

        if ($amountPaid <= 0) {
            return;
        }

        if (Referral::query()->where('stripe_invoice_id', $invoiceId)->exists()) {
            return;
        }

        $user = User::query()->where('stripe_id', $customerId)->first();
        if (! $user) {
            return;
        }

        $referral = $user->referralAsReferred()
            ->where('status', Referral::STATUS_REGISTERED)
            ->first();

        if (! $referral) {
            return;
        }

        $referral->update([
            'status' => Referral::STATUS_PAID,
            'first_payment_at' => now(),
            'stripe_invoice_id' => $invoiceId,
        ]);

        $referral->refresh();
        $referral->load('referrer');

        if ($referral->referrer) {
            $this->maybeRewardReferrer($referral->referrer, $referral);
        }
    }

    protected function maybeRewardReferrer(User $referrer, Referral $referral): void
    {
        if (! $referrer->subscribed('default')) {
            Log::warning('Referrer has no active subscription, cannot apply reward', [
                'referrer_id' => $referrer->id,
            ]);

            return;
        }

        $couponId = config('referrals.reward_coupon_id');
        if (! is_string($couponId) || $couponId === '') {
            Log::error('STRIPE_COUPON_REFERRER_REWARD not configured');

            return;
        }

        try {
            $subscription = $referrer->subscription('default');
            $subscription->updateStripeSubscription([
                'discounts' => [['coupon' => $couponId]],
            ]);

            Log::info('Referral reward coupon applied', [
                'referrer_id' => $referrer->id,
                'coupon_id' => $couponId,
            ]);
        } catch (Throwable $e) {
            Log::error('Failed to apply referral reward coupon', [
                'referrer_id' => $referrer->id,
                'exception' => $e->getMessage(),
            ]);

            return;
        }

        $referral->update([
            'status' => Referral::STATUS_REWARDED,
            'rewarded_at' => now(),
        ]);

        $paidOrRewarded = $referrer->referralsAsReferrer()
            ->whereIn('status', [Referral::STATUS_PAID, Referral::STATUS_REWARDED])
            ->count();

        if ($paidOrRewarded !== (int) config('referrals.template_gift_at')) {
            return;
        }

        $adminEmail = config('referrals.admin_notify_email');
        if (! is_string($adminEmail) || $adminEmail === '') {
            return;
        }

        try {
            Mail::to($adminEmail)->sendNow(new ReferrerReachedTemplateGift(
                referrerName: $referrer->name,
                referrerEmail: $referrer->email,
                referrerBusinessId: $referrer->business_id,
                count: $paidOrRewarded,
            ));
        } catch (Throwable $e) {
            Log::error('Referrer template gift admin notification failed', [
                'referrer_id' => $referrer->id,
                'exception' => $e->getMessage(),
            ]);
        }
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
