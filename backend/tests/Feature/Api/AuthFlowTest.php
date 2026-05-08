<?php

use App\Models\Template;
use App\Models\User;
use App\Notifications\VerifyEmailEs;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Notification;

uses(RefreshDatabase::class);

it('full auth flow: register verification email, login unblocked, onboarding blocked until verified, resend, then onboarding allowed', function () {
    Notification::fake();

    $register = test()->postJson('/api/v1/auth/register', [
        'name' => 'Flow User',
        'email' => 'auth-flow@test.example',
        'password' => 'password123',
        'password_confirmation' => 'password123',
    ])->assertStatus(201);

    $token = $register->json('data.token');
    expect($token)->not->toBeEmpty();

    $user = User::where('email', 'auth-flow@test.example')->firstOrFail();
    expect($user->email_verified_at)->toBeNull();
    Notification::assertSentTo($user, VerifyEmailEs::class);

    test()->postJson('/api/v1/auth/login', [
        'email' => 'auth-flow@test.example',
        'password' => 'password123',
    ])->assertStatus(200)->assertJsonPath('data.token', fn ($t) => is_string($t) && $t !== '');

    $template = Template::create([
        'name' => 'Noir Elite',
        'slug' => 'noir-elite',
        'primary_color' => '#C9A84C',
        'is_active' => true,
        'requires_pro' => false,
    ]);

    test()->withHeader('Authorization', "Bearer {$token}")
        ->postJson('/api/v1/onboarding/step/1', [
            'template_id' => $template->id,
            'sector' => 'restaurante',
        ])
        ->assertStatus(403)
        ->assertJsonPath('code', 'email_not_verified');

    Notification::fake();

    test()->withHeader('Authorization', "Bearer {$token}")
        ->postJson('/api/v1/auth/email/verification-notification')
        ->assertStatus(202)
        ->assertJsonPath('message', 'Email reenviado');

    Notification::assertSentTo($user->fresh(), VerifyEmailEs::class);

    tap(User::whereKey($user->id)->firstOrFail())->markEmailAsVerified();

    expect(User::query()->whereKey($user->id)->value('email_verified_at'))->not->toBeNull();

    // PHPUnit reutiliza instancias de guard entre llamadas HTTP en el mismo test.
    Auth::forgetGuards();

    test()->withHeader('Authorization', "Bearer {$token}")
        ->postJson('/api/v1/onboarding/step/1', [
            'template_id' => $template->id,
            'sector' => 'restaurante',
        ])
        ->assertStatus(200)
        ->assertJsonPath('data.ok', true);
});
