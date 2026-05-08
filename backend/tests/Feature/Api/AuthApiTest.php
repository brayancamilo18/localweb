<?php

use App\Models\Business;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;

uses(RefreshDatabase::class);

it('register with valid data returns token', function () {
    $response = test()->postJson('/api/v1/auth/register', [
        'name' => 'Test',
        'email' => 'api-register@localweb.com',
        'password' => 'password123',
        'password_confirmation' => 'password123',
    ]);

    $response->assertStatus(201)->assertJsonPath('data.token', fn ($token) => is_string($token) && $token !== '');
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

it('login success returns token', function () {
    User::factory()->create([
        'email' => 'login@localweb.com',
        'password' => Hash::make('password123'),
    ]);

    test()->postJson('/api/v1/auth/login', [
        'email' => 'login@localweb.com',
        'password' => 'password123',
    ])->assertStatus(200)->assertJsonPath('data.token', fn ($token) => is_string($token) && $token !== '');
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

it('logout revokes current token', function () {
    $user = User::factory()->create();
    $token = $user->createToken('lw-spa')->plainTextToken;
    $tokenId = $user->tokens()->first()->id;

    test()->withHeader('Authorization', "Bearer {$token}")
        ->postJson('/api/v1/auth/logout')
        ->assertStatus(200);

    expect($user->tokens()->whereKey($tokenId)->exists())->toBeFalse();
});

it('me without token returns 401', function () {
    test()->getJson('/api/v1/auth/me')->assertStatus(401);
});

it('me with token returns user', function () {
    $business = Business::create([
        'name' => 'B',
        'subdomain' => 'bbb-cccc-dddd',
        'subdomain_type' => 'random',
        'sector' => 'otros',
    ]);
    $user = User::factory()->create(['business_id' => $business->id]);
    $token = $user->createToken('lw-spa')->plainTextToken;

    test()->withHeader('Authorization', "Bearer {$token}")
        ->getJson('/api/v1/auth/me')
        ->assertStatus(200)
        ->assertJsonPath('data.user.id', $user->id)
        ->assertJsonPath('data.user.is_admin', false);
});
