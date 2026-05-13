<?php

use App\Models\User;
use App\Notifications\ResetPasswordEs;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Password;

uses(RefreshDatabase::class);

it('forgot-password siempre responde 200, incluso si el email no existe', function () {
    Notification::fake();

    test()->postJson('/api/v1/auth/forgot-password', [
        'email' => 'no-existe@localweb.com',
    ])
        ->assertStatus(200)
        ->assertJsonPath('message', 'Si el correo existe, hemos enviado instrucciones para restablecer la contraseña.');

    Notification::assertNothingSent();
});

it('forgot-password con email existente envía la notificación ResetPasswordEs', function () {
    Notification::fake();

    $user = User::factory()->create(['email' => 'reset@localweb.com']);

    test()->postJson('/api/v1/auth/forgot-password', [
        'email' => 'reset@localweb.com',
    ])->assertStatus(200);

    Notification::assertSentTo($user, ResetPasswordEs::class);
});

it('forgot-password valida formato de email', function () {
    test()->postJson('/api/v1/auth/forgot-password', [
        'email' => 'no-es-email',
    ])->assertStatus(422);
});

it('reset-password con token válido cambia la contraseña', function () {
    $user = User::factory()->create([
        'email' => 'change@localweb.com',
        'password' => Hash::make('viejo-password'),
    ]);

    $token = Password::broker()->createToken($user);

    test()->postJson('/api/v1/auth/reset-password', [
        'token' => $token,
        'email' => 'change@localweb.com',
        'password' => 'nuevopassword',
        'password_confirmation' => 'nuevopassword',
    ])
        ->assertStatus(200)
        ->assertJsonPath('message', 'Contraseña actualizada.');

    expect(Hash::check('nuevopassword', $user->fresh()->password))->toBeTrue();
});

it('reset-password con token inválido devuelve 422', function () {
    $user = User::factory()->create(['email' => 'badtoken@localweb.com']);

    test()->postJson('/api/v1/auth/reset-password', [
        'token' => 'inventado',
        'email' => $user->email,
        'password' => 'nuevopassword',
        'password_confirmation' => 'nuevopassword',
    ])
        ->assertStatus(422)
        ->assertJsonPath('errors.token.0', 'Token inválido o caducado.');
});

it('reset-password valida password mínimo 8 y confirmado', function () {
    $user = User::factory()->create(['email' => 'shortpass@localweb.com']);
    $token = Password::broker()->createToken($user);

    test()->postJson('/api/v1/auth/reset-password', [
        'token' => $token,
        'email' => $user->email,
        'password' => '123',
    ])->assertStatus(422);
});

it('reset-password no inicia sesión automáticamente', function () {
    $user = User::factory()->create([
        'email' => 'nologin@localweb.com',
        'password' => Hash::make('viejo-password'),
    ]);

    $token = Password::broker()->createToken($user);

    test()->postJson('/api/v1/auth/reset-password', [
        'token' => $token,
        'email' => $user->email,
        'password' => 'nuevopassword',
        'password_confirmation' => 'nuevopassword',
    ])->assertStatus(200);

    expect(auth('web')->check())->toBeFalse();
});

it('ResetPasswordEs::toMail devuelve un ResetPasswordOnez con los datos correctos', function () {
    // En Laravel 12, cuando una notificación devuelve un Mailable desde toMail(),
    // MailChannel hace $mailable->send($mailer) y bypassea el tracking de
    // Mail::fake(). Por eso comprobamos el wiring directamente sobre toMail().
    $user = User::factory()->create([
        'email' => 'mail-check@onez.test',
        'name' => 'Test User',
    ]);

    $notification = new \App\Notifications\ResetPasswordEs('test-token-abc-123');
    $mailable = $notification->toMail($user);

    expect($mailable)->toBeInstanceOf(\App\Mail\ResetPasswordOnez::class);
    expect($mailable->email)->toBe('mail-check@onez.test');
    expect($mailable->name)->toBe('Test User');
    expect($mailable->resetUrl)->toContain('token=test-token-abc-123');
    expect($mailable->resetUrl)->toContain('email=mail-check%40onez.test');
    expect($mailable->expireMinutes)->toBe((int) config('auth.passwords.users.expire', 60));

    $envelope = $mailable->envelope();
    expect($envelope->subject)->toBe('Restablece tu contraseña en ONEZ');
});
