<?php

use App\Http\Controllers\Api\BillingController;
use App\Models\Business;
use App\Models\Referral;
use App\Models\User;
use App\Services\ReferralCheckoutService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Log\Events\MessageLogged;
use Illuminate\Support\Facades\Event;

uses(RefreshDatabase::class);

beforeEach(function () {
    BillingController::$checkoutConfigForTests = null;
    ReferralCheckoutService::$subscriptionConfigForTests = null;

    config([
        'referrals.ref_coupon_id' => 'REF-WELCOME-FIRST-FREE-TEST',
        'referrals.reward_coupon_id' => 'coupon_referrer_reward_test',
    ]);
});

function freeBusinessUser(): User
{
    $business = Business::create([
        'name' => 'Free Biz',
        'subdomain' => 'ref-chk-'.substr(bin2hex(random_bytes(4)), 0, 8),
        'subdomain_type' => 'random',
        'sector' => 'otros',
        'plan' => 'free',
    ]);

    return User::factory()->create(['business_id' => $business->id]);
}

it('applies withCoupon and referral metadata when user has a pending referral', function () {
    $user = freeBusinessUser();
    $referrer = User::factory()->create();

    $referral = Referral::create([
        'referrer_user_id' => $referrer->id,
        'referred_user_id' => $user->id,
        'referred_email' => $user->email,
        'status' => Referral::STATUS_REGISTERED,
    ]);

    test()->actingAs($user)
        ->postJson('/api/v1/billing/checkout')
        ->assertOk()
        ->assertJsonPath('data.checkout_url', 'https://checkout.stripe.test/session_123');

    $config = BillingController::$checkoutConfigForTests;

    expect($config)->not->toBeNull()
        ->and($config->couponId)->toBe(config('referrals.ref_coupon_id'))
        ->and($config->allowPromotionCodes)->toBeFalse()
        ->and($config->metadata['referral_id'])->toBe($referral->id)
        ->and($config->metadata)->toHaveKeys(['user_id', 'business_id', 'referral_id']);
});

it('uses allowPromotionCodes when user has no pending referral', function () {
    $user = freeBusinessUser();

    test()->actingAs($user)
        ->postJson('/api/v1/billing/checkout')
        ->assertOk()
        ->assertJsonPath('data.checkout_url', 'https://checkout.stripe.test/session_123');

    $config = BillingController::$checkoutConfigForTests;

    expect($config)->not->toBeNull()
        ->and($config->allowPromotionCodes)->toBeTrue()
        ->and($config->couponId)->toBeNull()
        ->and($config->metadata)->not->toHaveKey('referral_id');
});

it('uses allowPromotionCodes and logs warning when ref coupon is not configured', function () {
    Event::fake([MessageLogged::class]);
    config(['referrals.ref_coupon_id' => null]);

    $user = freeBusinessUser();
    $referrer = User::factory()->create();

    Referral::create([
        'referrer_user_id' => $referrer->id,
        'referred_user_id' => $user->id,
        'referred_email' => $user->email,
        'status' => Referral::STATUS_REGISTERED,
    ]);

    test()->actingAs($user)
        ->postJson('/api/v1/billing/checkout')
        ->assertOk()
        ->assertJsonPath('data.checkout_url', 'https://checkout.stripe.test/session_123');

    $config = BillingController::$checkoutConfigForTests;

    expect($config->couponId)->toBeNull()
        ->and($config->allowPromotionCodes)->toBeTrue();

    Event::assertDispatched(MessageLogged::class, fn (MessageLogged $event) => $event->level === 'warning'
        && $event->message === 'Referral first-free coupon not configured');
});

it('returns 422 on checkout when business is already Pro', function () {
    $business = Business::create([
        'name' => 'Pro Biz',
        'subdomain' => 'pro-ref-chk',
        'subdomain_type' => 'random',
        'sector' => 'otros',
        'plan' => 'pro',
    ]);
    $user = User::factory()->create(['business_id' => $business->id]);

    test()->actingAs($user)
        ->postJson('/api/v1/billing/checkout')
        ->assertStatus(422)
        ->assertJsonPath('message', 'Ya tienes el plan Pro activo');

    expect(BillingController::$checkoutConfigForTests)->toBeNull();
});
