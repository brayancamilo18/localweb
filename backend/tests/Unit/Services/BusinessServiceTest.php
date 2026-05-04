<?php

use App\Models\Business;
use App\Models\User;
use App\Services\BusinessService;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('createFromOnboarding with free plan generates random subdomain', function () {
    $owner = User::factory()->create();
    $service = new BusinessService();

    $business = $service->createFromOnboarding($owner, [
        'name' => 'Free Business',
        'subdomain_type' => 'random',
        'sector' => 'otros',
    ], 'free');

    expect($business->subdomain)->toMatch('/^[bcdfghjkmnpqrstvwxyz23456789]{3}-[bcdfghjkmnpqrstvwxyz23456789]{4}-[bcdfghjkmnpqrstvwxyz23456789]{4}$/');
});

it('createFromOnboarding with free plan sets is_published true', function () {
    $owner = User::factory()->create();
    $service = new BusinessService();

    $business = $service->createFromOnboarding($owner, [
        'name' => 'Published Free',
        'subdomain_type' => 'random',
        'sector' => 'otros',
    ], 'free');

    expect($business->is_published)->toBeTrue();
});

it('generateRandomSubdomain returns valid 3-4-4 format', function () {
    $service = new BusinessService();
    $subdomain = $service->generateRandomSubdomain();

    expect($subdomain)->toMatch('/^[bcdfghjkmnpqrstvwxyz23456789]{3}-[bcdfghjkmnpqrstvwxyz23456789]{4}-[bcdfghjkmnpqrstvwxyz23456789]{4}$/');
});

it('isSubdomainAvailable returns false when subdomain already exists', function () {
    Business::create([
        'name' => 'Taken Business',
        'subdomain' => 'abc-def-ghij',
        'subdomain_type' => 'random',
        'sector' => 'otros',
    ]);

    $service = new BusinessService();

    expect($service->isSubdomainAvailable('abc-def-ghij'))->toBeFalse();
});
