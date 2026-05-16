<?php

use App\Models\Business;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('allows api requests without tenant subdomain header', function () {
    test()->getJson('/api/v1/public/subdomain-rules')
        ->assertStatus(200);
});

it('returns 404 when tenant subdomain header is unknown', function () {
    test()->withHeader('X-Tenant-Subdomain', 'sectio')
        ->getJson('/api/v1/public/subdomain-rules')
        ->assertStatus(404)
        ->assertJson(['error' => 'Tenant not found']);
});

it('allows api requests when tenant subdomain exists', function () {
    Business::create([
        'name' => 'Sectio',
        'subdomain' => 'sectio',
        'subdomain_type' => 'custom',
        'sector' => 'otros',
        'is_published' => true,
    ]);

    test()->withHeader('X-Tenant-Subdomain', 'sectio')
        ->getJson('/api/v1/public/subdomain-rules')
        ->assertStatus(200);
});

it('returns 404 for soft-deleted tenant subdomain', function () {
    $business = Business::create([
        'name' => 'Gone',
        'subdomain' => 'gone-tenant',
        'subdomain_type' => 'random',
        'sector' => 'otros',
    ]);

    $business->delete();

    test()->withHeader('X-Tenant-Subdomain', 'gone-tenant')
        ->getJson('/api/v1/public/subdomain-rules')
        ->assertStatus(404)
        ->assertJson(['error' => 'Tenant not found']);
});
