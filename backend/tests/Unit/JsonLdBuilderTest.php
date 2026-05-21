<?php

use App\Models\Business;
use App\Services\JsonLdBuilder;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('generates valid json', function () {
    $business = Business::factory()->create();
    $business->setRelation('images', collect());

    $jsonLd = app(JsonLdBuilder::class)->build($business);

    expect(json_decode($jsonLd, true))->not->toBeNull();
});

it('includes required schema fields', function () {
    $business = Business::factory()->create([
        'name' => 'Schema Biz',
    ]);
    $business->setRelation('images', collect());

    $decoded = json_decode(app(JsonLdBuilder::class)->build($business), true);

    expect($decoded)->toHaveKeys(['@context', '@type', 'name', 'url']);
});

it('sets correct context', function () {
    $business = Business::factory()->create();
    $business->setRelation('images', collect());

    $decoded = json_decode(app(JsonLdBuilder::class)->build($business), true);

    expect($decoded['@context'])->toBe('https://schema.org');
});

it('maps restauracion sector to FoodEstablishment', function () {
    $business = Business::factory()->create(['sector' => 'restauracion']);
    $business->setRelation('images', collect());

    $decoded = json_decode(app(JsonLdBuilder::class)->build($business), true);

    expect($decoded['@type'])->toBe('FoodEstablishment');
});

it('maps peluqueria sector to HealthAndBeautyBusiness', function () {
    $business = Business::factory()->create(['sector' => 'peluqueria']);
    $business->setRelation('images', collect());

    $decoded = json_decode(app(JsonLdBuilder::class)->build($business), true);

    expect($decoded['@type'])->toBe('HealthAndBeautyBusiness');
});

it('defaults to LocalBusiness for unknown sector', function () {
    $business = Business::factory()->create(['sector' => 'otro-sector-desconocido']);
    $business->setRelation('images', collect());

    $decoded = json_decode(app(JsonLdBuilder::class)->build($business), true);

    expect($decoded['@type'])->toBe('LocalBusiness');
});

it('omits null fields', function () {
    $business = Business::factory()->create([
        'phone' => null,
        'email' => null,
        'address' => null,
        'city' => null,
    ]);
    $business->setRelation('images', collect());

    $jsonLd = app(JsonLdBuilder::class)->build($business);
    $decoded = json_decode($jsonLd, true);

    expect($decoded)->not->toHaveKeys(['telephone', 'email', 'address'])
        ->and($jsonLd)->not->toContain(':null');
});

it('includes opening hours when schedule present', function () {
    $business = Business::factory()->create([
        'schedule' => [
            'mon' => ['closed' => false, 'open' => '09:00', 'close' => '18:00'],
        ],
    ]);
    $business->setRelation('images', collect());

    $decoded = json_decode(app(JsonLdBuilder::class)->build($business), true);

    expect($decoded)->toHaveKey('openingHoursSpecification')
        ->and($decoded['openingHoursSpecification'][0]['dayOfWeek'])->toBe('https://schema.org/Monday');
});

it('omits closed days from opening hours', function () {
    $business = Business::factory()->create([
        'schedule' => [
            'mon' => ['closed' => true, 'open' => '09:00', 'close' => '18:00'],
        ],
    ]);
    $business->setRelation('images', collect());

    $decoded = json_decode(app(JsonLdBuilder::class)->build($business), true);

    expect($decoded)->not->toHaveKey('openingHoursSpecification');
});

it('includes sameAs when business has social urls', function () {
    $business = Business::factory()->create([
        'instagram_url' => 'https://instagram.com/test',
    ]);
    $business->setRelation('images', collect());

    $decoded = json_decode(app(JsonLdBuilder::class)->build($business), true);

    expect($decoded['sameAs'])->toContain('https://instagram.com/test');
});
