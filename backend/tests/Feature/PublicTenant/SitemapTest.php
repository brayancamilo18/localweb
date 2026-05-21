<?php

use App\Models\Business;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Cache;

uses(RefreshDatabase::class);

beforeEach(function () {
    Cache::flush();
});

it('serves tenant sitemap xml', function () {
    $business = createPublishedBusiness();

    $response = test()->get(tenantUrl($business, '/sitemap.xml'));

    $response->assertOk();
    expect($response->headers->get('Content-Type'))->toContain('application/xml');

    $xml = $response->getContent();
    expect(simplexml_load_string($xml))->not->toBeFalse()
        ->and($xml)->toContain('<urlset')
        ->and($xml)->toContain('<loc>')
        ->and($xml)->toContain($business->subdomain)
        ->and($xml)->toContain('<lastmod>');
});

it('serves master sitemap index', function () {
    createPublishedBusiness();
    createPublishedBusiness();
    createPublishedBusiness();

    $response = test()->get('http://'.config('localweb.domains.root').'/sitemap-index.xml');

    $response->assertOk();
    $xml = $response->getContent();
    expect(simplexml_load_string($xml))->not->toBeFalse()
        ->and($xml)->toContain('<sitemapindex')
        ->and(substr_count($xml, '<sitemap>'))->toBe(3);
});

it('excludes unpublished businesses from master sitemap', function () {
    createPublishedBusiness();
    Business::factory()->create(['is_published' => false]);
    Cache::forget('sitemap:master');

    $response = test()->get('http://'.config('localweb.domains.root').'/sitemap-index.xml');

    expect(substr_count($response->getContent(), '<sitemap>'))->toBe(1);
});

it('caches tenant sitemap', function () {
    $business = createPublishedBusiness();
    Cache::forget('sitemap:tenant:'.$business->subdomain);

    test()->get(tenantUrl($business, '/sitemap.xml'));

    expect(Cache::get('sitemap:tenant:'.$business->subdomain))->not->toBeNull();
});

it('invalidates tenant sitemap when business is saved', function () {
    $business = createPublishedBusiness();
    Cache::put('sitemap:tenant:'.$business->subdomain, '<xml/>', 3600);

    $business->touch();

    expect(Cache::get('sitemap:tenant:'.$business->subdomain))->toBeNull();
});

it('invalidates master sitemap when business is published', function () {
    $business = Business::factory()->create(['is_published' => false]);
    Cache::put('sitemap:master', '<xml/>', 1800);

    $business->update(['is_published' => true]);

    expect(Cache::get('sitemap:master'))->toBeNull();
});

it('regenerates master sitemap via artisan command', function () {
    createPublishedBusiness();
    createPublishedBusiness();

    Artisan::call('sitemap:regenerate-master');

    expect(Artisan::output())
        ->toContain('Regenerando sitemap maestro')
        ->toContain('Sitemap maestro regenerado: 2 negocios incluidos.');
    expect(Cache::get('sitemap:master'))->not->toBeNull();
});
