<?php

use App\Models\Business;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;

uses(RefreshDatabase::class);

it('public get non existing subdomain returns 404', function () {
    test()->getJson('/api/v1/public/no-exists')->assertStatus(404);
});

it('public get unpublished subdomain returns 404', function () {
    Business::create([
        'name' => 'B',
        'subdomain' => 'abc-def-ghij',
        'subdomain_type' => 'random',
        'sector' => 'otros',
        'is_published' => false,
    ]);

    test()->getJson('/api/v1/public/abc-def-ghij')->assertStatus(404);
});

it('public get published subdomain returns 200', function () {
    Business::create([
        'name' => 'B',
        'subdomain' => 'bcd-efgh-jklm',
        'subdomain_type' => 'random',
        'sector' => 'otros',
        'is_published' => true,
    ]);

    test()->getJson('/api/v1/public/bcd-efgh-jklm')
        ->assertStatus(200)
        ->assertJsonPath('data.subdomain', 'bcd-efgh-jklm');
});

it('public get registers page visit', function () {
    Queue::fake();
    Business::create([
        'name' => 'B',
        'subdomain' => 'ccc-dddd-eeee',
        'subdomain_type' => 'random',
        'sector' => 'otros',
        'is_published' => true,
    ]);

    test()->getJson('/api/v1/public/ccc-dddd-eeee')->assertStatus(200);
});

it('public track valid type returns 200 and page visit in db', function () {
    $business = Business::create([
        'name' => 'B',
        'subdomain' => 'ddd-eeee-ffff',
        'subdomain_type' => 'random',
        'sector' => 'otros',
        'is_published' => true,
    ]);

    test()->postJson('/api/v1/public/ddd-eeee-ffff/track', [
        'type' => 'phone_click',
    ])->assertStatus(200);

    test()->assertDatabaseHas('page_visits', [
        'business_id' => $business->id,
        'event_type' => 'phone_click',
    ]);
});
