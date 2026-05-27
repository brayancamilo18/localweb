<?php

use App\Enums\Plan;
use App\Models\Business;
use App\Models\Template;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function changeBrandUser(Business $business): User
{
    return User::factory()->create(['business_id' => $business->id]);
}

function changeBrandTemplate(array $overrides = []): Template
{
    $slug = $overrides['slug'] ?? 'tpl-change-'.uniqid('', true);

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

function changeBrandProBusiness(Template $template, array $overrides = []): Business
{
    return Business::factory()->create(array_merge([
        'plan' => Plan::Pro,
        'template_id' => $template->id,
        'onboarding_completed_at' => now(),
        'is_published' => true,
        'template_changed_at' => null,
    ], $overrides));
}

it('applies brand_color when sent in body and color is valid for new template', function () {
    $current = changeBrandTemplate(['slug' => 'urban-bold']);
    $target = changeBrandTemplate(['slug' => 'trust-clinic']);
    $business = changeBrandProBusiness($current, ['brand_color' => '#ff80ab']);
    $user = changeBrandUser($business);

    test()->actingAs($user)
        ->postJson('/api/v1/dashboard/template', [
            'template_id' => $target->id,
            'brand_color' => '#7a3e3e',
        ])
        ->assertOk();

    $fresh = $business->fresh();
    expect($fresh->template_id)->toBe($target->id)
        ->and($fresh->brand_color)->toBe('#7a3e3e');
});

it('accepts brand_color that fails contrast on new template', function () {
    $current = changeBrandTemplate(['slug' => 'urban-bold']);
    $target = changeBrandTemplate(['slug' => 'mono-edito']);
    $business = changeBrandProBusiness($current);
    $user = changeBrandUser($business);

    test()->actingAs($user)
        ->postJson('/api/v1/dashboard/template', [
            'template_id' => $target->id,
            'brand_color' => '#ffff00',
        ])
        ->assertOk();

    expect($business->fresh()->brand_color)->toBe('#ffff00');
});

it('accepts custom brand_color that passes contrast on new template', function () {
    $current = changeBrandTemplate(['slug' => 'urban-bold']);
    $target = changeBrandTemplate(['slug' => 'mono-edito']);
    $business = changeBrandProBusiness($current);
    $user = changeBrandUser($business);

    test()->actingAs($user)
        ->postJson('/api/v1/dashboard/template', [
            'template_id' => $target->id,
            'brand_color' => '#0066cc',
        ])
        ->assertOk();

    expect($business->fresh()->brand_color)->toBe('#0066cc');
});

it('clears brand_color when null sent explicitly', function () {
    $current = changeBrandTemplate(['slug' => 'urban-bold']);
    $target = changeBrandTemplate(['slug' => 'trust-clinic']);
    $business = changeBrandProBusiness($current, ['brand_color' => '#ff80ab']);
    $user = changeBrandUser($business);

    test()->actingAs($user)
        ->postJson('/api/v1/dashboard/template', [
            'template_id' => $target->id,
            'brand_color' => null,
        ])
        ->assertOk();

    expect($business->fresh()->brand_color)->toBeNull();
});

it('preserves brand_color in DB when not sent in body', function () {
    $current = changeBrandTemplate(['slug' => 'urban-bold']);
    $target = changeBrandTemplate(['slug' => 'trust-clinic']);
    $business = changeBrandProBusiness($current, ['brand_color' => '#ff80ab']);
    $user = changeBrandUser($business);

    test()->actingAs($user)
        ->postJson('/api/v1/dashboard/template', [
            'template_id' => $target->id,
        ])
        ->assertOk();

    expect($business->fresh()->brand_color)->toBe('#ff80ab');
});

it('template change cooldown still applies', function () {
    $current = changeBrandTemplate(['slug' => 'cooldown-brand-current']);
    $target = changeBrandTemplate(['slug' => 'cooldown-brand-target']);
    $business = changeBrandProBusiness($current, [
        'template_changed_at' => now()->subDays(10),
    ]);
    $user = changeBrandUser($business);

    test()->actingAs($user)
        ->postJson('/api/v1/dashboard/template', ['template_id' => $target->id])
        ->assertStatus(429);

    expect($business->fresh()->template_id)->toBe($current->id);
});
