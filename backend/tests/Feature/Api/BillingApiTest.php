<?php

use App\Models\Business;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('checkout without auth returns 401', function () {
    test()->postJson('/api/v1/billing/checkout')->assertStatus(401);
});

it('checkout with user without business returns 403', function () {
    $user = User::factory()->create();
    $token = $user->createToken('lw-spa')->plainTextToken;

    test()->withHeader('Authorization', "Bearer {$token}")
        ->postJson('/api/v1/billing/checkout')
        ->assertStatus(403);
});

it('checkout with free user returns checkout url', function () {
    $business = Business::create([
        'name' => 'Biz',
        'subdomain' => 'abc-def-ghij',
        'subdomain_type' => 'random',
        'sector' => 'otros',
        'plan' => 'free',
    ]);
    $user = User::factory()->create(['business_id' => $business->id]);
    $token = $user->createToken('lw-spa')->plainTextToken;

    test()->withHeader('Authorization', "Bearer {$token}")
        ->postJson('/api/v1/billing/checkout')
        ->assertStatus(200)
        ->assertJsonPath('data.checkout_url', 'https://checkout.stripe.test/session_123');
});

it('checkout with pro user returns 422', function () {
    $business = Business::create([
        'name' => 'Biz Pro',
        'subdomain' => 'bcd-efgh-jklm',
        'subdomain_type' => 'random',
        'sector' => 'otros',
        'plan' => 'pro',
    ]);
    $user = User::factory()->create(['business_id' => $business->id]);
    $token = $user->createToken('lw-spa')->plainTextToken;

    test()->withHeader('Authorization', "Bearer {$token}")
        ->postJson('/api/v1/billing/checkout')
        ->assertStatus(422);
});

it('billing status returns current plan', function () {
    $business = Business::create([
        'name' => 'Status Biz',
        'subdomain' => 'cde-fghi-jklm',
        'subdomain_type' => 'random',
        'sector' => 'otros',
        'plan' => 'free',
    ]);
    $user = User::factory()->create(['business_id' => $business->id]);
    $token = $user->createToken('lw-spa')->plainTextToken;

    test()->withHeader('Authorization', "Bearer {$token}")
        ->getJson('/api/v1/billing/status')
        ->assertStatus(200)
        ->assertJsonPath('data.plan', 'free');
});
