<?php

use App\Enums\Plan;
use App\Models\Business;
use App\Models\Template;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function previewDashboardUser(Business $business): User
{
    return User::factory()->create(['business_id' => $business->id]);
}

function previewActiveTemplate(array $overrides = []): Template
{
    $slug = $overrides['slug'] ?? 'tpl-preview-'.uniqid('', true);

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

function previewProBusiness(Template $template, array $overrides = []): Business
{
    return Business::factory()->create(array_merge([
        'plan' => Plan::Pro,
        'template_id' => $template->id,
        'onboarding_completed_at' => now(),
        'is_published' => true,
    ], $overrides));
}

it('returns preview for valid template change', function () {
    $current = previewActiveTemplate(['slug' => 'urban-bold', 'name' => 'Urban Bold']);
    $target = previewActiveTemplate(['slug' => 'trust-clinic', 'name' => 'Trust Clinic']);
    $business = previewProBusiness($current, ['brand_color' => '#ff80ab']);
    $user = previewDashboardUser($business);

    test()->actingAs($user)
        ->getJson('/api/v1/dashboard/template/'.$target->id.'/preview')
        ->assertOk()
        ->assertJsonPath('same_template', false)
        ->assertJsonPath('template.slug', 'trust-clinic')
        ->assertJsonPath('brand_color.has_current', true)
        ->assertJsonPath('brand_color.current_in_new', false);
});

it('returns same_template true if user picks current template', function () {
    $current = previewActiveTemplate(['slug' => 'urban-bold']);
    $business = previewProBusiness($current);
    $user = previewDashboardUser($business);

    test()->actingAs($user)
        ->getJson('/api/v1/dashboard/template/'.$current->id.'/preview')
        ->assertOk()
        ->assertJsonPath('same_template', true);
});

it('suggests closest color from new palette via Lab distance', function () {
    $current = previewActiveTemplate(['slug' => 'urban-bold']);
    $target = previewActiveTemplate(['slug' => 'trust-clinic']);
    $business = previewProBusiness($current, ['brand_color' => '#ff80ab']);
    $user = previewDashboardUser($business);

    test()->actingAs($user)
        ->getJson('/api/v1/dashboard/template/'.$target->id.'/preview')
        ->assertOk()
        ->assertJsonPath('brand_color.suggested_color', '#7a3e3e');
});

it('reports current_in_new true when current color exists in new palette', function () {
    $current = previewActiveTemplate(['slug' => 'urban-bold']);
    $target = previewActiveTemplate(['slug' => 'tech-sleek']);
    $business = previewProBusiness($current, ['brand_color' => '#a3e635']);
    $user = previewDashboardUser($business);

    test()->actingAs($user)
        ->getJson('/api/v1/dashboard/template/'.$target->id.'/preview')
        ->assertOk()
        ->assertJsonPath('brand_color.current_in_new', true)
        ->assertJsonPath('brand_color.suggested_color', '#a3e635');
});

it('returns new_template_supported false for wild-pet', function () {
    $current = previewActiveTemplate(['slug' => 'urban-bold']);
    $target = previewActiveTemplate(['slug' => 'wild-pet', 'name' => 'Wild Pet']);
    $business = previewProBusiness($current, ['brand_color' => '#ff80ab']);
    $user = previewDashboardUser($business);

    test()->actingAs($user)
        ->getJson('/api/v1/dashboard/template/'.$target->id.'/preview')
        ->assertOk()
        ->assertJsonPath('brand_color.new_template_supported', false);
});

it('free user gets 403', function () {
    $current = previewActiveTemplate(['slug' => 'free-current']);
    $target = previewActiveTemplate(['slug' => 'free-target']);
    $business = Business::factory()->create([
        'plan' => Plan::Free,
        'template_id' => $current->id,
        'onboarding_completed_at' => now(),
    ]);
    $user = previewDashboardUser($business);

    test()->actingAs($user)
        ->getJson('/api/v1/dashboard/template/'.$target->id.'/preview')
        ->assertStatus(403);
});

it('cooldown returns 429 with available_at', function () {
    $current = previewActiveTemplate(['slug' => 'cooldown-current']);
    $target = previewActiveTemplate(['slug' => 'cooldown-target']);
    $business = previewProBusiness($current, [
        'template_changed_at' => now()->subDays(5),
    ]);
    $user = previewDashboardUser($business);

    test()->actingAs($user)
        ->getJson('/api/v1/dashboard/template/'.$target->id.'/preview')
        ->assertStatus(429)
        ->assertJsonPath('errors.cooldown', true);
});

it('inactive template returns 422', function () {
    $current = previewActiveTemplate(['slug' => 'inactive-current']);
    $target = previewActiveTemplate(['slug' => 'inactive-target', 'is_active' => false]);
    $business = previewProBusiness($current);
    $user = previewDashboardUser($business);

    test()->actingAs($user)
        ->getJson('/api/v1/dashboard/template/'.$target->id.'/preview')
        ->assertStatus(422);
});

it('unauthenticated returns 401', function () {
    $template = previewActiveTemplate(['slug' => 'auth-preview']);

    test()->getJson('/api/v1/dashboard/template/'.$template->id.'/preview')
        ->assertUnauthorized();
});

it('preview returns covers info with will_trim=true when current covers exceed new slots', function () {
    $multi = previewActiveTemplate(['slug' => 'tpl-cov-multi', 'hero_photo_slots' => 3]);
    $single = previewActiveTemplate(['slug' => 'tpl-cov-single', 'hero_photo_slots' => 1]);

    $business = previewProBusiness($multi, ['template_changed_at' => null]);
    foreach ([1, 2, 3] as $order) {
        \App\Models\BusinessImage::create([
            'business_id' => $business->id,
            'section' => \App\Enums\ImageSection::Cover->value,
            'path' => "businesses/{$business->id}/cover/test-{$order}.webp",
            'display_order' => $order,
        ]);
    }

    $user = previewDashboardUser($business);

    test()->actingAs($user)
        ->getJson("/api/v1/dashboard/template/{$single->id}/preview")
        ->assertOk()
        ->assertJsonPath('covers.current_count', 3)
        ->assertJsonPath('covers.new_slots', 1)
        ->assertJsonPath('covers.excess', 2)
        ->assertJsonPath('covers.will_trim', true);
});

it('preview returns will_trim=false when current covers fit in new slots', function () {
    $single = previewActiveTemplate(['slug' => 'tpl-cov-fit-cur', 'hero_photo_slots' => 1]);
    $multi = previewActiveTemplate(['slug' => 'tpl-cov-fit-new', 'hero_photo_slots' => 3]);

    $business = previewProBusiness($single, ['template_changed_at' => null]);
    \App\Models\BusinessImage::create([
        'business_id' => $business->id,
        'section' => \App\Enums\ImageSection::Cover->value,
        'path' => "businesses/{$business->id}/cover/only.webp",
        'display_order' => 1,
    ]);

    $user = previewDashboardUser($business);

    test()->actingAs($user)
        ->getJson("/api/v1/dashboard/template/{$multi->id}/preview")
        ->assertOk()
        ->assertJsonPath('covers.current_count', 1)
        ->assertJsonPath('covers.new_slots', 3)
        ->assertJsonPath('covers.excess', 0)
        ->assertJsonPath('covers.will_trim', false);
});
