<?php

use App\Enums\Plan;
use App\Models\Business;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Cashier\Events\WebhookReceived;

uses(RefreshDatabase::class);

it('downgrades business to free when Stripe sends customer.subscription.deleted', function () {
    $business = Business::create([
        'name' => 'Sub Deleted',
        'subdomain' => 'sub-del-'.substr(bin2hex(random_bytes(4)), 0, 10),
        'subdomain_type' => 'custom',
        'sector' => 'otros',
        'plan' => Plan::Pro,
        'plan_activated_at' => now(),
        'is_published' => true,
    ]);
    $user = User::factory()->create(['business_id' => $business->id]);
    $user->forceFill(['stripe_id' => 'cus_sub_deleted_flow'])->save();

    event(new WebhookReceived([
        'id' => 'evt_sub_deleted_'.uniqid(),
        'type' => 'customer.subscription.deleted',
        'data' => [
            'object' => [
                'customer' => 'cus_sub_deleted_flow',
            ],
        ],
    ]));

    $business->refresh();

    expect($business->plan)->toBe(Plan::Free)
        ->and($business->plan_activated_at)->toBeNull();
});

it('downgrades business to free when subscription.updated reports canceled status', function () {
    $business = Business::create([
        'name' => 'Sub Canceled',
        'subdomain' => 'sub-can-'.substr(bin2hex(random_bytes(4)), 0, 10),
        'subdomain_type' => 'custom',
        'sector' => 'otros',
        'plan' => Plan::Pro,
        'plan_activated_at' => now(),
        'is_published' => true,
    ]);
    $user = User::factory()->create(['business_id' => $business->id]);
    $user->forceFill(['stripe_id' => 'cus_sub_canceled_flow'])->save();

    event(new WebhookReceived([
        'id' => 'evt_sub_canceled_'.uniqid(),
        'type' => 'customer.subscription.updated',
        'data' => [
            'object' => [
                'customer' => 'cus_sub_canceled_flow',
                'status' => 'canceled',
                'previous_attributes' => [
                    'status' => 'active',
                ],
            ],
        ],
    ]));

    $business->refresh();

    expect($business->plan)->toBe(Plan::Free)
        ->and($business->plan_activated_at)->toBeNull();
});

it('does not downgrade pro when subscription.updated enters past_due', function () {
    $activatedAt = now()->subDays(3);

    $business = Business::create([
        'name' => 'Sub Past Due',
        'subdomain' => 'sub-pd-'.substr(bin2hex(random_bytes(4)), 0, 10),
        'subdomain_type' => 'custom',
        'sector' => 'otros',
        'plan' => Plan::Pro,
        'plan_activated_at' => $activatedAt,
        'is_published' => true,
    ]);
    $user = User::factory()->create(['business_id' => $business->id]);
    $user->forceFill(['stripe_id' => 'cus_sub_pastdue_flow'])->save();

    event(new WebhookReceived([
        'id' => 'evt_sub_pastdue_'.uniqid(),
        'type' => 'customer.subscription.updated',
        'data' => [
            'object' => [
                'customer' => 'cus_sub_pastdue_flow',
                'status' => 'past_due',
                'previous_attributes' => [
                    'status' => 'active',
                ],
            ],
        ],
    ]));

    $business->refresh();

    expect($business->plan)->toBe(Plan::Pro)
        ->and($business->plan_activated_at->timestamp)->toBe($activatedAt->timestamp);
});

it('returns subscription to pro after past_due resolves to active without resetting plan_activated_at', function () {
    $activatedAt = now()->subDays(5);

    $business = Business::create([
        'name' => 'Sub Recovery',
        'subdomain' => 'sub-rec-'.substr(bin2hex(random_bytes(4)), 0, 10),
        'subdomain_type' => 'custom',
        'sector' => 'otros',
        'plan' => Plan::Pro,
        'plan_activated_at' => $activatedAt,
        'is_published' => true,
    ]);
    $user = User::factory()->create(['business_id' => $business->id]);
    $user->forceFill(['stripe_id' => 'cus_sub_recovery_flow'])->save();

    event(new WebhookReceived([
        'id' => 'evt_sub_into_pastdue_'.uniqid(),
        'type' => 'customer.subscription.updated',
        'data' => [
            'object' => [
                'customer' => 'cus_sub_recovery_flow',
                'status' => 'past_due',
                'previous_attributes' => [
                    'status' => 'active',
                ],
            ],
        ],
    ]));

    $business->refresh();
    expect($business->plan)->toBe(Plan::Pro);

    event(new WebhookReceived([
        'id' => 'evt_sub_back_active_'.uniqid(),
        'type' => 'customer.subscription.updated',
        'data' => [
            'object' => [
                'customer' => 'cus_sub_recovery_flow',
                'status' => 'active',
                'previous_attributes' => [
                    'status' => 'past_due',
                ],
            ],
        ],
    ]));

    $business->refresh();

    expect($business->plan)->toBe(Plan::Pro)
        ->and($business->plan_activated_at->timestamp)->toBe($activatedAt->timestamp);
});
