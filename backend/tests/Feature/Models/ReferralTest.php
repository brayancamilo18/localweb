<?php

use App\Models\Referral;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;

uses(RefreshDatabase::class);

it('ensureReferralCode returns an 8 character lowercase alphanumeric code on first attempt', function () {
    $user = User::factory()->create();

    $code = $user->ensureReferralCode();

    expect($code)->toMatch('/^[a-z0-9]{8}$/')
        ->and($user->fresh()->referral_code)->toBe($code);
});

it('ensureReferralCode is idempotent when called twice', function () {
    $user = User::factory()->create();

    $first = $user->ensureReferralCode();
    $second = $user->fresh()->ensureReferralCode();

    expect($second)->toBe($first);
});

it('ensureReferralCode does not regenerate an existing code', function () {
    $user = User::factory()->create();
    $user->forceFill(['referral_code' => 'existing1'])->save();

    expect($user->ensureReferralCode())->toBe('existing1')
        ->and($user->fresh()->referral_code)->toBe('existing1');
});

it('referralLink uses frontend url without double slashes', function () {
    config(['app.frontend_url' => 'https://app.onez.es/']);

    $user = User::factory()->create();

    expect($user->referral_link)->toBe('https://app.onez.es/r/'.$user->fresh()->referral_code)
        ->and($user->referral_link)->not->toContain('//r/');
});

it('ensureReferralCode retries after collisions until a unique code is found', function () {
    User::factory()->create()->forceFill(['referral_code' => 'aaaaaaaa'])->save();

    $attempt = 0;
    Str::createRandomStringsUsing(function () use (&$attempt) {
        return match ($attempt++) {
            0, 1 => 'AAAAAAAA',
            default => 'bbbbbbbb',
        };
    });

    try {
        $user = User::factory()->create();
        $code = $user->ensureReferralCode();

        expect($code)->toBe('bbbbbbbb')
            ->and($attempt)->toBe(3);
    } finally {
        Str::createRandomStringsUsing(null);
    }
});

it('exposes referrer and referred relationships', function () {
    $referrer = User::factory()->create();
    $referred = User::factory()->create();

    $referral = Referral::create([
        'referrer_user_id' => $referrer->id,
        'referred_user_id' => $referred->id,
        'referred_email' => $referred->email,
        'status' => Referral::STATUS_REGISTERED,
    ]);

    expect($referrer->referralsAsReferrer)->toHaveCount(1)
        ->and($referrer->referralsAsReferrer->first()->is($referral))->toBeTrue()
        ->and($referred->referralAsReferred->is($referral))->toBeTrue();
});
