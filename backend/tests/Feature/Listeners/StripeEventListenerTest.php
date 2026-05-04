<?php

use App\Listeners\StripeEventListener;
use App\Models\Business;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Log;
use Laravel\Cashier\Events\WebhookReceived;

uses(RefreshDatabase::class);

it('checkout session completed upgrades business to pro', function () {
    $business = Business::create([
        'name' => 'Checkout Biz',
        'subdomain' => 'abc-def-ghij',
        'subdomain_type' => 'random',
        'sector' => 'otros',
        'plan' => 'free',
    ]);
    $user = User::factory()->create(['business_id' => $business->id]);

    $listener = new StripeEventListener();
    $event = new WebhookReceived([
        'type' => 'checkout.session.completed',
        'data' => [
            'object' => [
                'metadata' => [
                    'user_id' => $user->id,
                    'business_id' => $business->id,
                ],
                'payment_status' => 'paid',
            ],
        ],
    ]);

    $listener->handle($event);

    expect($business->fresh()->plan->value)->toBe('pro')
        ->and($business->fresh()->is_published)->toBeTrue();
});

it('checkout session completed with invalid business id logs warning', function () {
    Log::spy();

    $listener = new StripeEventListener();
    $event = new WebhookReceived([
        'type' => 'checkout.session.completed',
        'data' => [
            'object' => [
                'metadata' => [
                    'user_id' => 1,
                    'business_id' => 999999,
                ],
                'payment_status' => 'paid',
            ],
        ],
    ]);

    $listener->handle($event);

    Log::shouldHaveReceived('warning')->once();
});

it('customer subscription deleted downgrades business to free', function () {
    $business = Business::create([
        'name' => 'Sub Biz',
        'subdomain' => 'bcd-efgh-jklm',
        'subdomain_type' => 'random',
        'sector' => 'otros',
        'plan' => 'pro',
    ]);
    $user = User::factory()->create(['business_id' => $business->id]);
    $user->forceFill(['stripe_id' => 'cus_123'])->save();

    $listener = new StripeEventListener();
    $event = new WebhookReceived([
        'type' => 'customer.subscription.deleted',
        'data' => [
            'object' => [
                'customer' => 'cus_123',
            ],
        ],
    ]);

    $listener->handle($event);

    expect($business->fresh()->plan->value)->toBe('free');
});

it('customer subscription updated past due logs warning without changing plan', function () {
    Log::spy();

    $business = Business::create([
        'name' => 'Past Due Biz',
        'subdomain' => 'cde-fghi-jklm',
        'subdomain_type' => 'random',
        'sector' => 'otros',
        'plan' => 'pro',
    ]);
    $user = User::factory()->create(['business_id' => $business->id]);
    $user->forceFill(['stripe_id' => 'cus_456'])->save();

    $listener = new StripeEventListener();
    $event = new WebhookReceived([
        'type' => 'customer.subscription.updated',
        'data' => [
            'object' => [
                'customer' => 'cus_456',
                'status' => 'past_due',
            ],
        ],
    ]);

    $listener->handle($event);

    expect($business->fresh()->plan->value)->toBe('pro');
    Log::shouldHaveReceived('warning')->once();
});
