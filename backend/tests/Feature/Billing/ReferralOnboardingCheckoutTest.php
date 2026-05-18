<?php

use App\Models\Referral;
use App\Models\Template;
use App\Models\User;
use App\Services\ReferralCheckoutService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;

uses(RefreshDatabase::class);

beforeEach(function () {
    ReferralCheckoutService::$subscriptionConfigForTests = null;
    config(['referrals.ref_coupon_id' => 'REF-WELCOME-FIRST-FREE-TEST']);
});

it('applies referral coupon on onboarding step7 pro checkout', function () {
    $template = Template::create([
        'name' => 'Noir Elite',
        'slug' => 'noir-elite',
        'primary_color' => '#C9A84C',
        'is_active' => true,
        'requires_pro' => false,
    ]);

    $user = User::factory()->create();
    $referrer = User::factory()->create();

    Referral::create([
        'referrer_user_id' => $referrer->id,
        'referred_user_id' => $user->id,
        'referred_email' => $user->email,
        'status' => Referral::STATUS_REGISTERED,
    ]);

    $sub = 'ref-onb-'.substr(bin2hex(random_bytes(4)), 0, 8);
    Cache::put("onboarding:{$user->id}", [
        'template_id' => $template->id,
        'sector' => 'otros',
        'business_name' => 'Referred Pro Biz',
    ], now()->addHours(4));

    test()->actingAs($user)
        ->postJson('/api/v1/onboarding/step/7', [
            'plan' => 'pro',
            'subdomain' => $sub,
        ])
        ->assertOk()
        ->assertJsonPath('data.checkout_url', 'https://checkout.stripe.test/session_onboarding_pro');

    $config = ReferralCheckoutService::$subscriptionConfigForTests;

    expect($config)->not->toBeNull()
        ->and($config->couponId)->toBe('REF-WELCOME-FIRST-FREE-TEST')
        ->and($config->allowPromotionCodes)->toBeFalse();
});
