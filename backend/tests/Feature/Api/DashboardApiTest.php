<?php

use App\Models\Business;
use App\Models\BusinessImage;
use App\Models\Template;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;

uses(RefreshDatabase::class);

it('dashboard business without business returns 403', function () {
    $user = User::factory()->create();
    test()->actingAs($user)
        ->getJson('/api/v1/dashboard/business')
        ->assertStatus(403);
});

it('dashboard tour complete sets timestamp and is idempotent', function () {
    $business = Business::create(['name' => 'B', 'subdomain' => 'tour-done-test', 'subdomain_type' => 'random', 'sector' => 'otros']);
    $user = User::factory()->create(['business_id' => $business->id]);

    test()->actingAs($user)
        ->postJson('/api/v1/dashboard/tour/complete')
        ->assertNoContent();

    expect($business->fresh()->dashboard_tour_completed_at)->not->toBeNull();

    $first = $business->fresh()->dashboard_tour_completed_at;

    test()->actingAs($user)
        ->postJson('/api/v1/dashboard/tour/complete')
        ->assertNoContent();

    expect($business->fresh()->dashboard_tour_completed_at?->toIso8601String())
        ->toBe($first?->toIso8601String());
});

it('dashboard set subdomain converts random to custom once', function () {
    $business = Business::create([
        'name' => 'B',
        'subdomain' => 'xrj-twg5-phnk',
        'subdomain_type' => 'random',
        'sector' => 'otros',
        'is_published' => false,
    ]);
    $user = User::factory()->create(['business_id' => $business->id]);

    test()->actingAs($user)
        ->postJson('/api/v1/dashboard/subdomain', ['subdomain' => 'mi-marca-pro'])
        ->assertStatus(200)
        ->assertJsonPath('data.subdomain', 'mi-marca-pro')
        ->assertJsonPath('data.subdomain_type', 'custom')
        ->assertJsonPath('data.is_published', true);

    expect($business->fresh()->subdomain)->toBe('mi-marca-pro')
        ->and($business->fresh()->subdomain_type)->toBe('custom')
        ->and($business->fresh()->is_published)->toBeTrue();
});

it('dashboard set subdomain rejects when already custom', function () {
    $business = Business::create([
        'name' => 'B',
        'subdomain' => 'ya-fijo',
        'subdomain_type' => 'custom',
        'sector' => 'otros',
    ]);
    $user = User::factory()->create(['business_id' => $business->id]);

    test()->actingAs($user)
        ->postJson('/api/v1/dashboard/subdomain', ['subdomain' => 'otro-slug'])
        ->assertStatus(422)
        ->assertJsonPath('message', 'El subdominio ya está configurado y es inmutable.');
});

it('dashboard pro tour complete sets timestamp and is idempotent', function () {
    $business = Business::create(['name' => 'B', 'subdomain' => 'pro-tour-done-test', 'subdomain_type' => 'random', 'sector' => 'otros']);
    $user = User::factory()->create(['business_id' => $business->id]);

    test()->actingAs($user)
        ->postJson('/api/v1/dashboard/tour/pro/complete')
        ->assertNoContent();

    expect($business->fresh()->dashboard_pro_tour_completed_at)->not->toBeNull();

    $first = $business->fresh()->dashboard_pro_tour_completed_at;

    test()->actingAs($user)
        ->postJson('/api/v1/dashboard/tour/pro/complete')
        ->assertNoContent();

    expect($business->fresh()->dashboard_pro_tour_completed_at?->toIso8601String())
        ->toBe($first?->toIso8601String());
});

it('dashboard business with business returns 200', function () {
    $template = Template::create(['name' => 'Noir Elite', 'slug' => 'noir-elite', 'primary_color' => '#C9A84C', 'is_active' => true, 'requires_pro' => false]);
    $business = Business::create(['name' => 'B', 'subdomain' => 'abc-def-ghij', 'subdomain_type' => 'random', 'sector' => 'otros', 'template_id' => $template->id]);
    $user = User::factory()->create(['business_id' => $business->id]);
    test()->actingAs($user)
        ->getJson('/api/v1/dashboard/business')
        ->assertStatus(200)
        ->assertJsonPath('data.id', $business->id);
});

it('dashboard update business persists changes', function () {
    $business = Business::create(['name' => 'B', 'subdomain' => 'bcd-efgh-jklm', 'subdomain_type' => 'random', 'sector' => 'otros']);
    $user = User::factory()->create(['business_id' => $business->id]);
    test()->actingAs($user)
        ->putJson('/api/v1/dashboard/business', ['name' => 'Nuevo Nombre'])
        ->assertStatus(200);

    expect($business->fresh()->name)->toBe('Nuevo Nombre');
});

it('dashboard update business persists social urls', function () {
    $business = Business::create(['name' => 'B', 'subdomain' => 'soc-url-test-aaaa', 'subdomain_type' => 'random', 'sector' => 'otros']);
    $user = User::factory()->create(['business_id' => $business->id]);
    test()->actingAs($user)
        ->putJson('/api/v1/dashboard/business', [
            'instagram_url' => 'https://instagram.com/mine',
            'tiktok_url' => 'tiktok.com/@mine',
            'facebook_url' => null,
        ])
        ->assertStatus(200)
        ->assertJsonPath('data.instagram_url', 'https://instagram.com/mine')
        ->assertJsonPath('data.tiktok_url', 'https://tiktok.com/@mine')
        ->assertJsonPath('data.facebook_url', null);

    $fresh = $business->fresh();
    expect($fresh->instagram_url)->toBe('https://instagram.com/mine')
        ->and($fresh->tiktok_url)->toBe('https://tiktok.com/@mine')
        ->and($fresh->facebook_url)->toBeNull();
});

it('stats free user returns upgrade required', function () {
    $business = Business::create(['name' => 'B', 'subdomain' => 'ccc-dddd-eeee', 'subdomain_type' => 'random', 'sector' => 'otros', 'plan' => 'free']);
    $user = User::factory()->create(['business_id' => $business->id]);
    test()->actingAs($user)
        ->getJson('/api/v1/dashboard/stats')
        ->assertStatus(403)
        ->assertJsonPath('upgrade_required', true);
});

it('images upload over free limit returns 422 upgrade required', function () {
    $business = Business::create(['name' => 'B', 'subdomain' => 'fff-gggg-hhhh', 'subdomain_type' => 'random', 'sector' => 'otros', 'plan' => 'free']);
    $user = User::factory()->create(['business_id' => $business->id]);
    for ($i = 0; $i < 3; $i++) {
        BusinessImage::create(['business_id' => $business->id, 'path' => "x/{$i}.webp", 'section' => 'gallery', 'display_order' => $i]);
    }
    test()->actingAs($user)
        ->post('/api/v1/dashboard/images', [
            'file' => UploadedFile::fake()->image('a.jpg'),
            'section' => 'gallery',
        ])
        ->assertStatus(422)
        ->assertJsonPath('upgrade_required', true);
});

it('deleting image from other business returns 403', function () {
    $businessA = Business::create(['name' => 'A', 'subdomain' => 'aaa-bbbb-cccc', 'subdomain_type' => 'random', 'sector' => 'otros']);
    $businessB = Business::create(['name' => 'B', 'subdomain' => 'ddd-eeee-ffff', 'subdomain_type' => 'random', 'sector' => 'otros']);
    $userA = User::factory()->create(['business_id' => $businessA->id]);
    $imageB = BusinessImage::create(['business_id' => $businessB->id, 'path' => 'x.webp', 'section' => 'gallery', 'display_order' => 0]);
    test()->actingAs($userA)
        ->deleteJson("/api/v1/dashboard/images/{$imageB->id}")
        ->assertStatus(403);
});
