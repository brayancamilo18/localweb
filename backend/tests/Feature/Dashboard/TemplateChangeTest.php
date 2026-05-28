<?php

use App\Enums\Plan;
use App\Models\Business;
use App\Models\Template;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function verifiedDashboardUser(Business $business): User
{
    return User::factory()->create(['business_id' => $business->id]);
}

function freeBusinessWithTemplate(Template $template, array $overrides = []): Business
{
    return Business::factory()->create(array_merge([
        'plan' => Plan::Free,
        'template_id' => $template->id,
        'onboarding_completed_at' => now(),
        'is_published' => true,
    ], $overrides));
}

function proBusinessWithTemplate(Template $template, array $overrides = []): Business
{
    return Business::factory()->create(array_merge([
        'plan' => Plan::Pro,
        'template_id' => $template->id,
        'onboarding_completed_at' => now(),
        'is_published' => true,
    ], $overrides));
}

function activeTemplate(array $overrides = []): Template
{
    $slug = $overrides['slug'] ?? 'tpl-'.uniqid('', true);

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

it('free user cannot change template', function () {
    $current = activeTemplate(['slug' => 'tpl-free-current', 'requires_pro' => false]);
    $other = activeTemplate(['slug' => 'tpl-free-other', 'requires_pro' => false]);

    $business = freeBusinessWithTemplate($current, [
        'template_changed_at' => null,
    ]);
    $user = verifiedDashboardUser($business);

    test()->actingAs($user)
        ->postJson('/api/v1/dashboard/template', ['template_id' => $other->id])
        ->assertStatus(403)
        ->assertJsonPath('errors.plan', 'upgrade_required');

    $fresh = $business->fresh();
    expect($fresh->template_id)->toBe($current->id)
        ->and($fresh->template_changed_at)->toBeNull();
});

it('pro user can change template', function () {
    $current = activeTemplate(['slug' => 'tpl-pro-current', 'requires_pro' => false]);
    $other = activeTemplate(['slug' => 'tpl-pro-other', 'requires_pro' => false]);

    $business = proBusinessWithTemplate($current, [
        'template_changed_at' => null,
    ]);
    $user = verifiedDashboardUser($business);

    test()->actingAs($user)
        ->postJson('/api/v1/dashboard/template', ['template_id' => $other->id])
        ->assertStatus(200)
        ->assertJsonPath('data.template.id', $other->id);

    $fresh = $business->fresh();
    expect($fresh->template_id)->toBe($other->id)
        ->and($fresh->template_changed_at)->not->toBeNull();
});

it('pro user blocked by cooldown', function () {
    $current = activeTemplate(['slug' => 'tpl-cooldown-current', 'requires_pro' => false]);
    $other = activeTemplate(['slug' => 'tpl-cooldown-other', 'requires_pro' => false]);

    $changedAt = now()->subDays(10);
    $business = proBusinessWithTemplate($current, [
        'template_changed_at' => $changedAt,
    ]);
    $user = verifiedDashboardUser($business);

    test()->actingAs($user)
        ->postJson('/api/v1/dashboard/template', ['template_id' => $other->id])
        ->assertStatus(429)
        ->assertJsonPath('errors.cooldown', true)
        ->assertJsonPath('errors.available_at', fn ($value) => is_string($value) && $value !== '');

    expect($business->fresh()->template_id)->toBe($current->id);
});

it('pro user can change after cooldown', function () {
    $current = activeTemplate(['slug' => 'tpl-after-cooldown-current', 'requires_pro' => false]);
    $other = activeTemplate(['slug' => 'tpl-after-cooldown-other', 'requires_pro' => false]);

    $business = proBusinessWithTemplate($current, [
        'template_changed_at' => now()->subDays(31),
    ]);
    $user = verifiedDashboardUser($business);

    test()->actingAs($user)
        ->postJson('/api/v1/dashboard/template', ['template_id' => $other->id])
        ->assertStatus(200)
        ->assertJsonPath('data.template.id', $other->id);

    $fresh = $business->fresh();
    expect($fresh->template_id)->toBe($other->id)
        ->and($fresh->template_changed_at)->not->toBeNull();
});

it('same template does not consume cooldown', function () {
    $current = activeTemplate(['slug' => 'tpl-same-current', 'requires_pro' => false]);

    $changedAt = now()->subDays(5);
    $business = proBusinessWithTemplate($current, [
        'template_changed_at' => $changedAt,
    ]);
    $user = verifiedDashboardUser($business);

    test()->actingAs($user)
        ->postJson('/api/v1/dashboard/template', ['template_id' => $current->id])
        ->assertStatus(200)
        ->assertJsonPath('data.template.id', $current->id);

    expect($business->fresh()->template_changed_at?->toIso8601String())
        ->toBe($changedAt->toIso8601String());
});

it('template id ignored by business update', function () {
    $current = activeTemplate(['slug' => 'tpl-update-current', 'requires_pro' => false]);
    $other = activeTemplate(['slug' => 'tpl-update-other', 'requires_pro' => true]);

    $business = freeBusinessWithTemplate($current);
    $user = verifiedDashboardUser($business);

    test()->actingAs($user)
        ->putJson('/api/v1/dashboard/business', [
            'name' => 'Nombre actualizado',
            'template_id' => $other->id,
        ])
        ->assertStatus(200)
        ->assertJsonPath('data.name', 'Nombre actualizado');

    $fresh = $business->fresh();
    expect($fresh->name)->toBe('Nombre actualizado')
        ->and($fresh->template_id)->toBe($current->id);
});

it('changing template trims excess cover images keeping only the first one by display_order', function () {
    \Illuminate\Support\Facades\Storage::fake('r2');

    $multi = activeTemplate(['slug' => 'tpl-trim-multi', 'hero_photo_slots' => 3]);
    $single = activeTemplate(['slug' => 'tpl-trim-single', 'hero_photo_slots' => 1]);

    $business = proBusinessWithTemplate($multi, ['template_changed_at' => null]);

    foreach ([1, 2, 3] as $order) {
        $path = "businesses/{$business->id}/cover/cover-{$order}.webp";
        \Illuminate\Support\Facades\Storage::disk('r2')->put($path, 'fake-content-'.$order);
        \App\Models\BusinessImage::create([
            'business_id' => $business->id,
            'section' => \App\Enums\ImageSection::Cover->value,
            'path' => $path,
            'display_order' => $order,
        ]);
    }

    $user = verifiedDashboardUser($business);

    test()->actingAs($user)
        ->postJson('/api/v1/dashboard/template', ['template_id' => $single->id])
        ->assertOk();

    $fresh = $business->fresh();
    expect($fresh->template_id)->toBe($single->id);

    $remainingCovers = \App\Models\BusinessImage::query()
        ->where('business_id', $business->id)
        ->where('section', \App\Enums\ImageSection::Cover->value)
        ->orderBy('display_order')
        ->get();

    expect($remainingCovers)->toHaveCount(1)
        ->and($remainingCovers->first()->display_order)->toBe(1)
        ->and($remainingCovers->first()->path)->toBe("businesses/{$business->id}/cover/cover-1.webp");

    expect(\Illuminate\Support\Facades\Storage::disk('r2')->exists("businesses/{$business->id}/cover/cover-2.webp"))->toBeFalse()
        ->and(\Illuminate\Support\Facades\Storage::disk('r2')->exists("businesses/{$business->id}/cover/cover-3.webp"))->toBeFalse()
        ->and(\Illuminate\Support\Facades\Storage::disk('r2')->exists("businesses/{$business->id}/cover/cover-1.webp"))->toBeTrue();
});
