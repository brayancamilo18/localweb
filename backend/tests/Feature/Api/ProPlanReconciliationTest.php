<?php

use App\Enums\Plan;
use App\Models\Business;
use App\Models\User;
use App\Services\ProPlanReconciliationService;
use App\Services\StripeSubscriptionSyncService;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

afterEach(function () {
    StripeSubscriptionSyncService::$stripeSubscriptionForTests = null;
});

function makeReconcileFreeBusinessWithActiveSubscription(): array
{
    $business = Business::create([
        'name' => 'Free Paying',
        'subdomain' => 'free-pay-'.uniqid('', true),
        'subdomain_type' => 'random',
        'sector' => 'otros',
        'plan' => 'free',
        'is_published' => false,
    ]);
    $user = User::factory()->create([
        'business_id' => $business->id,
        'stripe_id' => 'cus_freepay_'.uniqid('', true),
    ]);
    $user->subscriptions()->create([
        'type' => 'default',
        'stripe_id' => 'sub_freepay_'.uniqid('', true),
        'stripe_status' => 'active',
        'stripe_price' => 'price_pro_test',
        'quantity' => 1,
    ]);

    return [$business, $user];
}

it('reconcile promotes free business to pro when subscription is active', function () {
    [$business, $user] = makeReconcileFreeBusinessWithActiveSubscription();

    $reconciled = app(ProPlanReconciliationService::class)->reconcile($user);

    expect($reconciled)->not->toBeNull()
        ->and($reconciled->plan)->toBe(Plan::Pro)
        ->and($reconciled->plan_activated_at)->not->toBeNull();
});

it('reconcile promotes pending business when stripe api has active subscription but no local row', function () {
    StripeSubscriptionSyncService::$stripeSubscriptionForTests = (object) [
        'id' => 'sub_stripe_only_'.uniqid('', true),
        'status' => 'active',
        'trial_end' => null,
        'items' => (object) [
            'data' => [
                (object) [
                    'price' => (object) ['id' => 'price_pro_test'],
                    'quantity' => 1,
                ],
            ],
        ],
    ];

    $business = Business::create([
        'name' => 'Pending Stripe Only',
        'subdomain' => 'pending-stripe-'.uniqid('', true),
        'subdomain_type' => 'random',
        'sector' => 'otros',
        'plan' => 'pending',
        'is_published' => false,
    ]);
    $user = User::factory()->create([
        'business_id' => $business->id,
        'stripe_id' => 'cus_pending_'.uniqid('', true),
    ]);

    expect($user->subscriptions()->exists())->toBeFalse();

    $reconciled = app(ProPlanReconciliationService::class)->reconcile($user);

    expect($reconciled->plan)->toBe(Plan::Pro)
        ->and($user->fresh()->subscriptions()->where('stripe_status', 'active')->exists())->toBeTrue();
});

it('auth me reconciles drifted plan for subscribed user', function () {
    [$business, $user] = makeReconcileFreeBusinessWithActiveSubscription();

    test()->actingAs($user)
        ->getJson('/api/v1/auth/me')
        ->assertOk()
        ->assertJsonPath('data.business.plan', 'pro');

    expect($business->fresh()->plan)->toBe(Plan::Pro);
});

it('onboarding status returns step 8 for subscribed unpublished business after reconcile', function () {
    Storage::fake('local');
    Storage::fake('r2');

    $template = \App\Models\Template::create([
        'name' => 'Noir Elite',
        'slug' => 'noir-elite',
        'primary_color' => '#C9A84C',
        'is_active' => true,
        'requires_pro' => false,
    ]);

    [$business, $user] = makeReconcileFreeBusinessWithActiveSubscription();
    $business->forceFill([
        'template_id' => $template->id,
        'name' => 'Mi negocio',
        'phone' => '600000000',
        'address' => 'Calle 1',
        'schedule' => [
            'mon' => ['open' => '09:00', 'close' => '18:00', 'closed' => false],
            'tue' => ['open' => '09:00', 'close' => '18:00', 'closed' => false],
            'wed' => ['open' => '09:00', 'close' => '18:00', 'closed' => false],
            'thu' => ['open' => '09:00', 'close' => '18:00', 'closed' => false],
            'fri' => ['open' => '09:00', 'close' => '18:00', 'closed' => false],
            'sat' => ['open' => '09:00', 'close' => '18:00', 'closed' => false],
            'sun' => ['open' => '09:00', 'close' => '18:00', 'closed' => true],
        ],
    ])->save();

    \App\Models\BusinessImage::create([
        'business_id' => $business->id,
        'section' => \App\Enums\ImageSection::Cover,
        'path' => 'businesses/'.$business->id.'/cover/test.webp',
        'display_order' => 0,
        'width' => 100,
        'height' => 100,
    ]);
    \App\Models\BusinessImage::create([
        'business_id' => $business->id,
        'section' => \App\Enums\ImageSection::Gallery,
        'path' => 'businesses/'.$business->id.'/gallery/0.webp',
        'display_order' => 0,
        'width' => 100,
        'height' => 100,
    ]);

    test()->actingAs($user)
        ->getJson('/api/v1/onboarding/status')
        ->assertOk()
        ->assertJsonPath('data.step', 8)
        ->assertJsonPath('data.is_complete', false);
});

it('onboarding status returns step 9 for subscribed published business before finalize', function () {
    Storage::fake('local');
    Storage::fake('r2');

    $template = \App\Models\Template::create([
        'name' => 'Noir Elite',
        'slug' => 'noir-elite',
        'primary_color' => '#C9A84C',
        'is_active' => true,
        'requires_pro' => false,
    ]);

    [$business, $user] = makeReconcileFreeBusinessWithActiveSubscription();
    $business->forceFill([
        'template_id' => $template->id,
        'name' => 'Mi negocio',
        'is_published' => true,
        'onboarding_completed_at' => null,
    ])->save();

    test()->actingAs($user)
        ->getJson('/api/v1/onboarding/status')
        ->assertOk()
        ->assertJsonPath('data.step', 9)
        ->assertJsonPath('data.is_complete', false);
});

it('onboarding reset does not downgrade subscribed business to free', function () {
    Storage::fake('r2');

    [$business, $user] = makeReconcileFreeBusinessWithActiveSubscription();
    $business->forceFill([
        'template_id' => 1,
        'tagline' => 'Mi tagline',
    ])->save();

    test()->actingAs($user)
        ->postJson('/api/v1/onboarding/reset')
        ->assertOk()
        ->assertJsonPath('data.skipped', true)
        ->assertJsonPath('data.step', 8);

    $business->refresh();
    expect($business->plan)->toBe(Plan::Free)
        ->and($business->tagline)->toBe('Mi tagline');

    test()->actingAs($user)
        ->getJson('/api/v1/auth/me')
        ->assertJsonPath('data.business.plan', 'pro');
});
