<?php

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
        public function geocode(string $address): array
        {
            return ['lat' => 40.4, 'lng' => -3.7, 'display_name' => 'Test Madrid'];
        }
    });
});

it('completes free onboarding over HTTP and exposes data on the public page', function () {
    $days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
    $schedulePayload = ['schedule' => []];
    foreach ($days as $d) {
        $schedulePayload['schedule'][$d] = ['open' => '09:00', 'close' => '18:00', 'closed' => false];
    }

    $template = Template::create([
        'name' => 'Bloom Studio',
        'slug' => 'bloom-studio',
        'primary_color' => '#E8572A',
        'is_active' => true,
        'requires_pro' => false,
    ]);

    $user = User::factory()->create();

    // Step 1 — template + sector + optional logo
    $logo = UploadedFile::fake()->image('logo.png', 100, 100);
    test()->actingAs($user)
        ->post('/api/v1/onboarding/step/1', [
            'template_id' => $template->id,
            'sector' => 'peluqueria',
            'logo' => $logo,
        ])
        ->assertStatus(200)
        ->assertJsonPath('data.ok', true);

    // Step 2 — cover
    $cover = UploadedFile::fake()->image('cover.jpg', 800, 600);
    test()->actingAs($user)
        ->post('/api/v1/onboarding/step/2', ['cover' => $cover])
        ->assertStatus(200)
        ->assertJsonPath('data.ok', true);

    // Step 3 — business info (+ optional about photo)
    $about = UploadedFile::fake()->image('about.jpg', 400, 400);
    test()->actingAs($user)
        ->post('/api/v1/onboarding/step/3', [
            'business_name' => 'Salón Integración',
            'tagline' => 'Corte y color',
            'description' => 'Descripción de prueba',
            'about_photo' => $about,
        ])
        ->assertStatus(200)
        ->assertJsonPath('data.ok', true);

    // Step 4 — gallery (draft on local disk)
    $photos = [
        UploadedFile::fake()->image('g1.jpg', 200, 200),
        UploadedFile::fake()->image('g2.jpg', 200, 200),
    ];
    test()->actingAs($user)
        ->post('/api/v1/onboarding/step/4', ['photos' => $photos])
        ->assertStatus(200)
        ->assertJsonPath('data.ok', true);

    // Step 5 — schedule
    test()->actingAs($user)
        ->postJson('/api/v1/onboarding/step/5', $schedulePayload)
        ->assertStatus(200)
        ->assertJsonPath('data.ok', true);

    // Step 6 — address + phone + email (geocoding mocked)
    test()->actingAs($user)
        ->postJson('/api/v1/onboarding/step/6', [
            'address' => 'Calle Mayor 1, Madrid',
            'city' => 'Madrid',
            'country' => 'España',
            'country_code' => 'ES',
            'phone' => '+34900111222',
            'email' => 'salon@example.com',
        ])
        ->assertStatus(200)
        ->assertJsonPath('data.geocoded', true)
        ->assertJsonPath('data.ok', true);

    // Step 7 — free plan → create business, finalize media to R2
    test()->actingAs($user)
        ->postJson('/api/v1/onboarding/step/7', ['plan' => 'free'])
        ->assertStatus(200)
        ->assertJsonPath('data.plan', 'free')
        ->assertJsonPath('data.ok', true);

    $user->refresh();
    expect($user->business_id)->not->toBeNull();

    $business = Business::findOrFail($user->business_id);
    expect($business->plan->value)->toBe('free')
        ->and($business->subdomain_type)->toBe('random')
        ->and($business->is_published)->toBeFalse()
        ->and(strlen($business->subdomain))->toBeGreaterThanOrEqual(3);

    test()->actingAs($user)
        ->postJson('/api/v1/onboarding/step/8')
        ->assertStatus(200);

    $business->refresh();
    expect($business->is_published)->toBeTrue();

    $subdomain = $business->subdomain;

    // Archivos finales en disco r2 (fake)
    $allR2 = Storage::disk('r2')->allFiles();
    expect(count($allR2))->toBeGreaterThan(0);

    // Página pública
    test()->getJson("/api/v1/public/{$subdomain}")
        ->assertStatus(200)
        ->assertJsonPath('data.name', 'Salón Integración')
        ->assertJsonPath('data.subdomain', $subdomain)
        ->assertJsonPath('data.phone', '+34900111222');
});

it('rejects finalize when geocoding is missing', function () {
    $template = Template::create([
        'name' => 'Bloom Studio',
        'slug' => 'bloom-geo-missing',
        'primary_color' => '#E8572A',
        'is_active' => true,
        'requires_pro' => false,
    ]);

    $business = Business::create([
        'name' => 'Sin geocoding',
        'subdomain' => 'sin-geo-'.substr(bin2hex(random_bytes(4)), 0, 8),
        'subdomain_type' => 'custom',
        'sector' => 'peluqueria',
        'template_id' => $template->id,
        'city' => 'Madrid',
        'country_code' => 'ES',
        'phone' => '+34900111222',
        'lat' => null,
        'lng' => null,
        'plan' => 'pro',
        'is_published' => true,
    ]);
    $user = User::factory()->create(['business_id' => $business->id]);

    test()->actingAs($user)
        ->postJson('/api/v1/onboarding/finalize')
        ->assertStatus(422)
        ->assertJson([
            'message' => 'Faltan datos del onboarding para publicar',
            'missing' => ['lat', 'lng'],
        ]);
});
