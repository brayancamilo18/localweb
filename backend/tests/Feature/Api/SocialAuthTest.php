<?php

use App\Models\Business;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Socialite\Facades\Socialite;
use Laravel\Socialite\Two\User as SocialiteUser;

uses(RefreshDatabase::class);

function fakeSocialiteUser(array $overrides = []): SocialiteUser
{
    $u = new SocialiteUser;
    $u->id = $overrides['id'] ?? 'google-12345';
    $u->name = $overrides['name'] ?? 'Juan Pérez';
    $u->email = array_key_exists('email', $overrides) ? $overrides['email'] : 'juan@example.com';
    $u->avatar = $overrides['avatar'] ?? 'https://lh3.googleusercontent.com/a/abc';
    $u->nickname = $overrides['nickname'] ?? null;
    $u->token = 'fake-token';
    $u->refreshToken = null;
    $u->expiresIn = 3600;

    return $u;
}

function mockGoogleUser(SocialiteUser $user): void
{
    Socialite::shouldReceive('driver')->with('google')->andReturnSelf();
    Socialite::shouldReceive('stateless')->andReturnSelf();
    Socialite::shouldReceive('user')->andReturn($user);
}

it('redirects to google oauth on /auth/google/redirect', function () {
    config([
        'services.google.client_id' => 'fake',
        'services.google.client_secret' => 'fake',
        'services.google.redirect' => 'http://localhost/cb',
    ]);

    $response = test()->get('/api/v1/auth/google/redirect');

    $response->assertStatus(302);
    expect($response->headers->get('Location'))->toContain('accounts.google.com');
});

it('callback creates new user without password and redirects to /register/social', function () {
    mockGoogleUser(fakeSocialiteUser(['email' => 'nuevo@example.com', 'id' => 'gid-111']));

    $response = test()->get('/api/v1/auth/google/callback');

    $response->assertStatus(302);
    expect($response->headers->get('Location'))->toContain('/register/social');

    $user = User::where('email', 'nuevo@example.com')->first();
    expect($user)->not->toBeNull();
    expect($user->provider)->toBe('google');
    expect($user->provider_id)->toBe('gid-111');
    expect($user->password)->toBeNull();
    expect($user->email_verified_at)->not->toBeNull();
    expect($user->terms_accepted_at)->toBeNull();
    expect($user->business_id)->toBeNull();
    expect(auth('web')->check())->toBeTrue();
});

it('callback links existing email user to google and redirects appropriately', function () {
    $user = User::factory()->create([
        'email' => 'existente@example.com',
        'email_verified_at' => null,
    ]);

    mockGoogleUser(fakeSocialiteUser(['email' => 'existente@example.com', 'id' => 'gid-222']));

    $response = test()->get('/api/v1/auth/google/callback');

    $response->assertStatus(302);

    $user->refresh();
    expect($user->provider)->toBe('google');
    expect($user->provider_id)->toBe('gid-222');
    expect($user->email_verified_at)->not->toBeNull();
});

it('callback returns existing google-linked user without recreating', function () {
    User::factory()->create([
        'email' => 'gusr@example.com',
        'provider' => 'google',
        'provider_id' => 'gid-333',
    ]);

    mockGoogleUser(fakeSocialiteUser(['email' => 'gusr@example.com', 'id' => 'gid-333']));

    test()->get('/api/v1/auth/google/callback')->assertStatus(302);

    expect(User::where('email', 'gusr@example.com')->count())->toBe(1);
});

it('callback redirects to /login on socialite exception', function () {
    Socialite::shouldReceive('driver')->with('google')->andReturnSelf();
    Socialite::shouldReceive('stateless')->andReturnSelf();
    Socialite::shouldReceive('user')->andThrow(new Exception('OAuth failed'));

    $response = test()->get('/api/v1/auth/google/callback');

    $response->assertStatus(302);
    expect($response->headers->get('Location'))->toContain('social_error');
});

it('callback redirects to /login if google returns no email', function () {
    mockGoogleUser(fakeSocialiteUser(['email' => null]));

    $response = test()->get('/api/v1/auth/google/callback');

    $response->assertStatus(302);
    expect($response->headers->get('Location'))->toContain('social_error=no_email');
});

it('complete-registration requires auth', function () {
    test()->postJson('/api/v1/auth/social/complete-registration', [])
        ->assertStatus(401);
});

it('complete-registration creates business and accepts terms for social user', function () {
    $user = User::factory()->create([
        'provider' => 'google',
        'provider_id' => 'gid-completo',
        'password' => null,
        'terms_accepted_at' => null,
        'business_id' => null,
        'email_verified_at' => now(),
    ]);

    $response = test()->actingAs($user)->postJson('/api/v1/auth/social/complete-registration', [
        'business_name' => 'Mi Negocio Social',
        'sector' => 'peluqueria',
        'city' => 'Madrid',
        'country' => 'España',
        'country_code' => 'ES',
        'accept_terms' => true,
        'marketing_consent' => true,
    ]);

    $response->assertStatus(201)
        ->assertJsonPath('data.business.name', 'Mi Negocio Social');

    $user->refresh();
    expect($user->terms_accepted_at)->not->toBeNull();
    expect($user->marketing_consent_at)->not->toBeNull();
    expect($user->business_id)->not->toBeNull();
});

it('complete-registration fails without accept_terms', function () {
    $user = User::factory()->create([
        'provider' => 'google',
        'password' => null,
        'terms_accepted_at' => null,
        'business_id' => null,
        'email_verified_at' => now(),
    ]);

    test()->actingAs($user)->postJson('/api/v1/auth/social/complete-registration', [
        'business_name' => 'X',
        'sector' => 'peluqueria',
        'city' => 'Madrid',
        'country' => 'España',
        'country_code' => 'ES',
        'accept_terms' => false,
    ])->assertStatus(422)
        ->assertJsonValidationErrors(['accept_terms']);
});

it('complete-registration returns 409 if user already completed registration', function () {
    $user = User::factory()->create([
        'provider' => 'google',
        'password' => null,
        'terms_accepted_at' => now(),
        'email_verified_at' => now(),
    ]);
    $business = Business::factory()->create();
    $user->forceFill(['business_id' => $business->id])->save();

    test()->actingAs($user)->postJson('/api/v1/auth/social/complete-registration', [
        'business_name' => 'Otro',
        'sector' => 'peluqueria',
        'city' => 'Madrid',
        'country' => 'España',
        'country_code' => 'ES',
        'accept_terms' => true,
    ])->assertStatus(409);
});

it('social/me returns null business for fresh social user', function () {
    $user = User::factory()->create([
        'provider' => 'google',
        'password' => null,
        'business_id' => null,
        'terms_accepted_at' => null,
        'email_verified_at' => now(),
        'name' => 'Juan',
        'avatar_url' => 'https://lh3.googleusercontent.com/a/abc',
    ]);

    test()->actingAs($user)->getJson('/api/v1/auth/social/me')
        ->assertStatus(200)
        ->assertJsonPath('data.name', 'Juan')
        ->assertJsonPath('data.provider', 'google')
        ->assertJsonPath('data.business_id', null);
});
