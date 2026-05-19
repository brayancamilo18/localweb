<?php

use App\Models\Business;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;

uses(RefreshDatabase::class);

it('register with valid data authenticates the user via session', function () {
    $response = test()->postJson('/api/v1/auth/register', validRegisterPayload([
        'name' => 'Test',
        'email' => 'api-register@localweb.com',
    ]));

    $response->assertStatus(201)
        ->assertJsonMissingPath('data.token')
        ->assertJsonPath('data.user.email', 'api-register@localweb.com')
        ->assertJsonPath('data.business.name', 'Mi Salón')
        ->assertJsonPath('data.business.is_published', false);

    expect(auth('web')->check())->toBeTrue();
    expect(\App\Models\Business::count())->toBe(1);
});

it('step3 updates business name when business exists from register', function () {
    $register = test()->postJson('/api/v1/auth/register', validRegisterPayload([
        'business_name' => 'Nombre Original',
    ]))->assertStatus(201);

    $userId = (int) $register->json('data.user.id');
    $user = \App\Models\User::query()->findOrFail($userId);
    $user->forceFill(['email_verified_at' => now()])->save();

    $template = \App\Models\Template::create([
        'name' => 'Test',
        'slug' => 'test-tpl',
        'primary_color' => '#000',
        'is_active' => true,
        'requires_pro' => false,
    ]);

    test()->actingAs($user)
        ->postJson('/api/v1/onboarding/step/1', ['template_id' => $template->id, 'sector' => 'peluqueria'])
        ->assertStatus(200);

    test()->actingAs($user)
        ->postJson('/api/v1/onboarding/step/3', ['business_name' => 'Nombre Corregido'])
        ->assertStatus(200);

    $user->business?->refresh();
    expect($user->business?->name)->toBe('Nombre Corregido');
});

it('onboarding status hydrates draft from business created at register', function () {
    $register = test()->postJson('/api/v1/auth/register', validRegisterPayload([
        'business_name' => 'Salón Persistente',
        'city' => 'Barcelona',
        'country' => 'España',
        'country_code' => 'ES',
    ]))->assertStatus(201);

    $userId = (int) $register->json('data.user.id');
    $user = \App\Models\User::query()->findOrFail($userId);
    $user->forceFill(['email_verified_at' => now()])->save();

    test()->actingAs($user)
        ->getJson('/api/v1/onboarding/status')
        ->assertStatus(200)
        ->assertJsonPath('data.is_complete', false)
        ->assertJsonPath('data.step', 1)
        ->assertJsonPath('data.draft.business_name', 'Salón Persistente')
        ->assertJsonPath('data.draft.city', 'Barcelona')
        ->assertJsonPath('data.draft.country', 'España')
        ->assertJsonPath('data.draft.country_code', 'ES');
});

it('register with duplicate email returns 422', function () {
    User::factory()->create(['email' => 'duplicate@localweb.com']);

    test()->postJson('/api/v1/auth/register', validRegisterPayload([
        'email' => 'duplicate@localweb.com',
    ]))->assertStatus(422);
});

it('login success authenticates via session and does not return a token', function () {
    User::factory()->create([
        'email' => 'login@localweb.com',
        'password' => Hash::make('password123'),
    ]);

    test()->postJson('/api/v1/auth/login', [
        'email' => 'login@localweb.com',
        'password' => 'password123',
    ])
        ->assertStatus(200)
        ->assertJsonMissingPath('data.token')
        ->assertJsonPath('data.user.email', 'login@localweb.com');

    expect(auth('web')->check())->toBeTrue();
});

it('login invalid returns 401', function () {
    User::factory()->create([
        'email' => 'badlogin@localweb.com',
        'password' => Hash::make('password123'),
    ]);

    test()->postJson('/api/v1/auth/login', [
        'email' => 'badlogin@localweb.com',
        'password' => 'wrong',
    ])->assertStatus(401);
});

it('login sixth failed attempt returns 429', function () {
    User::factory()->create([
        'email' => 'ratelimit@localweb.com',
        'password' => Hash::make('password123'),
    ]);

    for ($i = 1; $i <= 5; $i++) {
        test()->postJson('/api/v1/auth/login', [
            'email' => 'ratelimit@localweb.com',
            'password' => 'wrong',
        ])->assertStatus(401);
    }

    test()->postJson('/api/v1/auth/login', [
        'email' => 'ratelimit@localweb.com',
        'password' => 'wrong',
    ])->assertStatus(429);
});

it('logout invalidates session for SPA cookie auth', function () {
    $user = User::factory()->create();

    test()->actingAs($user)
        ->postJson('/api/v1/auth/logout')
        ->assertStatus(204);
});

it('logout revokes current bearer token when authenticated by token', function () {
    $user = User::factory()->create();
    $token = $user->createToken('integration-test')->plainTextToken;
    $tokenId = $user->tokens()->first()->id;

    test()->withHeader('Authorization', "Bearer {$token}")
        ->postJson('/api/v1/auth/logout')
        ->assertStatus(204);

    expect($user->tokens()->whereKey($tokenId)->exists())->toBeFalse();
});

it('me without authentication returns 401', function () {
    test()->getJson('/api/v1/auth/me')->assertStatus(401);
});

it('me with authenticated user returns user data', function () {
    $business = Business::create([
        'name' => 'B',
        'subdomain' => 'bbb-cccc-dddd',
        'subdomain_type' => 'random',
        'sector' => 'otros',
    ]);
    $user = User::factory()->create(['business_id' => $business->id]);

    test()->actingAs($user)
        ->getJson('/api/v1/auth/me')
        ->assertStatus(200)
        ->assertJsonPath('data.user.id', $user->id)
        ->assertJsonPath('data.user.is_admin', false);
});
