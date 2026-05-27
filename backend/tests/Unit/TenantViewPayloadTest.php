<?php

use App\Models\Business;
use App\Models\Template;
use App\Services\TenantViewPayload;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;

uses(RefreshDatabase::class);

function tenantPayloadTemplate(string $slug): Template
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

it('builds payload with all required keys', function () {
    $business = Business::factory()->create();
    $business->load(['template', 'services', 'images']);

    $payload = app(TenantViewPayload::class)->build($business);

    expect($payload)->toHaveKeys([
        'business',
        'logo_url',
        'nombre',
        'tagline',
        'telefono',
        'whatsapp',
        'portada',
        'portada_2',
        'portada_3',
        'descripcion',
        'foto_equipo',
        'direccion',
        'ciudad',
        'pais',
        'anio_fundacion',
        'correo',
        'galeria',
        'horario',
        'map_lat',
        'map_lon',
        'services',
        'google_maps_url',
        'google_business_url',
        'booking_url',
        'vcard_enabled',
        'is_pro',
        'brand_color',
        'brand_variable',
        'subdomain',
        'api_base_url',
        'vcard_download_url',
        'instagram_url',
        'tiktok_url',
        'facebook_url',
    ]);
});

it('derives whatsapp digits from phone', function () {
    $business = Business::factory()->create([
        'phone' => '+34 612 345 678',
    ]);

    $payload = app(TenantViewPayload::class)->build($business);

    expect($payload['whatsapp'])->toBe('34612345678');
});

it('returns empty string for whatsapp when no phone', function () {
    $business = Business::factory()->create([
        'phone' => null,
    ]);

    $payload = app(TenantViewPayload::class)->build($business);

    expect($payload['whatsapp'])->toBe('');
});

it('uses config fallback for social urls when business has none', function () {
    $business = Business::factory()->create([
        'instagram_url' => null,
        'tiktok_url' => null,
        'facebook_url' => null,
    ]);

    $payload = app(TenantViewPayload::class)->build($business);

    expect($payload['instagram_url'])->toBe(config('localweb.default_social.instagram'));
});

it('does not execute queries when images not loaded', function () {
    $business = Business::factory()->create();
    $business = Business::query()->find($business->id);

    DB::enableQueryLog();
    DB::flushQueryLog();

    $payload = app(TenantViewPayload::class)->build($business);

    expect($payload['portada'])->toBe('')
        ->and($payload['galeria'])->toBe([])
        ->and(count(DB::getQueryLog()))->toBe(0);
});

it('builds vcard_download_url correctly', function () {
    $business = Business::factory()->create([
        'subdomain' => 'test-biz',
    ]);

    $payload = app(TenantViewPayload::class)->build($business);

    expect($payload['vcard_download_url'])->toContain('/api/v1/public/test-biz/vcard');
});

it('includes custom brand_color in payload when not in curated palette', function () {
    $template = tenantPayloadTemplate('urban-bold');
    $business = Business::factory()->create([
        'template_id' => $template->id,
        'brand_color' => '#19b3f5',
    ]);
    $business->load('template');

    $payload = app(TenantViewPayload::class)->build($business);

    expect($payload['brand_color'])->toBe('#19b3f5')
        ->and($payload['brand_variable'])->toBe('--lime');
});

it('omits brand_color when stored hex is invalid', function () {
    $template = tenantPayloadTemplate('urban-bold');
    $business = Business::factory()->create([
        'template_id' => $template->id,
        'brand_color' => 'not-a-hex',
    ]);
    $business->load('template');

    $payload = app(TenantViewPayload::class)->build($business);

    expect($payload['brand_color'])->toBeNull();
});
