<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Symfony\Component\HttpFoundation\Cookie;

uses(RefreshDatabase::class);

/*
 * Sanctum SPA: contrato cookie+CSRF que el SPA del frontend implementa.
 *
 * Los feature tests existentes usan actingAs($user), que cortocircuita StartSession y
 * ValidateCsrfToken. Aquí simulamos el flujo HTTP real (sin actingAs) para verificar:
 *   1) GET /sanctum/csrf-cookie ⇒ 204 con cookie XSRF-TOKEN visible al SPA.
 *   2) POST /api/v1/auth/login no devuelve `data.token` y emite Set-Cookie de sesión.
 *   3) GET /api/v1/auth/me con esa cookie autentica al usuario sin bearer.
 *   4) POST /api/v1/auth/logout invalida la sesión; /me devuelve 401 después.
 *
 * El driver `array` reinicia el almacenamiento por request: usamos `file` para que la
 * sesión sobreviva entre llamadas dentro del mismo test. El test aún corre completamente
 * en memoria gracias a RefreshDatabase + storage/framework/sessions.
 */

beforeEach(function () {
    config(['session.driver' => 'file']);
});

function lwCookieJarFromResponse($response): array
{
    return collect($response->baseResponse->headers->getCookies())
        ->mapWithKeys(fn (Cookie $c) => [$c->getName() => $c->getValue()])
        ->all();
}

it('GET /sanctum/csrf-cookie returns 204 and sets XSRF-TOKEN cookie', function () {
    $response = test()->get('/sanctum/csrf-cookie');

    $response->assertNoContent(204);

    $names = collect($response->baseResponse->headers->getCookies())
        ->map(fn (Cookie $c) => $c->getName())
        ->all();

    expect($names)->toContain('XSRF-TOKEN');
});

it('login returns user without token and emits a session cookie', function () {
    User::factory()->create([
        'email' => 'cookie-login@test.example',
        'password' => Hash::make('password123'),
    ]);

    $response = test()->postJson('/api/v1/auth/login', [
        'email' => 'cookie-login@test.example',
        'password' => 'password123',
    ]);

    $response->assertOk()
        ->assertJsonMissingPath('data.token')
        ->assertJsonPath('data.user.email', 'cookie-login@test.example');

    $sessionCookieName = config('session.cookie');
    expect($sessionCookieName)->toBeString()->not->toBeEmpty();

    $names = collect($response->baseResponse->headers->getCookies())
        ->map(fn (Cookie $c) => $c->getName())
        ->all();

    expect($names)->toContain($sessionCookieName);
});

it('register returns user without token and emits a session cookie', function () {
    $response = test()->postJson('/api/v1/auth/register', [
        'name' => 'Cookie Reg',
        'email' => 'cookie-register@test.example',
        'password' => 'password123',
        'password_confirmation' => 'password123',
    ]);

    $response->assertStatus(201)
        ->assertJsonMissingPath('data.token')
        ->assertJsonPath('data.user.email', 'cookie-register@test.example');

    $names = collect($response->baseResponse->headers->getCookies())
        ->map(fn (Cookie $c) => $c->getName())
        ->all();

    expect($names)->toContain(config('session.cookie'));
});

it('full session lifecycle: login then me uses the session cookie then logout invalidates', function () {
    User::factory()->create([
        'email' => 'session-life@test.example',
        'password' => Hash::make('password123'),
    ]);

    $loginResponse = test()->postJson('/api/v1/auth/login', [
        'email' => 'session-life@test.example',
        'password' => 'password123',
    ])->assertOk();

    $cookies = lwCookieJarFromResponse($loginResponse);

    test()->withCookies($cookies)
        ->getJson('/api/v1/auth/me')
        ->assertOk()
        ->assertJsonPath('data.user.email', 'session-life@test.example');

    $logoutResponse = test()->withCookies($cookies)
        ->postJson('/api/v1/auth/logout')
        ->assertNoContent(204);

    // PHPUnit reutiliza instancias de guard entre llamadas HTTP del mismo test (ver
    // AuthFlowTest). Sin esto, /me devuelve 200 por la cache aunque la cookie ya no valga.
    Auth::forgetGuards();

    $cookiesAfter = array_merge($cookies, lwCookieJarFromResponse($logoutResponse));

    test()->withCookies($cookiesAfter)
        ->getJson('/api/v1/auth/me')
        ->assertUnauthorized();
});
