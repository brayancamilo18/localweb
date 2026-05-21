<?php

use App\Http\Controllers\PublicRobotsController;
use App\Models\Business;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

uses(RefreshDatabase::class);

beforeEach(function () {
    Cache::flush();
});

it('serves robots txt for published tenant', function () {
    $business = createPublishedBusiness();

    $response = test()->get(tenantUrl($business, '/robots.txt'));

    $response->assertOk();
    expect($response->headers->get('Content-Type'))->toContain('text/plain')
        ->and($response->getContent())->toContain('Allow: /')
        ->and($response->getContent())->toContain('Sitemap:')
        ->and($response->getContent())->toContain($business->subdomain)
        ->and($response->getContent())->toContain('Disallow: /api/');
});

it('serves robots txt for root domain', function () {
    $request = Request::create(
        'https://'.config('localweb.domains.root').'/robots.txt'
    );
    $response = app(PublicRobotsController::class)->show($request);

    expect($response->getStatusCode())->toBe(200)
        ->and($response->getContent())->toContain('Disallow: /dashboard')
        ->and($response->getContent())->toContain('Disallow: /admin')
        ->and($response->getContent())->toContain('Disallow: /api/')
        ->and($response->getContent())->toContain('sitemap-index.xml');
});

it('caches robots response', function () {
    $business = createPublishedBusiness();
    Cache::forget('robots:'.$business->subdomain);

    test()->get(tenantUrl($business, '/robots.txt'));

    expect(Cache::get('robots:'.$business->subdomain))->not->toBeNull();
});

it('invalidates robots cache when business is saved', function () {
    $business = createPublishedBusiness();
    Cache::put('robots:'.$business->subdomain, 'cached', 3600);

    $business->touch();

    expect(Cache::get('robots:'.$business->subdomain))->toBeNull();
});
