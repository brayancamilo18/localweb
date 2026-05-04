<?php

namespace App\Http\Controllers;

use Laravel\Cashier\Http\Controllers\WebhookController as CashierWebhookController;
use Laravel\Cashier\Http\Middleware\VerifyWebhookSignature;
use Symfony\Component\HttpFoundation\Response as SymfonyResponse;

/**
 * Webhook Stripe: verificación de firma (STRIPE_WEBHOOK_SECRET) y delegación en Cashier
 * para suscripciones; respuesta JSON acordada con el cliente de Stripe.
 */
class StripeWebhookController extends CashierWebhookController
{
    public function __construct()
    {
        $secret = (string) (config('cashier.webhook.secret') ?? '');
        if ($secret === '') {
            abort(response()->json(['message' => 'Stripe webhook secret is not configured'], 503));
        }

        $this->middleware(VerifyWebhookSignature::class);
    }

    /**
     * @param  array<string, mixed>  $parameters
     */
    protected function successMethod($parameters = []): SymfonyResponse
    {
        return response()->json(['status' => 'ok']);
    }

    /**
     * @param  array<string, mixed>  $parameters
     */
    protected function missingMethod($parameters = []): SymfonyResponse
    {
        return response()->json(['status' => 'ok']);
    }
}
