<?php

use App\Enums\ImageSection;
use App\Models\Business;
use App\Models\BusinessImage;
use App\Models\Template;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;

uses(RefreshDatabase::class);

it('reset clears onboarding progress and returns step one on status', function () {
    Storage::fake('local');
    Storage::fake('r2');

    $template = Template::create([
        'name' => 'Noir Elite',
        'slug' => 'noir-elite',
        'primary_color' => '#C9A84C',
        'is_active' => true,
        'requires_pro' => false,
    ]);

    $business = Business::factory()->create([
        'template_id' => $template->id,
        'name' => 'Mi negocio',
        'sector' => 'peluqueria',
        'city' => 'Madrid',
        'country' => 'España',
        'country_code' => 'ES',
        'tagline' => 'Tagline test',
        'onboarding_completed_at' => null,
    ]);
    $user = User::factory()->create(['business_id' => $business->id]);

    Cache::put("onboarding:{$user->id}", [
        'template_id' => $template->id,
        'sector' => 'peluqueria',
        'cover_path' => 'onboarding/'.$user->id.'/cover/x.jpg',
        'step' => 3,
    ], now()->addHours(4));

    Storage::disk('local')->put("onboarding/{$user->id}/cover/x.jpg", 'fake');

    test()->actingAs($user)
        ->postJson('/api/v1/onboarding/reset')
        ->assertOk()
        ->assertJsonPath('data.ok', true)
        ->assertJsonPath('data.step', 1);

    $business->refresh();
    expect($business->template_id)->toBeNull()
        ->and($business->tagline)->toBeNull()
        ->and($business->name)->toBe('Mi negocio')
        ->and($business->sector)->toBe('peluqueria')
        ->and(Cache::has("onboarding:{$user->id}"))->toBeFalse()
        ->and(Storage::disk('local')->exists("onboarding/{$user->id}"))->toBeFalse();

    test()->actingAs($user)
        ->getJson('/api/v1/onboarding/status')
        ->assertOk()
        ->assertJsonPath('data.step', 1)
        ->assertJsonPath('data.draft.template_id', null);
});

it('reset removes cover images uploaded during onboarding', function () {
    Storage::fake('r2');

    $business = Business::factory()->create([
        'onboarding_completed_at' => null,
    ]);
    $user = User::factory()->create(['business_id' => $business->id]);

    $image = BusinessImage::create([
        'business_id' => $business->id,
        'section' => ImageSection::Cover,
        'path' => 'businesses/'.$business->id.'/cover/test.webp',
        'display_order' => 0,
        'width' => 100,
        'height' => 100,
    ]);
    Storage::disk('r2')->put($image->path, 'fake');

    test()->actingAs($user)
        ->postJson('/api/v1/onboarding/reset')
        ->assertOk();

    expect(BusinessImage::query()->where('business_id', $business->id)->count())->toBe(0);
});

it('reset returns 409 when onboarding is already complete', function () {
    $business = Business::factory()->create([
        'onboarding_completed_at' => now(),
    ]);
    $user = User::factory()->create(['business_id' => $business->id]);

    test()->actingAs($user)
        ->postJson('/api/v1/onboarding/reset')
        ->assertStatus(409);
});
