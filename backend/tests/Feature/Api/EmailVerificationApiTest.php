<?php

use App\Models\Template;
use App\Models\User;
use App\Notifications\VerifyEmailEs;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Notification;

uses(RefreshDatabase::class);

it('register dispatches the spanish verify email notification', function () {
    Notification::fake();

    $response = test()->postJson('/api/v1/auth/register', validRegisterPayload([
        'name' => 'Need Verify',
        'email' => 'verify-me@test.example',
    ]))->assertStatus(201);

    $userId = (int) $response->json('data.user.id');
    $user = User::query()->findOrFail($userId);

    expect($user->email_verified_at)->toBeNull();
    Notification::assertSentTo($user, VerifyEmailEs::class);
});

it('onboarding step1 returns 403 with code email_not_verified for unverified user', function () {
    $template = Template::create([
        'name' => 'Noir Elite',
        'slug' => 'noir-elite',
        'primary_color' => '#C9A84C',
        'is_active' => true,
        'requires_pro' => false,
    ]);

    $user = User::factory()->unverified()->create();
    test()->actingAs($user)
        ->postJson('/api/v1/onboarding/step/1', [
            'template_id' => $template->id,
            'sector' => 'restaurante',
        ])
        ->assertStatus(403)
        ->assertJsonPath('code', 'email_not_verified')
        ->assertJsonPath('message', 'Debes verificar tu correo antes de continuar.');
});

it('onboarding step1 succeeds once email_verified_at is set', function () {
    $template = Template::create([
        'name' => 'Noir Elite',
        'slug' => 'noir-elite',
        'primary_color' => '#C9A84C',
        'is_active' => true,
        'requires_pro' => false,
    ]);

    $user = User::factory()->create(); // factory verifica por defecto
    test()->actingAs($user)
        ->postJson('/api/v1/onboarding/step/1', [
            'template_id' => $template->id,
            'sector' => 'restaurante',
        ])
        ->assertStatus(200);

    Cache::forget("onboarding:{$user->id}");
});

it('resending verification returns 202 with the message', function () {
    Notification::fake();

    $user = User::factory()->unverified()->create();
    test()->actingAs($user)
        ->postJson('/api/v1/auth/email/verification-notification')
        ->assertStatus(202)
        ->assertJsonPath('message', 'Email reenviado');

    Notification::assertSentTo($user, VerifyEmailEs::class);
});

it('resending verification for an already-verified user returns 200 ya verificado', function () {
    Notification::fake();

    $user = User::factory()->create(); // verified by default
    test()->actingAs($user)
        ->postJson('/api/v1/auth/email/verification-notification')
        ->assertStatus(200)
        ->assertJsonPath('message', 'Ya verificado');

    Notification::assertNothingSent();
});

it('me endpoint exposes email_verified_at as ISO string for verified users', function () {
    $verified = User::factory()->create(['email_verified_at' => now()]);
    test()->actingAs($verified)
        ->getJson('/api/v1/auth/me')
        ->assertStatus(200)
        ->assertJsonPath('data.user.email_verified_at', fn ($v) => is_string($v) && $v !== '');
});

it('me endpoint exposes email_verified_at as null for unverified users', function () {
    $unverified = User::factory()->create(['email_verified_at' => null]);
    test()->actingAs($unverified)
        ->getJson('/api/v1/auth/me')
        ->assertStatus(200)
        ->assertJsonPath('data.user.email_verified_at', null);
});
