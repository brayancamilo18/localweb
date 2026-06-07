<?php

use App\Enums\ImageSection;
use App\Models\Business;
use App\Models\Template;
use App\Models\User;
use App\Services\GeocodingService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Storage;

uses(RefreshDatabase::class);

beforeEach(function () {
    Storage::fake('local');
    Storage::fake('r2');
    Queue::fake();

    app()->instance(GeocodingService::class, new class extends GeocodingService
    {
        public function geocode(string $address, ?string $city = null, ?string $countryCode = null): array
        {
            return ['lat' => 40.4, 'lng' => -3.7, 'display_name' => 'Test Madrid', 'precision' => 'exact', 'addresstype' => 'house'];
        }
    });
});

it('stores 3 cover photos during onboarding for a multi-hero template', function () {
    $template = Template::create([
        'name' => 'Tavola Warm',
        'slug' => 'tavola-warm',
        'primary_color' => '#C8553D',
        'is_active' => true,
        'requires_pro' => true,
        'hero_photo_slots' => 3,
    ]);

    $user = User::factory()->create();

    // Step 1
    test()->actingAs($user)
        ->post('/api/v1/onboarding/step/1', [
            'template_id' => $template->id,
            'sector' => 'restaurante',
        ])
        ->assertStatus(200)
        ->assertJsonPath('data.ok', true);

    // Step 2 — 3 cover photos
    $cover1 = UploadedFile::fake()->image('cover1.jpg', 800, 450);
    $cover2 = UploadedFile::fake()->image('cover2.jpg', 800, 450);
    $cover3 = UploadedFile::fake()->image('cover3.jpg', 800, 450);

    test()->actingAs($user)
        ->post('/api/v1/onboarding/step/2', [
            'cover' => $cover1,
            'cover2' => $cover2,
            'cover3' => $cover3,
        ])
        ->assertStatus(200)
        ->assertJsonPath('data.ok', true);

    // Step 3
    test()->actingAs($user)
        ->post('/api/v1/onboarding/step/3', [
            'business_name' => 'Trattoria Test',
            'tagline' => 'Pasta fresca',
        ])
        ->assertStatus(200);

    // Step 4 — gallery
    test()->actingAs($user)
        ->post('/api/v1/onboarding/step/4', [
            'photos' => [UploadedFile::fake()->image('g1.jpg', 200, 200)],
        ])
        ->assertStatus(200);

    // Step 5 — schedule
    $days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
    $schedule = [];
    foreach ($days as $d) {
        $schedule[$d] = ['open' => '12:00', 'close' => '23:00', 'closed' => false];
    }
    test()->actingAs($user)
        ->postJson('/api/v1/onboarding/step/5', ['schedule' => $schedule])
        ->assertStatus(200);

    // Step 6
    test()->actingAs($user)
        ->postJson('/api/v1/onboarding/step/6', [
            'address' => 'Via Roma 10',
            'city' => 'Roma',
            'country' => 'Italia',
            'country_code' => 'IT',
            'phone' => '+34600111222',
            'email' => 'trattoria@test.com',
        ])
        ->assertStatus(200);

    // Step 7 — free plan (to avoid Stripe checkout complexity)
    test()->actingAs($user)
        ->postJson('/api/v1/onboarding/step/7', ['plan' => 'free'])
        ->assertStatus(200)
        ->assertJsonPath('data.ok', true);

    $user->refresh();
    $business = Business::findOrFail($user->business_id);

    // Verify 3 cover images stored with correct display_order
    $covers = $business->images()
        ->where('section', ImageSection::Cover->value)
        ->orderBy('display_order')
        ->get();

    expect($covers)->toHaveCount(3);
    expect($covers[0]->display_order)->toBe(0);
    expect($covers[1]->display_order)->toBe(1);
    expect($covers[2]->display_order)->toBe(2);

    // Verify all 3 files exist in R2
    foreach ($covers as $img) {
        expect(Storage::disk('r2')->exists($img->path))->toBeTrue();
    }
});

it('stores only 1 cover photo for a standard template', function () {
    $template = Template::create([
        'name' => 'Bloom Studio',
        'slug' => 'bloom-studio',
        'primary_color' => '#E8572A',
        'is_active' => true,
        'requires_pro' => false,
        'hero_photo_slots' => 1,
    ]);

    $user = User::factory()->create();

    test()->actingAs($user)
        ->post('/api/v1/onboarding/step/1', [
            'template_id' => $template->id,
            'sector' => 'peluqueria',
        ])
        ->assertStatus(200);

    // Step 2 — only 1 cover
    test()->actingAs($user)
        ->post('/api/v1/onboarding/step/2', [
            'cover' => UploadedFile::fake()->image('cover.jpg', 800, 600),
        ])
        ->assertStatus(200)
        ->assertJsonPath('data.ok', true);

    test()->actingAs($user)
        ->post('/api/v1/onboarding/step/3', [
            'business_name' => 'Salón Uno',
        ])
        ->assertStatus(200);

    test()->actingAs($user)
        ->post('/api/v1/onboarding/step/4', [
            'photos' => [UploadedFile::fake()->image('g.jpg', 200, 200)],
        ])
        ->assertStatus(200);

    $days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
    $schedule = [];
    foreach ($days as $d) {
        $schedule[$d] = ['open' => '09:00', 'close' => '18:00', 'closed' => false];
    }
    test()->actingAs($user)
        ->postJson('/api/v1/onboarding/step/5', ['schedule' => $schedule])
        ->assertStatus(200);

    test()->actingAs($user)
        ->postJson('/api/v1/onboarding/step/6', [
            'address' => 'Calle Mayor 1',
            'city' => 'Madrid',
            'country' => 'España',
            'country_code' => 'ES',
            'phone' => '+34600000000',
            'email' => 'salon@test.com',
        ])
        ->assertStatus(200);

    test()->actingAs($user)
        ->postJson('/api/v1/onboarding/step/7', ['plan' => 'free'])
        ->assertStatus(200);

    $user->refresh();
    $business = Business::findOrFail($user->business_id);

    $covers = $business->images()
        ->where('section', ImageSection::Cover->value)
        ->get();

    expect($covers)->toHaveCount(1);
    expect($covers[0]->display_order)->toBe(0);
});

it('step2 accepts cover2 and cover3 as optional files', function () {
    $template = Template::create([
        'name' => 'Test Template',
        'slug' => 'test-tpl',
        'primary_color' => '#000000',
        'is_active' => true,
        'requires_pro' => false,
        'hero_photo_slots' => 3,
    ]);

    $user = User::factory()->create();

    test()->actingAs($user)
        ->post('/api/v1/onboarding/step/1', [
            'template_id' => $template->id,
            'sector' => 'otros',
        ])
        ->assertStatus(200);

    // Send cover + cover2 (no cover3)
    test()->actingAs($user)
        ->post('/api/v1/onboarding/step/2', [
            'cover' => UploadedFile::fake()->image('c1.jpg', 400, 300),
            'cover2' => UploadedFile::fake()->image('c2.jpg', 400, 300),
        ])
        ->assertStatus(200)
        ->assertJsonPath('data.ok', true);

    // Continue to finalization
    test()->actingAs($user)
        ->post('/api/v1/onboarding/step/3', ['business_name' => 'Partial Cover Test'])
        ->assertStatus(200);

    test()->actingAs($user)
        ->post('/api/v1/onboarding/step/4', [
            'photos' => [UploadedFile::fake()->image('g.jpg', 200, 200)],
        ])
        ->assertStatus(200);

    $days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
    $schedule = [];
    foreach ($days as $d) {
        $schedule[$d] = ['open' => '09:00', 'close' => '18:00', 'closed' => false];
    }
    test()->actingAs($user)
        ->postJson('/api/v1/onboarding/step/5', ['schedule' => $schedule])
        ->assertStatus(200);

    test()->actingAs($user)
        ->postJson('/api/v1/onboarding/step/6', [
            'address' => 'Test St',
            'city' => 'Madrid',
            'country' => 'España',
            'country_code' => 'ES',
            'phone' => '+34111222333',
            'email' => 'partial@test.com',
        ])
        ->assertStatus(200);

    test()->actingAs($user)
        ->postJson('/api/v1/onboarding/step/7', ['plan' => 'free'])
        ->assertStatus(200);

    $user->refresh();
    $business = Business::findOrFail($user->business_id);

    $covers = $business->images()
        ->where('section', ImageSection::Cover->value)
        ->orderBy('display_order')
        ->get();

    expect($covers)->toHaveCount(2);
    expect($covers[0]->display_order)->toBe(0);
    expect($covers[1]->display_order)->toBe(1);
});
