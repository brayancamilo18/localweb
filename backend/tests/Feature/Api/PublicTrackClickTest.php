<?php

use App\Models\Business;
use App\Models\PageVisit;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function createPublishedBusinessForTrack(string $subdomain): Business
{
    return Business::create([
        'name' => 'Track Test Biz',
        'subdomain' => $subdomain,
        'subdomain_type' => 'random',
        'sector' => 'otros',
        'is_published' => true,
    ]);
}

it('persists whatsapp_click synchronously on public track endpoint', function () {
    $business = createPublishedBusinessForTrack('track-wa-'.uniqid());

    test()->postJson('/api/v1/public/'.$business->subdomain.'/track', [
        'type' => 'whatsapp_click',
    ])->assertOk()->assertJsonPath('data.ok', true);

    expect(PageVisit::query()->where('business_id', $business->id)->count())->toBe(1);

    test()->assertDatabaseHas('page_visits', [
        'business_id' => $business->id,
        'event_type' => 'whatsapp_click',
    ]);
});

it('persists phone_click synchronously on public track endpoint', function () {
    $business = createPublishedBusinessForTrack('track-phone-'.uniqid());

    test()->postJson('/api/v1/public/'.$business->subdomain.'/track', [
        'type' => 'phone_click',
    ])->assertOk()->assertJsonPath('data.ok', true);

    expect(PageVisit::query()->where('business_id', $business->id)->count())->toBe(1);

    test()->assertDatabaseHas('page_visits', [
        'business_id' => $business->id,
        'event_type' => 'phone_click',
    ]);
});

it('rejects invalid track type with 422', function () {
    $business = createPublishedBusinessForTrack('track-invalid-'.uniqid());

    test()->postJson('/api/v1/public/'.$business->subdomain.'/track', [
        'type' => 'not_a_real_event',
    ])->assertStatus(422);

    expect(PageVisit::count())->toBe(0);
});
