<?php

use App\Models\Business;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function makeFreeUserWithBusiness(): User
{
    $b = Business::create([
        'name' => 'Free Biz',
        'subdomain' => 'free-mw-'.uniqid('', true),
        'subdomain_type' => 'random',
        'sector' => 'otros',
        'plan' => 'free',
        'is_published' => true,
        'address' => 'C. Falsa 1',
        'phone' => '600000000',
        'email' => 'biz@example.test',
        'city' => 'Madrid',
        'country' => 'España',
        'country_code' => 'ES',
        'onboarding_completed_at' => now(),
        'template_id' => null,
    ]);
    /** @var User $u */
    $u = User::factory()->create(['business_id' => $b->id]);
    $u->markEmailAsVerified();

    return $u;
}

function makeProUserWithBusiness(): User
{
    $b = Business::create([
        'name' => 'Pro Biz',
        'subdomain' => 'pro-mw-'.uniqid('', true),
        'subdomain_type' => 'random',
        'sector' => 'otros',
        'plan' => 'pro',
        'plan_activated_at' => now(),
        'is_published' => true,
        'address' => 'C. Verdadera 1',
        'phone' => '600000001',
        'email' => 'pro@example.test',
        'city' => 'Madrid',
        'country' => 'España',
        'country_code' => 'ES',
        'onboarding_completed_at' => now(),
        'template_id' => null,
    ]);
    /** @var User $u */
    $u = User::factory()->create(['business_id' => $b->id]);
    $u->markEmailAsVerified();

    return $u;
}

it('PUT /dashboard/brand-color devuelve 403 a usuario Free (middleware)', function () {
    $u = makeFreeUserWithBusiness();

    test()->actingAs($u)
        ->putJson('/api/v1/dashboard/brand-color', ['brand_color' => '#123456'])
        ->assertStatus(403);
});

it('POST /dashboard/favicon devuelve 403 a usuario Free (middleware)', function () {
    $u = makeFreeUserWithBusiness();

    test()->actingAs($u)
        ->postJson('/api/v1/dashboard/favicon', [])
        ->assertStatus(403);
});

it('DELETE /dashboard/favicon devuelve 403 a usuario Free (middleware)', function () {
    $u = makeFreeUserWithBusiness();

    test()->actingAs($u)
        ->deleteJson('/api/v1/dashboard/favicon')
        ->assertStatus(403);
});

it('GET /account/referrals devuelve 403 a usuario Free (middleware)', function () {
    $u = makeFreeUserWithBusiness();

    test()->actingAs($u)
        ->getJson('/api/v1/account/referrals')
        ->assertStatus(403);
});

it('POST /qr/poster devuelve 403 a usuario Free (middleware)', function () {
    $u = makeFreeUserWithBusiness();

    test()->actingAs($u)
        ->postJson('/api/v1/qr/poster', [])
        ->assertStatus(403);
});

it('GET /dashboard/brand-color sigue accesible a usuario Free (NO gateado, devuelve info)', function () {
    $u = makeFreeUserWithBusiness();

    $r = test()->actingAs($u)
        ->getJson('/api/v1/dashboard/brand-color');

    // No es 403: el endpoint devuelve datos con is_pro=false para que el front muestre upsell.
    expect($r->status())->not->toBe(403);
});

it('PUT /dashboard/brand-color es accesible a usuario Pro (middleware pasa)', function () {
    $u = makeProUserWithBusiness();

    $r = test()->actingAs($u)
        ->putJson('/api/v1/dashboard/brand-color', ['brand_color' => '#0F6E56']);

    // No es 403 del middleware. Puede ser 200, 422 (validación de la plantilla), etc., pero no 403.
    expect($r->status())->not->toBe(403);
});
