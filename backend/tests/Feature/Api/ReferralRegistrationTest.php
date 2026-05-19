<?php

use App\Models\Referral;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Log\Events\MessageLogged;
use Illuminate\Support\Facades\Event;

uses(RefreshDatabase::class);

beforeEach(function () {
    config([
        'referrals.max_referrals' => 5,
        'referrals.ref_coupon_id' => 'REF-WELCOME-FIRST-FREE-TEST',
    ]);
});

function registerPayload(array $overrides = []): array
{
    return validRegisterPayload(array_merge([
        'name' => 'Referred User',
        'email' => 'referred-'.uniqid('', true).'@example.com',
    ], $overrides));
}

function createReferrerWithCode(string $code = 'refcode1', array $attributes = []): User
{
    $referrer = User::factory()->create($attributes);
    $referrer->forceFill(['referral_code' => $code])->save();

    return $referrer;
}

it('creates a registered referral when registering with a valid referral code', function () {
    $referrer = createReferrerWithCode('validref');

    $response = test()->postJson('/api/v1/auth/register', registerPayload([
        'email' => 'new-referred@example.com',
        'referral_code' => 'validref',
    ]));

    $response->assertCreated();

    $referred = User::query()->where('email', 'new-referred@example.com')->first();

    expect($referred)->not->toBeNull();

    $referral = Referral::query()->where('referred_user_id', $referred->id)->first();

    expect($referral)->not->toBeNull()
        ->and($referral->referrer_user_id)->toBe($referrer->id)
        ->and($referral->referred_email)->toBe('new-referred@example.com')
        ->and($referral->status)->toBe(Referral::STATUS_REGISTERED);
});

it('registers without creating a referral when referral_code is omitted', function () {
    test()->postJson('/api/v1/auth/register', registerPayload([
        'email' => 'no-ref@example.com',
    ]))->assertCreated();

    expect(Referral::query()->count())->toBe(0);
});

it('registers without creating a referral when referral code is unknown and logs info', function () {
    Event::fake([MessageLogged::class]);

    test()->postJson('/api/v1/auth/register', registerPayload([
        'email' => 'unknown-ref@example.com',
        'referral_code' => 'not-a-real-code',
    ]))->assertCreated();

    expect(Referral::query()->count())->toBe(0);

    Event::assertDispatched(MessageLogged::class, fn (MessageLogged $event) => $event->level === 'info'
        && $event->message === 'Referral code unknown, ignored');
});

it('registers without creating a referral when email matches the referrer', function () {
    $referrer = createReferrerWithCode('sameowner', [
        'email' => 'Owner@Test.com',
    ]);

    test()->postJson('/api/v1/auth/register', registerPayload([
        'email' => 'owner@test.com',
        'referral_code' => 'sameowner',
    ]))->assertCreated();

    expect(Referral::query()->count())->toBe(0)
        ->and($referrer->fresh()->referralsAsReferrer)->toHaveCount(0);
});

it('does not create a referral when referrer already has max paid or rewarded referrals', function () {
    $referrer = createReferrerWithCode('maxedout');

    foreach (range(1, 5) as $i) {
        $existing = User::factory()->create(['email' => "paid-ref-{$i}@example.com"]);
        Referral::create([
            'referrer_user_id' => $referrer->id,
            'referred_user_id' => $existing->id,
            'referred_email' => $existing->email,
            'status' => $i <= 3 ? Referral::STATUS_PAID : Referral::STATUS_REWARDED,
        ]);
    }

    Event::fake([MessageLogged::class]);

    test()->postJson('/api/v1/auth/register', registerPayload([
        'email' => 'sixth-referred@example.com',
        'referral_code' => 'maxedout',
    ]))->assertCreated();

    expect(Referral::query()->where('referred_email', 'sixth-referred@example.com')->exists())->toBeFalse();

    Event::assertDispatched(MessageLogged::class, fn (MessageLogged $event) => $event->level === 'info'
        && $event->message === 'Referrer reached max referrals');
});

it('includes referral_context on me when a registered referral is pending', function () {
    $referrer = User::factory()->create([
        'name' => 'Ana Referidora',
        'email' => 'referrer-me@example.com',
    ]);
    $referred = User::factory()->create(['email' => 'referred-me@example.com']);

    Referral::create([
        'referrer_user_id' => $referrer->id,
        'referred_user_id' => $referred->id,
        'referred_email' => $referred->email,
        'status' => Referral::STATUS_REGISTERED,
    ]);

    test()->actingAs($referred)
        ->getJson('/api/v1/auth/me')
        ->assertOk()
        ->assertJsonPath('data.referral_context.referrer_name', 'Ana Referidora')
        ->assertJsonPath('data.referral_context.promo_code_first_free', 'REF-WELCOME-FIRST-FREE-TEST')
        ->assertJsonMissingPath('data.referral_context.referrer_email')
        ->assertJsonMissingPath('data.referral_context.email');
});

it('does not include referral_context on me when there is no pending referral', function () {
    $user = User::factory()->create();

    test()->actingAs($user)
        ->getJson('/api/v1/auth/me')
        ->assertOk()
        ->assertJsonMissingPath('data.referral_context');
});

it('does not include referral_context on me when referral is already paid', function () {
    $referrer = User::factory()->create();
    $referred = User::factory()->create();

    Referral::create([
        'referrer_user_id' => $referrer->id,
        'referred_user_id' => $referred->id,
        'referred_email' => $referred->email,
        'status' => Referral::STATUS_PAID,
    ]);

    test()->actingAs($referred)
        ->getJson('/api/v1/auth/me')
        ->assertOk()
        ->assertJsonMissingPath('data.referral_context');
});
