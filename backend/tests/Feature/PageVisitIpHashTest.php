<?php

use App\Enums\EventType;
use App\Jobs\RegisterPageVisit;
use App\Models\Business;
use App\Models\PageVisit;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Schema;

uses(RefreshDatabase::class);

it('persists ip_hash as hmac sha256 and truncates user agent', function () {
    config(['services.analytics.ip_salt' => 'unit-test-salt']);

    expect(Schema::hasColumn('page_visits', 'ip'))->toBeFalse()
        ->and(Schema::hasColumn('page_visits', 'ip_hash'))->toBeTrue();

    $business = Business::create([
        'name' => 'B',
        'subdomain' => 'hash-test-'.uniqid(),
        'subdomain_type' => 'random',
        'sector' => 'otros',
        'is_published' => true,
    ]);

    $longUa = str_repeat('Z', 400);
    $job = new RegisterPageVisit($business->id, EventType::Visit, '203.0.113.7', $longUa);
    app()->call([$job, 'handle']);

    $row = PageVisit::first();
    expect($row)->not->toBeNull()
        ->and($row->ip_hash)->toBe(hash_hmac('sha256', '203.0.113.7', 'unit-test-salt'))
        ->and(strlen((string) $row->user_agent))->toBe(255)
        ->and($row->user_agent)->toBe(str_repeat('Z', 255));
});

it('does not persist ip_hash when salt is empty', function () {
    config(['services.analytics.ip_salt' => '']);

    $business = Business::create([
        'name' => 'B',
        'subdomain' => 'no-salt-'.uniqid(),
        'subdomain_type' => 'random',
        'sector' => 'otros',
        'is_published' => true,
    ]);

    $job = new RegisterPageVisit($business->id, EventType::PhoneClick, '198.51.100.2', 'Mozilla');
    app()->call([$job, 'handle']);

    expect(PageVisit::first()->ip_hash)->toBeNull();
});
