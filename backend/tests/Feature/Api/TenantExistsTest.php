<?php

use App\Models\Business;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('returns exists true for known subdomain', function () {
    Business::create([
        'name' => 'Sectio',
        'subdomain' => 'sectio',
        'subdomain_type' => 'custom',
        'sector' => 'otros',
    ]);

    test()->getJson('/api/v1/public/tenants/sectio/exists')
        ->assertStatus(200)
        ->assertJson(['exists' => true]);
});

it('returns exists false for unknown subdomain', function () {
    test()->getJson('/api/v1/public/tenants/no-such-tenant/exists')
        ->assertStatus(404)
        ->assertJson(['exists' => false]);
});

it('returns exists false for soft-deleted subdomain', function () {
    $business = Business::create([
        'name' => 'Gone',
        'subdomain' => 'gone-tenant',
        'subdomain_type' => 'random',
        'sector' => 'otros',
    ]);

    $business->delete();

    test()->getJson('/api/v1/public/tenants/gone-tenant/exists')
        ->assertStatus(404)
        ->assertJson(['exists' => false]);
});

it('normalizes subdomain to lowercase', function () {
    Business::create([
        'name' => 'Mixed',
        'subdomain' => 'mybiz',
        'subdomain_type' => 'custom',
        'sector' => 'otros',
    ]);

    test()->getJson('/api/v1/public/tenants/MyBiz/exists')
        ->assertStatus(200)
        ->assertJson(['exists' => true]);
});
