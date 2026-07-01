<?php

use App\Models\Business;
use App\Models\BusinessImage;
use App\Models\PageVisit;
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

it('dashboard update business persists schedule and hide_closed_days', function () {
    $business = Business::create([
        'name' => 'B',
        'subdomain' => 'sched-hide-test',
        'subdomain_type' => 'random',
        'sector' => 'otros',
        'hide_closed_days' => false,
    ]);
    $user = User::factory()->create(['business_id' => $business->id]);
    $schedule = [
        'mon' => ['open' => '09:00', 'close' => '18:00', 'closed' => false],
        'tue' => ['open' => '09:00', 'close' => '18:00', 'closed' => false],
        'wed' => ['open' => '09:00', 'close' => '18:00', 'closed' => false],
        'thu' => ['open' => '09:00', 'close' => '18:00', 'closed' => false],
        'fri' => ['open' => '09:00', 'close' => '18:00', 'closed' => false],
        'sat' => ['open' => null, 'close' => null, 'closed' => true],
        'sun' => ['open' => null, 'close' => null, 'closed' => true],
    ];

    test()->actingAs($user)
        ->putJson('/api/v1/dashboard/business', [
            'schedule' => $schedule,
            'hide_closed_days' => true,
        ])
        ->assertStatus(200)
        ->assertJsonPath('data.hide_closed_days', true)
        ->assertJsonPath('data.schedule.sat.closed', true);

    $fresh = $business->fresh();
    expect($fresh->hide_closed_days)->toBeTrue()
        ->and($fresh->schedule['sat']['closed'] ?? null)->toBeTrue();
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

it('dashboard business free user does not expose stats in JSON', function () {
    $business = Business::create([
        'name' => 'B',
        'subdomain' => 'free-no-stats',
        'subdomain_type' => 'random',
        'sector' => 'otros',
        'plan' => 'free',
    ]);
    $user = User::factory()->create(['business_id' => $business->id]);

    PageVisit::create([
        'business_id' => $business->id,
        'event_type' => 'visit',
        'visited_at' => now(),
    ]);
    PageVisit::create([
        'business_id' => $business->id,
        'event_type' => 'whatsapp_click',
        'visited_at' => now(),
    ]);

    $response = test()->actingAs($user)->getJson('/api/v1/dashboard/business');

    $response->assertStatus(200)
        ->assertJsonMissingPath('data.stats');
});

it('dashboard business pro user includes weekly stats', function () {
    $business = Business::create([
        'name' => 'Pro Stats',
        'subdomain' => 'pro-has-stats',
        'subdomain_type' => 'random',
        'sector' => 'otros',
        'plan' => 'pro',
        'plan_activated_at' => now(),
    ]);
    $user = User::factory()->create(['business_id' => $business->id]);

    PageVisit::create([
        'business_id' => $business->id,
        'event_type' => 'visit',
        'visited_at' => now(),
    ]);
    PageVisit::create([
        'business_id' => $business->id,
        'event_type' => 'whatsapp_click',
        'visited_at' => now(),
    ]);

    test()->actingAs($user)
        ->getJson('/api/v1/dashboard/business')
        ->assertStatus(200)
        ->assertJsonPath('data.stats.visit', 1)
        ->assertJsonPath('data.stats.whatsapp_click', 1)
        ->assertJsonPath('data.stats.phone_click', 0);
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

it('updates cover focal point for owned cover image', function () {
    $template = Template::create([
        'name' => 'Focal Template',
        'slug' => 'tpl-focal-ok',
        'primary_color' => '#111111',
        'is_active' => true,
        'requires_pro' => false,
        'hero_photo_slots' => 1,
        'hero_cover_focal' => true,
    ]);
    $business = Business::create([
        'name' => 'Focal Biz',
        'subdomain' => 'foc-aaaa-bbbb',
        'subdomain_type' => 'random',
        'sector' => 'otros',
        'plan' => 'pro',
        'is_published' => true,
        'onboarding_completed_at' => now(),
        'template_id' => $template->id,
    ]);
    $user = User::factory()->create(['business_id' => $business->id]);
    $cover = BusinessImage::create([
        'business_id' => $business->id,
        'path' => 'businesses/1/cover/test.webp',
        'section' => 'cover',
        'display_order' => 0,
        'focal_x' => 50,
        'focal_y' => 50,
    ]);

    test()->actingAs($user)
        ->patchJson("/api/v1/dashboard/images/{$cover->id}/focal", [
            'focal_x' => 62,
            'focal_y' => 28,
        ])
        ->assertOk()
        ->assertJsonPath('data.focal_x', 62)
        ->assertJsonPath('data.focal_y', 28);

    $cover->refresh();
    expect($cover->focal_x)->toBe(62)->and($cover->focal_y)->toBe(28);
});

it('rejects focal update for gallery images', function () {
    $business = Business::create(['name' => 'Gal', 'subdomain' => 'gal-aaaa-bbbb', 'subdomain_type' => 'random', 'sector' => 'otros']);
    $user = User::factory()->create(['business_id' => $business->id]);
    $gallery = BusinessImage::create([
        'business_id' => $business->id,
        'path' => 'x.webp',
        'section' => 'gallery',
        'display_order' => 0,
    ]);

    test()->actingAs($user)
        ->patchJson("/api/v1/dashboard/images/{$gallery->id}/focal", [
            'focal_x' => 40,
            'focal_y' => 40,
        ])
        ->assertStatus(422);
});

it('rejects focal update when template does not support cover focal', function () {
    $template = Template::create([
        'name' => 'Split Template',
        'slug' => 'tpl-focal-no',
        'primary_color' => '#111111',
        'is_active' => true,
        'requires_pro' => false,
        'hero_photo_slots' => 1,
        'hero_cover_focal' => false,
    ]);
    $business = Business::create([
        'name' => 'No Focal',
        'subdomain' => 'nof-aaaa-bbbb',
        'subdomain_type' => 'random',
        'sector' => 'otros',
        'template_id' => $template->id,
    ]);
    $user = User::factory()->create(['business_id' => $business->id]);
    $cover = BusinessImage::create([
        'business_id' => $business->id,
        'path' => 'businesses/1/cover/test.webp',
        'section' => 'cover',
        'display_order' => 0,
    ]);

    test()->actingAs($user)
        ->patchJson("/api/v1/dashboard/images/{$cover->id}/focal", [
            'focal_x' => 40,
            'focal_y' => 40,
        ])
        ->assertStatus(422);
});
