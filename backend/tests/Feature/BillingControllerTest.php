<?php

use App\Models\Business;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('returns 401 on POST /api/v1/billing/checkout when unauthenticated', function () {
    test()->postJson('/api/v1/billing/checkout')->assertUnauthorized();
});

it('returns 403 on POST /api/v1/billing/checkout when the user has no business', function () {
    $user = User::factory()->create();
    $response = test()->actingAs($user)
        ->postJson('/api/v1/billing/checkout');

    $response->assertStatus(403)
        ->assertJsonPath('message', 'Onboarding no completado');
});

it('returns 422 on POST /api/v1/billing/checkout when the business is already Pro', function () {
    $business = Business::create([
        'name' => 'Pro Biz',
        'subdomain' => 'pro-aabb-ccdd',
        'subdomain_type' => 'random',
        'sector' => 'otros',
        'plan' => 'pro',
    ]);
    $user = User::factory()->create(['business_id' => $business->id]);
    test()->actingAs($user)
        ->postJson('/api/v1/billing/checkout')
        ->assertStatus(422)
        ->assertJsonPath('message', 'Ya tienes el plan Pro activo');
});

it('returns a valid checkout_url in testing environment on POST /api/v1/billing/checkout', function () {
    expect(app()->environment('testing'))->toBeTrue();

    $business = Business::create([
        'name' => 'Free Biz',
        'subdomain' => 'free-aabb-ccdd',
        'subdomain_type' => 'random',
        'sector' => 'otros',
        'plan' => 'free',
    ]);
    $user = User::factory()->create(['business_id' => $business->id]);
    $response = test()->actingAs($user)
        ->postJson('/api/v1/billing/checkout');

    $response->assertOk()
        ->assertJsonPath('data.checkout_url', 'https://checkout.stripe.test/session_123');

    $url = $response->json('data.checkout_url');
    expect($url)->toBeString()
        ->and(filter_var($url, FILTER_VALIDATE_URL))->not->toBeFalse()
        ->and($url)->toStartWith('https://');
});

it('returns 422 on POST /api/v1/billing/portal when the user has no active subscription', function () {
    $business = Business::create([
        'name' => 'Portal Biz',
        'subdomain' => 'por-aabb-ccdd',
        'subdomain_type' => 'random',
        'sector' => 'otros',
        'plan' => 'free',
    ]);
    $user = User::factory()->create(['business_id' => $business->id]);
    expect($user->subscribed('default'))->toBeFalse();

    test()->actingAs($user)
        ->postJson('/api/v1/billing/portal')
        ->assertStatus(422)
        ->assertJsonPath('message', 'No tienes una suscripción activa');
});

it('returns the business plan on GET /api/v1/billing/status', function () {
    $business = Business::create([
        'name' => 'Status Biz',
        'subdomain' => 'sta-aabb-ccdd',
        'subdomain_type' => 'random',
        'sector' => 'otros',
        'plan' => 'pro',
        'is_published' => true,
    ]);
    $user = User::factory()->create(['business_id' => $business->id]);
    test()->actingAs($user)
        ->getJson('/api/v1/billing/status')
        ->assertOk()
        ->assertJsonPath('data.plan', 'pro')
        ->assertJsonPath('data.is_pro', true)
        ->assertJsonPath('data.is_free', false);
});
