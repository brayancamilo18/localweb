<?php

use App\Models\Business;
use App\Support\PublicPageCache;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Queue;

uses(RefreshDatabase::class);

beforeEach(function () {
    Queue::fake();
    Cache::flush();
});

it('serves published business page', function () {
    $business = createPublishedBusiness(['name' => 'Salón SEO Test']);

    $response = test()->get(tenantUrl($business));

    $response->assertOk();
    expect($response->getContent())->toContain('Salón SEO Test')
        ->and($response->getContent())->toContain('og:title')
        ->and($response->getContent())->toContain('application/ld+json');
});

it('returns 404 for unpublished business', function () {
    $business = createPublishedBusiness(['is_published' => false]);

    test()->get(tenantUrl($business))->assertNotFound();
});

it('returns 404 for nonexistent subdomain', function () {
    test()->get('http://nonexistent-xyz-123.'.config('localweb.domains.tenant_suffix').'/')
        ->assertNotFound();
});

it('sets X-Cache MISS on first request', function () {
    $business = createPublishedBusiness();
    PublicPageCache::forgetAll($business->subdomain);

    $response = test()->get(tenantUrl($business));

    $response->assertOk()
        ->assertHeader('X-Cache', 'MISS');
});

it('sets X-Cache HIT on second request', function () {
    $business = createPublishedBusiness();
    PublicPageCache::forgetAll($business->subdomain);

    test()->get(tenantUrl($business));
    $response = test()->get(tenantUrl($business));

    $response->assertOk()
        ->assertHeader('X-Cache', 'HIT');
});

it('uses fallback template when template not found', function () {
    $business = createPublishedBusiness(['template_id' => null]);

    test()->get(tenantUrl($business))->assertOk();
});

it('invalidates cache when business is updated', function () {
    $business = createPublishedBusiness();
    PublicPageCache::forgetAll($business->subdomain);

    test()->get(tenantUrl($business));
    test()->get(tenantUrl($business))->assertHeader('X-Cache', 'HIT');

    $business->touch();

    test()->get(tenantUrl($business))->assertHeader('X-Cache', 'MISS');
});
