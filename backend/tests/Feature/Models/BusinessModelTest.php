<?php

use App\Models\Business;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('creates a business with all fields', function () {
    $business = Business::create([
        'name' => 'Acme Store',
        'subdomain' => 'acme',
        'subdomain_type' => 'custom',
        'sector' => 'Retail',
        'template_id' => null,
        'logo_path' => 'logos/acme.png',
        'description' => 'Demo business',
        'tagline' => 'Best in town',
        'phone' => '+34 600 123 123',
        'address' => 'Main St 123',
        'lat' => 40.4167754,
        'lng' => -3.7037902,
        'schedule' => ['mon' => '9-5'],
        'is_published' => true,
        'plan' => 'free',
        'plan_activated_at' => now(),
    ]);

    expect($business->exists)->toBeTrue()
        ->and($business->subdomain)->toBe('acme')
        ->and($business->is_published)->toBeTrue()
        ->and($business->schedule)->toBeArray();
});

it('returns true for is_free when plan is free', function () {
    $business = Business::create([
        'name' => 'Free Biz',
        'subdomain' => 'free-biz',
        'subdomain_type' => 'random',
        'sector' => 'Services',
        'plan' => 'free',
    ]);

    expect($business->is_free)->toBeTrue();
});

it('returns true for is_pro when plan is pro', function () {
    $business = Business::create([
        'name' => 'Pro Biz',
        'subdomain' => 'pro-biz',
        'subdomain_type' => 'random',
        'sector' => 'Services',
        'plan' => 'pro',
    ]);

    expect($business->is_pro)->toBeTrue();
});

it('keeps record in database after soft delete', function () {
    $business = Business::create([
        'name' => 'Soft Delete Biz',
        'subdomain' => 'soft-delete-biz',
        'subdomain_type' => 'random',
        'sector' => 'Services',
    ]);

    $business->delete();

    expect(Business::query()->count())->toBe(0)
        ->and(Business::withTrashed()->whereKey($business->id)->exists())->toBeTrue();
});

it('filters only published businesses with scope', function () {
    Business::create([
        'name' => 'Published Biz',
        'subdomain' => 'published-biz',
        'subdomain_type' => 'random',
        'sector' => 'Services',
        'is_published' => true,
    ]);

    Business::create([
        'name' => 'Draft Biz',
        'subdomain' => 'draft-biz',
        'subdomain_type' => 'random',
        'sector' => 'Services',
        'is_published' => false,
    ]);

    expect(Business::published()->count())->toBe(1);
});
