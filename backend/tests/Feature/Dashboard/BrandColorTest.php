<?php

use App\Enums\Plan;
use App\Models\Business;
use App\Models\Template;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function brandColorDashboardUser(Business $business): User
{
    return User::factory()->create(['business_id' => $business->id]);
}

function brandColorTemplate(array $overrides = []): Template
{
    $slug = $overrides['slug'] ?? 'urban-bold';

    return Template::create(array_merge([
        'name' => 'Template '.$slug,
        'slug' => $slug,
        'primary_color' => '#E55A3C',
        'is_active' => true,
        'requires_pro' => false,
        'hero_photo_slots' => 1,
        'sort_order' => 10,
    ], $overrides));
}

function brandColorProBusiness(Template $template, array $overrides = []): Business
{
    return Business::factory()->create(array_merge([
        'plan' => Plan::Pro,
        'template_id' => $template->id,
        'onboarding_completed_at' => now(),
        'is_published' => true,
    ], $overrides));
}

function brandColorFreeBusiness(Template $template, array $overrides = []): Business
{
    return Business::factory()->create(array_merge([
        'plan' => Plan::Free,
        'template_id' => $template->id,
        'onboarding_completed_at' => now(),
        'is_published' => true,
    ], $overrides));
}

it('shows palette for current template', function () {
    $template = brandColorTemplate(['slug' => 'graphite-soft']);
    $business = brandColorFreeBusiness($template);
    $user = brandColorDashboardUser($business);

    $expectedPalette = config('branding.palettes.graphite-soft');

    test()->actingAs($user)
        ->getJson('/api/v1/dashboard/brand-color')
        ->assertOk()
        ->assertJsonPath('palette', $expectedPalette)
        ->assertJsonPath('default', '#c47550')
        ->assertJsonPath('effective', '#c47550')
        ->assertJsonPath('current', null)
        ->assertJsonPath('is_pro', false)
        ->assertJsonPath('is_supported', true);
});

it('returns fallback palette for business without template', function () {
    $business = Business::factory()->create([
        'plan' => Plan::Free,
        'template_id' => null,
        'onboarding_completed_at' => now(),
        'is_published' => true,
    ]);
    $user = brandColorDashboardUser($business);

    test()->actingAs($user)
        ->getJson('/api/v1/dashboard/brand-color')
        ->assertOk()
        ->assertJsonPath('palette', config('branding.fallback'))
        ->assertJsonPath('default', '#c2410c');
});

it('free user cannot update brand color', function () {
    $template = brandColorTemplate(['slug' => 'urban-bold']);
    $business = brandColorFreeBusiness($template);
    $user = brandColorDashboardUser($business);

    test()->actingAs($user)
        ->putJson('/api/v1/dashboard/brand-color', ['brand_color' => '#ff5a3a'])
        ->assertStatus(403)
        ->assertJsonPath('message', 'Esta función requiere el plan Pro.');

    expect($business->fresh()->brand_color)->toBeNull();
});

it('pro user updates brand color with valid palette color', function () {
    $template = brandColorTemplate(['slug' => 'urban-bold']);
    $business = brandColorProBusiness($template);
    $user = brandColorDashboardUser($business);

    test()->actingAs($user)
        ->putJson('/api/v1/dashboard/brand-color', ['brand_color' => '#FF5A3A'])
        ->assertOk()
        ->assertJsonPath('brand_color', '#ff5a3a')
        ->assertJsonPath('effective_color', '#ff5a3a');

    expect($business->fresh()->brand_color)->toBe('#ff5a3a');
});

it('pro user can update brand color with a custom hex that passes contrast', function () {
    // urban-bold es 'bg', así que un fondo claro saturado pasa contraste vs ink negro.
    $template = brandColorTemplate(['slug' => 'urban-bold']);
    $business = brandColorProBusiness($template);
    $user = brandColorDashboardUser($business);

    test()->actingAs($user)
        ->putJson('/api/v1/dashboard/brand-color', ['brand_color' => '#ffaa00'])
        ->assertOk()
        ->assertJsonPath('brand_color', '#ffaa00')
        ->assertJsonPath('effective_color', '#ffaa00');

    expect($business->fresh()->brand_color)->toBe('#ffaa00');
});

it('pro user can save custom hex that fails contrast with a warning', function () {
    // mono-edito es 'text' sobre #FFFFFF; un amarillo puro no pasa 4.5 pero se guarda.
    $template = brandColorTemplate(['slug' => 'mono-edito']);
    $business = brandColorProBusiness($template);
    $user = brandColorDashboardUser($business);

    test()->actingAs($user)
        ->putJson('/api/v1/dashboard/brand-color', ['brand_color' => '#ffff00'])
        ->assertOk()
        ->assertJsonPath('brand_color', '#ffff00')
        ->assertJsonPath('effective_color', '#ffff00')
        ->assertJsonPath('contrast_warning', 'Puede que este color no se vea bien en tu plantilla. Puedes guardarlo igualmente.');

    expect($business->fresh()->brand_color)->toBe('#ffff00');
});

it('pro user gets 422 with invalid hex format', function () {
    $template = brandColorTemplate(['slug' => 'urban-bold']);
    $business = brandColorProBusiness($template);
    $user = brandColorDashboardUser($business);

    foreach (['red', '#xyz', '#fff'] as $invalid) {
        test()->actingAs($user)
            ->putJson('/api/v1/dashboard/brand-color', ['brand_color' => $invalid])
            ->assertStatus(422);
    }
});

it('pro user can clear brand color setting null', function () {
    $template = brandColorTemplate(['slug' => 'urban-bold']);
    $business = brandColorProBusiness($template, ['brand_color' => '#ff5a3a']);
    $user = brandColorDashboardUser($business);

    test()->actingAs($user)
        ->putJson('/api/v1/dashboard/brand-color', ['brand_color' => null])
        ->assertOk()
        ->assertJsonPath('brand_color', null)
        ->assertJsonPath('effective_color', '#d4ff3a');

    expect($business->fresh()->brand_color)->toBeNull();
});

it('effective uses stored color even when contrast is low on current template', function () {
    $urban = brandColorTemplate(['slug' => 'urban-bold']);
    $mono = brandColorTemplate(['slug' => 'mono-edito']);

    $business = brandColorProBusiness($urban, ['brand_color' => '#ffe0e0']);
    $business->forceFill(['template_id' => $mono->id])->save();

    $user = brandColorDashboardUser($business);

    test()->actingAs($user)
        ->getJson('/api/v1/dashboard/brand-color')
        ->assertOk()
        ->assertJsonPath('current', '#ffe0e0')
        ->assertJsonPath('effective', '#ffe0e0')
        ->assertJsonPath('default', '#c2410c')
        ->assertJsonPath('contrast_warning', 'Puede que este color no se vea bien en tu plantilla. Puedes guardarlo igualmente.');
});

it('returns 422 for unsupported template (wild-pet)', function () {
    $template = brandColorTemplate(['slug' => 'wild-pet']);
    $business = brandColorProBusiness($template);
    $user = brandColorDashboardUser($business);

    test()->actingAs($user)
        ->putJson('/api/v1/dashboard/brand-color', ['brand_color' => '#c2410c'])
        ->assertStatus(422)
        ->assertJsonPath('message', 'Esta plantilla no admite cambio de color de marca todavía.');
});

it('unauthenticated user gets 401', function () {
    test()->getJson('/api/v1/dashboard/brand-color')
        ->assertUnauthorized();
});
