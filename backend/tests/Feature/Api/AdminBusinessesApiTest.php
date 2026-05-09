<?php

use App\Models\Business;
use App\Models\BusinessImage;
use App\Models\BusinessService;
use App\Models\PageVisit;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;

uses(RefreshDatabase::class);

it('admin businesses index forbids non-admin', function () {
    $user = User::factory()->create(['is_admin' => false]);
    test()->actingAs($user)
        ->getJson('/api/v1/admin/businesses')
        ->assertStatus(403);
});

it('admin businesses index returns items with owner email and visit count', function () {
    $admin = User::factory()->create(['is_admin' => true]);
    $business = Business::create([
        'name' => 'Café Nube',
        'subdomain' => 'adm-biz-'.uniqid(),
        'subdomain_type' => 'random',
        'sector' => 'cafeteria',
        'plan' => 'free',
        'is_published' => true,
        'onboarding_completed_at' => now(),
    ]);
    User::factory()->create(['business_id' => $business->id, 'email' => 'owner@example.com']);

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

    $response = test()->actingAs($admin)
        ->getJson('/api/v1/admin/businesses')
        ->assertStatus(200);

    expect($response->json('data.pagination.total'))->toBe(1);

    $item = $response->json('data.items.0');
    expect($item['name'])->toBe('Café Nube')
        ->and($item['owner_email'])->toBe('owner@example.com')
        ->and($item['total_visits'])->toBe(1)
        ->and($item['sector'])->toBe('cafeteria')
        ->and($item['plan'])->toBe('free')
        ->and($item['is_published'])->toBeTrue()
        ->and($item['onboarding_completed_at'])->not->toBeNull()
        ->and($item['deleted_at'])->toBeNull();
});

it('admin businesses index filters search sector and onboarding_completed', function () {
    $admin = User::factory()->create(['is_admin' => true]);
    $match = Business::create([
        'name' => 'Alpha Shop',
        'subdomain' => 'adm-f-a-'.uniqid(),
        'subdomain_type' => 'random',
        'sector' => 'bar',
        'plan' => 'free',
        'is_published' => true,
        'onboarding_completed_at' => now(),
    ]);
    Business::create([
        'name' => 'Beta',
        'subdomain' => 'adm-f-b-'.uniqid(),
        'subdomain_type' => 'random',
        'sector' => 'otros',
        'plan' => 'free',
        'is_published' => true,
        'onboarding_completed_at' => null,
    ]);

    $response = test()->actingAs($admin)
        ->getJson('/api/v1/admin/businesses?search=Alpha&sector=bar&onboarding_completed=1')
        ->assertStatus(200);

    expect($response->json('data.pagination.total'))->toBe(1);
    expect($response->json('data.items.0.id'))->toBe($match->id);
});

it('admin businesses show includes relations visit_counts and soft deleted', function () {
    $admin = User::factory()->create(['is_admin' => true]);
    $business = Business::create([
        'name' => 'Detail Co',
        'subdomain' => 'adm-show-'.uniqid(),
        'subdomain_type' => 'random',
        'sector' => 'otros',
        'plan' => 'free',
        'is_published' => true,
        'plan_activated_at' => null,
    ]);
    User::factory()->create(['business_id' => $business->id, 'email' => 'owner@detail.test']);

    PageVisit::create([
        'business_id' => $business->id,
        'event_type' => 'visit',
        'visited_at' => now(),
    ]);

    $business->delete();

    $response = test()->actingAs($admin)
        ->getJson("/api/v1/admin/businesses/{$business->id}")
        ->assertStatus(200);

    $payload = $response->json('data.business');
    expect($payload['name'])->toBe('Detail Co')
        ->and($payload['deleted_at'])->not->toBeNull()
        ->and($payload['visit_counts']['visit'])->toBe(1)
        ->and($payload['visit_counts']['whatsapp_click'])->toBe(0)
        ->and($payload['owner']['email'])->toBe('owner@detail.test')
        ->and($payload)->toHaveKey('images')
        ->and($payload)->toHaveKey('services');
});

it('admin businesses patch updates plan to pro sets plan_activated_at', function () {
    $admin = User::factory()->create(['is_admin' => true]);
    $business = Business::create([
        'name' => 'Upgrade',
        'subdomain' => 'adm-up-'.uniqid(),
        'subdomain_type' => 'random',
        'sector' => 'otros',
        'plan' => 'free',
        'is_published' => true,
        'plan_activated_at' => null,
    ]);

    test()->actingAs($admin)
        ->patchJson("/api/v1/admin/businesses/{$business->id}", ['plan' => 'pro'])
        ->assertStatus(200);

    $business->refresh();
    expect($business->plan->value)->toBe('pro')
        ->and($business->plan_activated_at)->not->toBeNull();
});

it('admin businesses toggle publish flips is_published', function () {
    $admin = User::factory()->create(['is_admin' => true]);
    $business = Business::create([
        'name' => 'Toggle',
        'subdomain' => 'adm-tog-'.uniqid(),
        'subdomain_type' => 'random',
        'sector' => 'otros',
        'plan' => 'free',
        'is_published' => false,
    ]);

    $response = test()->actingAs($admin)
        ->patchJson("/api/v1/admin/businesses/{$business->id}/toggle-publish")
        ->assertStatus(200);

    expect($response->json('data.is_published'))->toBeTrue();

    $business->refresh();
    expect($business->is_published)->toBeTrue();
});

it('admin businesses index with_trashed includes soft deleted', function () {
    $admin = User::factory()->create(['is_admin' => true]);
    $b = Business::create([
        'name' => 'Gone',
        'subdomain' => 'adm-tr-'.uniqid(),
        'subdomain_type' => 'random',
        'sector' => 'otros',
        'plan' => 'free',
        'is_published' => true,
    ]);
    $b->delete();

    test()->actingAs($admin)
        ->getJson('/api/v1/admin/businesses')
        ->assertJsonPath('data.pagination.total', 0);

    $withTrashed = test()->actingAs($admin)
        ->getJson('/api/v1/admin/businesses?with_trashed=1')
        ->assertJsonPath('data.pagination.total', 1)
        ->json('data.items.0');

    expect($withTrashed['deleted_at'])->not->toBeNull();
});

it('admin businesses soft delete returns 204', function () {
    $admin = User::factory()->create(['is_admin' => true]);
    $business = Business::create([
        'name' => 'Del',
        'subdomain' => 'adm-del-'.uniqid(),
        'subdomain_type' => 'random',
        'sector' => 'otros',
        'plan' => 'free',
        'is_published' => true,
    ]);

    test()->actingAs($admin)
        ->deleteJson("/api/v1/admin/businesses/{$business->id}")
        ->assertStatus(204);

    expect(Business::withTrashed()->find($business->id)->trashed())->toBeTrue();
});

it('admin businesses restore returns 204', function () {
    $admin = User::factory()->create(['is_admin' => true]);
    $business = Business::create([
        'name' => 'Rest',
        'subdomain' => 'adm-rst-'.uniqid(),
        'subdomain_type' => 'random',
        'sector' => 'otros',
        'plan' => 'free',
        'is_published' => true,
    ]);
    $business->delete();

    test()->actingAs($admin)
        ->postJson("/api/v1/admin/businesses/{$business->id}/restore")
        ->assertStatus(204);

    $business->refresh();
    expect($business->trashed())->toBeFalse();
});

it('admin businesses force delete rejects when not trashed', function () {
    $admin = User::factory()->create(['is_admin' => true]);
    $business = Business::create([
        'name' => 'Live',
        'subdomain' => 'adm-fd0-'.uniqid(),
        'subdomain_type' => 'random',
        'sector' => 'otros',
        'plan' => 'free',
        'is_published' => true,
    ]);

    test()->actingAs($admin)
        ->deleteJson("/api/v1/admin/businesses/{$business->id}/force")
        ->assertStatus(422);
});

it('admin businesses force delete removes related rows and storage', function () {
    $disk = Storage::fake('r2');

    $admin = User::factory()->create(['is_admin' => true]);
    $business = Business::create([
        'name' => 'Purge',
        'subdomain' => 'adm-fd1-'.uniqid(),
        'subdomain_type' => 'random',
        'sector' => 'otros',
        'plan' => 'free',
        'is_published' => true,
    ]);
    $logoPath = 'businesses/'.$business->id.'/logo/z.webp';
    $business->update(['logo_path' => $logoPath]);
    $disk->put($logoPath, 'logo');

    $imgPath = 'businesses/'.$business->id.'/gallery/a.webp';
    $disk->put($imgPath, 'img');
    BusinessImage::create([
        'business_id' => $business->id,
        'path' => $imgPath,
        'section' => 'gallery',
        'display_order' => 0,
        'width' => 100,
        'height' => 100,
    ]);

    BusinessService::create([
        'business_id' => $business->id,
        'name' => 'Corte',
        'price' => 10,
        'description' => null,
        'display_order' => 0,
    ]);

    PageVisit::create([
        'business_id' => $business->id,
        'event_type' => 'visit',
        'visited_at' => now(),
    ]);

    $business->delete();

    $id = $business->id;

    test()->actingAs($admin)
        ->deleteJson("/api/v1/admin/businesses/{$id}/force")
        ->assertStatus(204);

    expect(Business::withTrashed()->whereKey($id)->exists())->toBeFalse();
    expect(PageVisit::query()->where('business_id', $id)->count())->toBe(0);
    expect(BusinessService::query()->where('business_id', $id)->count())->toBe(0);
    expect(BusinessImage::query()->where('business_id', $id)->count())->toBe(0);
    $disk->assertMissing($imgPath);
    $disk->assertMissing($logoPath);
});
