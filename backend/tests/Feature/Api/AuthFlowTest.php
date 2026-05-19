<?php

use App\Models\Template;
use App\Models\User;
use App\Notifications\VerifyEmailEs;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Notification;

uses(RefreshDatabase::class);

it('full auth flow: register verification email, onboarding blocked until verified, resend, then onboarding allowed', function () {
    Notification::fake();

    test()->postJson('/api/v1/auth/register', validRegisterPayload([
        'name' => 'Flow User',
        'email' => 'auth-flow@test.example',
    ]))
        ->assertStatus(201)
        ->assertJsonMissingPath('data.token')
        ->assertJsonPath('data.user.email', 'auth-flow@test.example');

    $user = User::where('email', 'auth-flow@test.example')->firstOrFail();
    expect($user->email_verified_at)->toBeNull();
    Notification::assertSentTo($user, VerifyEmailEs::class);

    // Login también deja la sesión iniciada (cookie en HTTP real, sin token).
    test()->postJson('/api/v1/auth/login', [
        'email' => 'auth-flow@test.example',
        'password' => 'password123',
    ])
        ->assertStatus(200)
        ->assertJsonMissingPath('data.token');

    $template = Template::create([
        'name' => 'Noir Elite',
        'slug' => 'noir-elite',
        'primary_color' => '#C9A84C',
        'is_active' => true,
        'requires_pro' => false,
    ]);

    // En el flujo SPA usamos actingAs($user) para inyectar la sesión web.
    test()->actingAs($user)
        ->postJson('/api/v1/onboarding/step/1', [
            'template_id' => $template->id,
            'sector' => 'restaurante',
        ])
        ->assertStatus(403)
        ->assertJsonPath('code', 'email_not_verified');

    Notification::fake();

    test()->actingAs($user)
        ->postJson('/api/v1/auth/email/verification-notification')
        ->assertStatus(202)
        ->assertJsonPath('message', 'Email reenviado');

    Notification::assertSentTo($user->fresh(), VerifyEmailEs::class);

    tap(User::whereKey($user->id)->firstOrFail())->markEmailAsVerified();

    expect(User::query()->whereKey($user->id)->value('email_verified_at'))->not->toBeNull();

    // PHPUnit reutiliza instancias de guard entre llamadas HTTP en el mismo test.
    Auth::forgetGuards();

    test()->actingAs($user->fresh())
        ->postJson('/api/v1/onboarding/step/1', [
            'template_id' => $template->id,
            'sector' => 'restaurante',
        ])
        ->assertStatus(200)
        ->assertJsonPath('data.ok', true);
});
