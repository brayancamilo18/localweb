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

it('createFromOnboarding with free plan leaves is_published false until step 8', function () {
    $owner = User::factory()->create();
    $service = new BusinessService();

    $business = $service->createFromOnboarding($owner, [
        'name' => 'Published Free',
        'subdomain_type' => 'random',
        'sector' => 'otros',
    ], 'free');

    expect($business->is_published)->toBeFalse();
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

it('getSubdomainRejectionReason flags reserved subdomains from config', function () {
    $service = new BusinessService();

    foreach (['admin', 'api', 'www', 'login'] as $reserved) {
        expect($service->getSubdomainRejectionReason($reserved))->toBe('reserved');
        expect($service->isSubdomainAvailable($reserved))->toBeFalse();
    }
});

it('getSubdomainRejectionReason flags too short and too long', function () {
    $service = new BusinessService();

    expect($service->getSubdomainRejectionReason('ab'))->toBe('too_short');

    $tooLong = str_repeat('a', 64);
    expect($service->getSubdomainRejectionReason($tooLong))->toBe('too_long');
});

it('getSubdomainRejectionReason flags invalid format', function () {
    $service = new BusinessService();

    expect($service->getSubdomainRejectionReason('-leading'))->toBe('invalid_format');
    expect($service->getSubdomainRejectionReason('trailing-'))->toBe('invalid_format');
    expect($service->getSubdomainRejectionReason('with space'))->toBe('invalid_format');
    expect($service->getSubdomainRejectionReason('emoji😀'))->toBe('invalid_format');
    // Las mayúsculas no son inválidas: el servicio normaliza a minúsculas antes de validar.
    expect($service->getSubdomainRejectionReason('UPPER'))->toBeNull();
});

it('getSubdomainRejectionReason flags taken subdomains', function () {
    Business::create([
        'name' => 'Owned',
        'subdomain' => 'mi-tienda',
        'subdomain_type' => 'custom',
        'sector' => 'otros',
    ]);

    $service = new BusinessService();

    expect($service->getSubdomainRejectionReason('mi-tienda'))->toBe('taken');
});

it('getSubdomainRejectionReason returns null for valid available subdomains', function () {
    $service = new BusinessService();

    expect($service->getSubdomainRejectionReason('mi-marca-2026'))->toBeNull();
    expect($service->isSubdomainAvailable('mi-marca-2026'))->toBeTrue();
});

it('getSubdomainRejectionReason normalises to lowercase and trims spaces', function () {
    Business::create([
        'name' => 'Owned',
        'subdomain' => 'cafe-nube',
        'subdomain_type' => 'custom',
        'sector' => 'otros',
    ]);

    $service = new BusinessService();

    // Variantes con mayúsculas/espacios se normalizan y detectan como ya tomado.
    expect($service->getSubdomainRejectionReason('  CAFE-NUBE  '))->toBe('taken');
    expect($service->getSubdomainRejectionReason('CAFE-NUBE'))->toBe('taken');
});
