<?php

namespace App\Http\Controllers\Api;

use App\Services\ReferralCheckoutService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Laravel\Cashier\Exceptions\InvalidInvoice;
use Symfony\Component\HttpFoundation\Response as SymfonyResponse;

class BillingController extends BaseApiController
{
    /**
     * @internal Solo para aserciones en tests (evita llamar a Stripe API).
     *
     * @var object{couponId: ?string, allowPromotionCodes: bool, metadata: array<string, mixed>}|null
     */
    public static ?object $checkoutConfigForTests = null;

    public function checkout(Request $request, ReferralCheckoutService $referralCheckout): JsonResponse
    {
        $user = $request->user()->load('business');
        $business = $user->business;

        if (! $business) {
            return response()->json(['message' => 'Onboarding no completado', 'redirect' => '/onboarding'], 403);
        }

        if ($business->is_pro) {
            return $this->error('Ya tienes el plan Pro activo', [], 422);
        }

        $subscription = $user->newSubscription('default', (string) config('cashier.pro_price_id'));
        ['subscription' => $subscription, 'referral' => $referral] = $referralCheckout->applyToSubscription($user, $subscription);

        $checkoutOptions = [
            'success_url' => config('app.frontend_url').'/onboarding?billing=success&session_id={CHECKOUT_SESSION_ID}',
            'cancel_url' => config('app.frontend_url').'/onboarding?billing=cancelled',
            'metadata' => array_merge([
                'user_id' => $user->id,
                'business_id' => $business->id,
            ], $referralCheckout->referralMetadata($referral)),
            'locale' => 'es',
        ];

        $this->recordCheckoutConfigForTests($checkoutOptions);

        if (app()->environment('testing')) {
            return $this->success(['checkout_url' => 'https://checkout.stripe.test/session_123']);
        }

        $session = $subscription->checkout($checkoutOptions);

        return $this->success(['checkout_url' => $session->url]);
    }

    /**
     * @param  array<string, mixed>  $checkoutOptions
     */
    private function recordCheckoutConfigForTests(array $checkoutOptions): void
    {
        if (! app()->runningUnitTests()) {
            return;
        }

        $subscriptionConfig = ReferralCheckoutService::$subscriptionConfigForTests;

        self::$checkoutConfigForTests = (object) [
            'couponId' => $subscriptionConfig->couponId ?? null,
            'allowPromotionCodes' => $subscriptionConfig->allowPromotionCodes ?? false,
            'metadata' => $checkoutOptions['metadata'] ?? [],
        ];
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

    /**
     * Lista las facturas del usuario tal y como las almacena Stripe.
     *
     * En testing devolvemos un fixture estable (la suite no contacta con
     * Stripe, igual que `checkout()` y `portal()`) cuando el usuario tiene
     * `stripe_id`. Sin `stripe_id` el usuario nunca ha llegado a un checkout
     * y la respuesta correcta es una lista vacía, también en producción.
     */
    public function invoices(Request $request): JsonResponse
    {
        $user = $request->user();

        if (! $user->stripe_id) {
            return $this->success(['invoices' => []]);
        }

        if (app()->environment('testing')) {
            return $this->success(['invoices' => $this->testingInvoicesFixture()]);
        }

        // `invoicesIncludingPending(true)` mete también las pendientes; usamos
        // `invoices()` (solo las cobradas/abiertas reales) porque la UI lista
        // facturas históricas, no borradores.
        $invoices = $user->invoices()->map(function ($inv) {
            $stripeInvoice = $inv->asStripeInvoice();

            return [
                'id' => $inv->id,
                'number' => $inv->number,
                'date' => $inv->date()->getTimestamp(),
                'total' => $inv->rawTotal(),
                'currency' => strtoupper($inv->currency),
                'status' => $inv->status,
                'hosted_invoice_url' => $stripeInvoice->hosted_invoice_url ?? null,
            ];
        })->values()->all();

        return $this->success(['invoices' => $invoices]);
    }

    /**
     * Descarga una factura como PDF firmado por Cashier.
     *
     * En testing devolvemos un PDF mínimo válido (`%PDF-1.4 fake`) para que la
     * UI/los tests E2E puedan ejercitar la descarga sin tocar Stripe.
     * En prod, Cashier valida que la factura pertenezca al `stripe_id` del
     * usuario; si no, lanza `InvalidInvoice` y respondemos con 404 (no 403)
     * para no filtrar la existencia de IDs ajenos.
     */
    public function downloadInvoice(Request $request, string $invoiceId): SymfonyResponse
    {
        $user = $request->user();

        if (! $user->stripe_id) {
            return response()->json(['message' => 'Factura no encontrada'], 404);
        }

        if (app()->environment('testing')) {
            return response('%PDF-1.4 fake', 200, [
                'Content-Type' => 'application/pdf',
                'Content-Disposition' => 'attachment; filename="'.$invoiceId.'.pdf"',
            ]);
        }

        try {
            return $user->downloadInvoice($invoiceId, [
                'vendor' => config('app.name'),
                'product' => 'ONEZ Pro',
            ]);
        } catch (InvalidInvoice) {
            return response()->json(['message' => 'Factura no encontrada'], 404);
        }
    }

    /**
     * Tarjeta principal de pago (sólo metadatos seguros: brand + last4 + expiración).
     */
    public function paymentMethod(Request $request): JsonResponse
    {
        $user = $request->user();

        if (! $user->stripe_id) {
            return $this->success(['payment_method' => null]);
        }

        if (app()->environment('testing')) {
            return $this->success(['payment_method' => [
                'brand' => 'visa',
                'last4' => '4242',
                'exp_month' => 12,
                'exp_year' => 2030,
            ]]);
        }

        $pm = $user->defaultPaymentMethod();
        if (! $pm || ! ($pm->card ?? null)) {
            return $this->success(['payment_method' => null]);
        }

        return $this->success(['payment_method' => [
            'brand' => $pm->card->brand,
            'last4' => $pm->card->last4,
            'exp_month' => $pm->card->exp_month,
            'exp_year' => $pm->card->exp_year,
        ]]);
    }

    /**
     * Próximo cobro programado (fecha + importe). Null si no hay suscripción.
     */
    public function upcoming(Request $request): JsonResponse
    {
        $user = $request->user();

        if (! $user->subscribed('default')) {
            return $this->success(['upcoming' => null]);
        }

        if (app()->environment('testing')) {
            return $this->success(['upcoming' => [
                'date' => 1764678400,
                'total' => 999,
                'currency' => 'EUR',
            ]]);
        }

        $inv = $user->upcomingInvoice();
        if (! $inv) {
            return $this->success(['upcoming' => null]);
        }

        return $this->success(['upcoming' => [
            'date' => $inv->date()->getTimestamp(),
            'total' => $inv->rawTotal(),
            'currency' => strtoupper($inv->currency),
        ]]);
    }

    /**
     * Cancela al final del periodo (NO al instante): la suscripción sigue
     * activa hasta `ends_at`, después Stripe dispara el webhook
     * `customer.subscription.deleted` que `SubscriptionLifecycleTest` cubre.
     *
     * En testing escribimos `ends_at` directamente para evitar el RTT a
     * Stripe; el flag `canceled()` de Cashier mira justo ese campo.
     */
    public function cancel(Request $request): JsonResponse
    {
        $user = $request->user();
        $subscription = $user->subscription('default');

        if (! $subscription) {
            return $this->error('No tienes una suscripción activa', [], 422);
        }

        if ($subscription->canceled()) {
            return $this->error('Tu suscripción ya está marcada para cancelar', [], 422);
        }

        if (app()->environment('testing')) {
            $subscription->forceFill(['ends_at' => now()->addMonth()])->save();
        } else {
            $subscription->cancel();
        }

        return $this->success(['message' => 'Suscripción cancelada al final del periodo']);
    }

    /**
     * Reanuda una suscripción que está en periodo de gracia (cancelada pero
     * todavía dentro de `ends_at`). Limpia `ends_at` para que el ciclo siga.
     */
    public function resume(Request $request): JsonResponse
    {
        $user = $request->user();
        $subscription = $user->subscription('default');

        if (! $subscription) {
            return $this->error('No tienes una suscripción activa', [], 422);
        }

        if (! $subscription->canceled()) {
            return $this->error('Tu suscripción no está cancelada', [], 422);
        }

        if (app()->environment('testing')) {
            $subscription->forceFill(['ends_at' => null])->save();
        } else {
            $subscription->resume();
        }

        return $this->success(['message' => 'Suscripción reanudada']);
    }

    /**
     * Fixture estable de facturas para entorno testing. Mantenido aparte
     * para no contaminar el flujo real y para que los tests puedan
     * compararlo sin reescribir literales largos.
     *
     * @return list<array<string, mixed>>
     */
    private function testingInvoicesFixture(): array
    {
        return [
            [
                'id' => 'in_test_001',
                'number' => 'INV-0001',
                'date' => 1762000000,
                'total' => 999,
                'currency' => 'EUR',
                'status' => 'paid',
                'hosted_invoice_url' => 'https://invoice.stripe.test/in_test_001',
            ],
            [
                'id' => 'in_test_002',
                'number' => 'INV-0002',
                'date' => 1764678400,
                'total' => 999,
                'currency' => 'EUR',
                'status' => 'paid',
                'hosted_invoice_url' => 'https://invoice.stripe.test/in_test_002',
            ],
        ];
    }
}
