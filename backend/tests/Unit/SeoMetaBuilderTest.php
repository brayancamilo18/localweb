<?php

use App\Models\Business;
use App\Services\SeoMetaBuilder;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

const SEO_META_KEYS = [
    'title',
    'description',
    'canonical',
    'og_image',
    'og_title',
    'og_description',
    'og_url',
    'og_type',
    'og_site_name',
    'twitter_card',
    'twitter_title',
    'twitter_description',
    'twitter_image',
    'robots',
    'hreflang',
    'favicon_url',
    'favicon_type',
];

it('builds all required seo keys', function () {
    $business = Business::factory()->published()->create();

    $seo = app(SeoMetaBuilder::class)->build($business);

    expect($seo)->toHaveKeys(SEO_META_KEYS);
});

it('truncates title to 60 characters', function () {
    $business = Business::factory()->create([
        'name' => str_repeat('a', 50),
        'tagline' => str_repeat('b', 50),
    ]);

    $seo = app(SeoMetaBuilder::class)->build($business);

    expect(mb_strlen($seo['title']))->toBeLessThanOrEqual(60);
});

it('truncates description to 155 characters', function () {
    $business = Business::factory()->create([
        'description' => str_repeat('x', 200),
    ]);

    $seo = app(SeoMetaBuilder::class)->build($business);

    expect(mb_strlen($seo['description']))->toBeLessThanOrEqual(155);
});

it('uses tagline in title when available', function () {
    $business = Business::factory()->create([
        'name' => 'Mi Negocio',
        'tagline' => 'El mejor',
        'city' => null,
    ]);

    $seo = app(SeoMetaBuilder::class)->build($business);

    expect($seo['title'])->toContain('Mi Negocio')
        ->and($seo['title'])->toContain('El mejor');
});

it('uses sector and city in title when no tagline', function () {
    $business = Business::factory()->create([
        'name' => 'Mi Negocio',
        'tagline' => null,
        'sector' => 'Peluquería',
        'city' => 'Madrid',
    ]);

    $seo = app(SeoMetaBuilder::class)->build($business);

    expect($seo['title'])->toContain('Madrid');
});

it('sets robots to noindex for unpublished business', function () {
    $business = Business::factory()->create([
        'is_published' => false,
    ]);

    $seo = app(SeoMetaBuilder::class)->build($business);

    expect($seo['robots'])->toBe('noindex, nofollow');
});

it('sets robots to index for published business', function () {
    $business = Business::factory()->published()->create();

    $seo = app(SeoMetaBuilder::class)->build($business);

    expect($seo['robots'])->toBe('index, follow');
});

it('builds canonical url correctly', function () {
    $business = Business::factory()->create([
        'subdomain' => 'kairos',
    ]);

    $seo = app(SeoMetaBuilder::class)->build($business);

    expect($seo['canonical'])->toBe('https://kairos.'.config('localweb.domains.tenant_suffix').'/');
});

it('uses default og image when no cover image', function () {
    $business = Business::factory()->create();
    $business->setRelation('images', collect());

    $seo = app(SeoMetaBuilder::class)->build($business);

    expect($seo['og_image'])->toBe(config('localweb.seo.default_og_image'));
});
