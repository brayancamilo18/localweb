<?php

use App\Enums\Plan;
use App\Models\Business;
use App\Models\Template;
use App\Services\TemplatePalette;
use App\Support\PublicPageCache;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Queue;

uses(RefreshDatabase::class);

beforeEach(function () {
    Queue::fake();
    Cache::flush();
});

function brandRenderTemplate(string $slug): Template
{
    return Template::query()->firstOrCreate(
        ['slug' => $slug],
        [
            'name' => 'Template '.$slug,
            'primary_color' => '#000000',
            'is_active' => true,
            'requires_pro' => false,
            'hero_photo_slots' => 1,
            'sort_order' => 10,
        ],
    );
}

function publishedBusinessForBrandRender(Template $template, array $overrides = []): Business
{
    $business = Business::factory()->published()->create(array_merge([
        'template_id' => $template->id,
        'plan' => Plan::Pro,
        'onboarding_completed_at' => now(),
    ], $overrides));

    PublicPageCache::forgetAll($business->subdomain);

    return $business->fresh(['template']);
}

function brandOverrideStylePattern(string $cssVariable, string $hex): string
{
    $hex = strtolower($hex);

    // BrandColorCss inyecta derivadas (--*-hover, --*-on, etc.) en el mismo bloque :root.
    return $cssVariable.': '.$hex.';';
}

it('tenant page without brand_color renders default palette colors', function () {
    $template = brandRenderTemplate('urban-bold');
    $business = publishedBusinessForBrandRender($template, ['brand_color' => null]);

    $html = test()->get(tenantUrl($business))->assertOk()->getContent();

    expect($html)->not->toContain('<style>:root{');
});

it('tenant page with valid brand_color injects override style', function () {
    $template = brandRenderTemplate('urban-bold');
    $business = publishedBusinessForBrandRender($template, ['brand_color' => '#ff5a3a']);

    $html = test()->get(tenantUrl($business))->assertOk()->getContent();

    expect($html)->toContain(brandOverrideStylePattern('--lime', '#ff5a3a'));
});

it('tenant page with custom brand_color outside palette injects override style', function () {
    $template = brandRenderTemplate('urban-bold');
    $business = publishedBusinessForBrandRender($template, ['brand_color' => '#19b3f5']);

    $html = test()->get(tenantUrl($business))->assertOk()->getContent();

    expect($html)->toContain(brandOverrideStylePattern('--lime', '#19b3f5'))
        ->and($html)->toContain('--lime-hover:');
});

it('tenant page with brand_color but template wild-pet does NOT inject override', function () {
    $template = brandRenderTemplate('wild-pet');
    $business = publishedBusinessForBrandRender($template, ['brand_color' => '#c2410c']);

    $html = test()->get(tenantUrl($business))->assertOk()->getContent();

    expect($html)->not->toContain('<style>:root{');
});

it('tenant page sanitizes invalid hex', function () {
    $template = brandRenderTemplate('bloom-studio');
    $business = publishedBusinessForBrandRender($template);

    DB::table('businesses')->where('id', $business->id)->update([
        'brand_color' => 'javascript:alert(1)',
    ]);

    PublicPageCache::forgetAll($business->subdomain);

    $html = test()->get(tenantUrl($business->fresh()))->assertOk()->getContent();

    expect($html)->not->toContain('javascript:alert(1)')
        ->and($html)->not->toContain('<style>:root{');
});

it('each supported template injects the correct CSS variable name', function (string $slug, string $cssVariable, string $brandColor) {
    $template = brandRenderTemplate($slug);
    $business = publishedBusinessForBrandRender($template, ['brand_color' => $brandColor]);

    $html = test()->get(tenantUrl($business))->assertOk()->getContent();

    expect($html)->toContain(brandOverrideStylePattern($cssVariable, $brandColor));
})->with([
    ['bloom-studio', '--coral', '#b8336a'],
    ['coastal-calm', '--terracotta', '#5b7b9e'],
    ['craft-pro', '--orange', '#0a6cdc'],
    ['graphite-soft', '--accent', '#e89e6e'],
    ['luxe-atelier', '--champagne', '#6b4423'],
    ['mono-edito', '--accent', '#0a6cdc'],
    ['noir-elite', '--gold', '#d4b570'],
    ['tavola-warm', '--wine', '#7a2a2a'],
    ['tech-sleek', '--cyan', '#8b7cf6'],
    ['trust-clinic', '--accent', '#1e4b7c'],
    ['urban-bold', '--lime', '#ff5a3a'],
    ['versa-studio', '--warm', '#7a8260'],
]);

it('cssVariableFor returns null for wild-pet and known variables for supported templates', function () {
    $palette = app(TemplatePalette::class);

    expect($palette->cssVariableFor(brandRenderTemplate('wild-pet')))->toBeNull()
        ->and($palette->cssVariableFor(brandRenderTemplate('bloom-studio')))->toBe('--coral')
        ->and($palette->cssVariableFor(brandRenderTemplate('urban-bold')))->toBe('--lime')
        ->and($palette->cssVariableFor(null))->toBeNull();
});
