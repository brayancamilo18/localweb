<?php

uses(Tests\TestCase::class)->in('Feature', 'Unit');

/**
 * Payload mínimo válido para POST /api/v1/auth/register (incluye datos de negocio).
 *
 * @param  array<string, mixed>  $overrides
 * @return array<string, mixed>
 */
function validRegisterPayload(array $overrides = []): array
{
    return array_merge([
        'name' => 'Test User',
        'email' => 'user-'.uniqid('', true).'@example.com',
        'password' => 'password123',
        'password_confirmation' => 'password123',
        'business_name' => 'Mi Salón',
        'sector' => 'peluqueria',
        'city' => 'Madrid',
        'country' => 'España',
        'country_code' => 'ES',
        'accept_terms' => true,
    ], $overrides);
}

/**
 * Plantilla Blade usada en tests de páginas públicas (debe existir en resources/views).
 */
function createTestTemplate(array $overrides = []): \App\Models\Template
{
    return \App\Models\Template::query()->firstOrCreate(
        ['slug' => $overrides['slug'] ?? 'urban-bold'],
        array_merge([
            'name' => 'Urban Bold',
            'primary_color' => '#E55A3C',
            'is_active' => true,
            'requires_pro' => false,
            'hero_photo_slots' => 1,
            'sort_order' => 10,
        ], $overrides)
    );
}

function createPublishedBusiness(array $overrides = []): \App\Models\Business
{
    $template = createTestTemplate();
    $business = \App\Models\Business::factory()
        ->published()
        ->create(array_merge([
            'template_id' => $template->id,
        ], $overrides));

    return $business->load(['template', 'services', 'images']);
}

function tenantHost(\App\Models\Business $business): string
{
    return $business->subdomain.'.'.config('localweb.domains.tenant_suffix');
}

function tenantUrl(\App\Models\Business $business, string $path = '/'): string
{
    return 'http://'.tenantHost($business).$path;
}

/** Usuario verificado (email) vinculado a un negocio para rutas /dashboard. */
function verifiedDashboardUser(\App\Models\Business $business): \App\Models\User
{
    return \App\Models\User::factory()->create(['business_id' => $business->id]);
}
