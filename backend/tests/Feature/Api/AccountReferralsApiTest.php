<?php

use App\Models\Business;
use App\Models\Referral;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
uses(RefreshDatabase::class);

it('returns 403 for free users on GET /account/referrals', function () {
    $business = Business::create([
        'name' => 'Free Biz',
        'subdomain' => 'free-ref-api',
        'subdomain_type' => 'random',
        'sector' => 'otros',
        'plan' => 'free',
    ]);
    $user = User::factory()->create(['business_id' => $business->id]);

    test()->actingAs($user)
        ->getJson('/api/v1/account/referrals')
        ->assertStatus(403)
        ->assertJsonPath('message', 'Esta función solo está disponible en el plan Pro.');
});

it('returns empty referrals structure for pro user without referrals', function () {
    $business = Business::create([
        'name' => 'Pro Biz',
        'subdomain' => 'pro-ref-empty',
        'subdomain_type' => 'random',
        'sector' => 'otros',
        'plan' => 'pro',
    ]);
    $user = User::factory()->create(['business_id' => $business->id]);

    $response = test()->actingAs($user)
        ->getJson('/api/v1/account/referrals')
        ->assertOk();

    expect($response->json('data.code'))->toMatch('/^[a-z0-9]{8}$/')
        ->and($response->json('data.link'))->toContain('/r/'.$response->json('data.code'))
        ->and($response->json('data.counts'))->toBe([
            'total' => 0,
            'paid' => 0,
            'rewarded' => 0,
            'pending' => 0,
        ])
        ->and($response->json('data.referrals'))->toBe([]);
});

it('returns correct counts and masked emails for pro user with mixed referrals', function () {
    config([
        'referrals.reward_threshold' => 1,
        'referrals.max_referrals' => 5,
        'referrals.template_gift_at' => 5,
    ]);

    $business = Business::create([
        'name' => 'Pro Biz Mix',
        'subdomain' => 'pro-ref-mix',
        'subdomain_type' => 'random',
        'sector' => 'otros',
        'plan' => 'pro',
    ]);
    $referrer = User::factory()->create([
        'business_id' => $business->id,
        'email' => 'referrer@example.com',
    ]);
    $referrer->forceFill(['referral_code' => 'fixedcod'])->save();

    $pending = User::factory()->create(['email' => 'ana@gmail.com']);
    $paid = User::factory()->create(['email' => 'bob@company.co']);
    $rewarded = User::factory()->create(['email' => 'a@x.com']);

    Referral::create([
        'referrer_user_id' => $referrer->id,
        'referred_user_id' => $pending->id,
        'referred_email' => $pending->email,
        'status' => Referral::STATUS_REGISTERED,
    ]);
    Referral::create([
        'referrer_user_id' => $referrer->id,
        'referred_user_id' => $paid->id,
        'referred_email' => $paid->email,
        'status' => Referral::STATUS_PAID,
        'first_payment_at' => now()->subDay(),
    ]);
    Referral::create([
        'referrer_user_id' => $referrer->id,
        'referred_user_id' => $rewarded->id,
        'referred_email' => $rewarded->email,
        'status' => Referral::STATUS_REWARDED,
        'first_payment_at' => now()->subDays(2),
        'rewarded_at' => now()->subDay(),
    ]);

    $response = test()->actingAs($referrer)
        ->getJson('/api/v1/account/referrals')
        ->assertOk();

    expect($response->json('data.code'))->toBe('fixedcod')
        ->and($response->json('data.counts.total'))->toBe(3)
        ->and($response->json('data.counts.paid'))->toBe(1)
        ->and($response->json('data.counts.rewarded'))->toBe(1)
        ->and($response->json('data.counts.pending'))->toBe(1);

    $rows = collect($response->json('data.referrals'));
    expect($rows->pluck('email_masked')->all())->toContain('an***@gmail.com', 'bo***@company.co', 'a***@x.com');
});
