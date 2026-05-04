<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\Config;
use Tests\TestCase;

class StripeWebhookTest extends TestCase
{
    private static function stripeTestSignatureHeader(string $payload, string $secret): string
    {
        $timestamp = time();
        $signedPayload = $timestamp.'.'.$payload;
        $signature = hash_hmac('sha256', $signedPayload, $secret);

        return "t={$timestamp},v1={$signature}";
    }

    public function test_returns_503_when_stripe_webhook_secret_is_not_configured(): void
    {
        Config::set('cashier.webhook.secret', '');

        $this->call(
            'POST',
            '/stripe/webhook',
            server: ['CONTENT_TYPE' => 'application/json'],
            content: '{"type":"invoice.paid","data":{"object":{}}}'
        )->assertStatus(503);
    }

    public function test_returns_403_for_an_invalid_stripe_signature(): void
    {
        Config::set('cashier.webhook.secret', 'whsec_test_signing_secret_32chars__');

        $this->call(
            'POST',
            '/stripe/webhook',
            server: [
                'CONTENT_TYPE' => 'application/json',
                'HTTP_STRIPE_SIGNATURE' => 't='.time().',v1=invalid',
            ],
            content: '{"type":"invoice.paid","data":{"object":{}}}'
        )->assertStatus(403);
    }

    public function test_returns_200_json_ok_for_a_valid_signed_invoice_paid_event(): void
    {
        $secret = 'whsec_test_signing_secret_32chars__';
        Config::set('cashier.webhook.secret', $secret);

        $payload = json_encode([
            'id' => 'evt_test_invoice_paid',
            'type' => 'invoice.paid',
            'data' => [
                'object' => [
                    'id' => 'in_test_1',
                    'customer' => 'cus_test_1',
                ],
            ],
        ], JSON_THROW_ON_ERROR);

        $header = self::stripeTestSignatureHeader($payload, $secret);

        $this->call(
            'POST',
            '/stripe/webhook',
            server: [
                'CONTENT_TYPE' => 'application/json',
                'HTTP_STRIPE_SIGNATURE' => $header,
            ],
            content: $payload
        )->assertOk()
            ->assertJson(['status' => 'ok']);
    }

    public function test_returns_200_json_ok_for_payment_intent_succeeded(): void
    {
        $secret = 'whsec_test_signing_secret_32chars__';
        Config::set('cashier.webhook.secret', $secret);

        $payload = json_encode([
            'id' => 'evt_test_pi_ok',
            'type' => 'payment_intent.succeeded',
            'data' => [
                'object' => [
                    'id' => 'pi_test_1',
                    'customer' => 'cus_test_1',
                ],
            ],
        ], JSON_THROW_ON_ERROR);

        $header = self::stripeTestSignatureHeader($payload, $secret);

        $this->call(
            'POST',
            '/stripe/webhook',
            server: [
                'CONTENT_TYPE' => 'application/json',
                'HTTP_STRIPE_SIGNATURE' => $header,
            ],
            content: $payload
        )->assertOk()->assertJson(['status' => 'ok']);
    }

    public function test_returns_200_json_ok_for_invoice_payment_succeeded(): void
    {
        $secret = 'whsec_test_signing_secret_32chars__';
        Config::set('cashier.webhook.secret', $secret);

        $payload = json_encode([
            'id' => 'evt_test_invoice_payment_ok',
            'type' => 'invoice.payment_succeeded',
            'data' => [
                'object' => [
                    'id' => 'in_test_2',
                    'customer' => 'cus_test_2',
                ],
            ],
        ], JSON_THROW_ON_ERROR);

        $header = self::stripeTestSignatureHeader($payload, $secret);

        $this->call(
            'POST',
            '/stripe/webhook',
            server: [
                'CONTENT_TYPE' => 'application/json',
                'HTTP_STRIPE_SIGNATURE' => $header,
            ],
            content: $payload
        )->assertOk()->assertJson(['status' => 'ok']);
    }
}
