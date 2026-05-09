<?php

use App\Models\Business;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;

uses(RefreshDatabase::class);

it('register with valid data authenticates the user via session', function () {
    $response = test()->postJson('/api/v1/auth/register', [
        'name' => 'Test',
        'email' => 'api-register@localweb.com',
        'password' => 'password123',
        'password_confirmation' => 'password123',
    ]);

    $response->assertStatus(201)
        ->assertJsonMissingPath('data.token')
        ->assertJsonPath('data.user.email', 'api-register@localweb.com');

    expect(auth('web')->check())->toBeTrue();
});

it('register with duplicate email returns 422', function () {
    User::factory()->create(['email' => 'duplicate@localweb.com']);

    test()->postJson('/api/v1/auth/register', [
        'name' => 'Test',
        'email' => 'duplicate@localweb.com',
        'password' => 'password123',
        'password_confirmation' => 'password123',
    ])->assertStatus(422);
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
