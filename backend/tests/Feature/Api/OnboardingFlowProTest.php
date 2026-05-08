<?php

use App\Enums\Plan;
use App\Models\Business;
use App\Models\Template;
use App\Models\User;
use App\Services\GeocodingService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Storage;
use Laravel\Cashier\Events\WebhookReceived;

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

it('pro onboarding returns checkout_url then activates via Stripe webhook and serves public page', function () {
    $days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
    $schedulePayload = ['schedule' => []];
    foreach ($days as $d) {
        $schedulePayload['schedule'][$d] = ['open' => '09:00', 'close' => '18:00', 'closed' => false];
    }

    $template = Template::create([
        'name' => 'Noir Elite',
        'slug' => 'noir-elite',
        'primary_color' => '#C9A84C',
        'is_active' => true,
        'requires_pro' => false,
    ]);

    $user = User::factory()->create();
    $token = $user->createToken('lw-spa')->plainTextToken;
    $auth = ['Authorization' => "Bearer {$token}"];

    test()->withHeaders($auth)
        ->post('/api/v1/onboarding/step/1', [
            'template_id' => $template->id,
            'sector' => 'otros',
        ])
        ->assertStatus(200);

    test()->withHeaders($auth)
        ->post('/api/v1/onboarding/step/2', [
            'cover' => UploadedFile::fake()->image('cover.jpg', 800, 600),
        ])
        ->assertStatus(200);

    test()->withHeaders($auth)
        ->post('/api/v1/onboarding/step/3', [
            'business_name' => 'Pro Flow Negocio',
            'tagline' => 'Etiqueta',
            'description' => 'Desc',
        ])
        ->assertStatus(200);

    test()->withHeaders($auth)
        ->post('/api/v1/onboarding/step/4', [
            'photos' => [
                UploadedFile::fake()->image('g1.jpg', 200, 200),
            ],
        ])
        ->assertStatus(200);

    test()->withHeaders($auth)
        ->postJson('/api/v1/onboarding/step/5', $schedulePayload)
        ->assertStatus(200);

    test()->withHeaders($auth)
        ->postJson('/api/v1/onboarding/step/6', [
            'address' => 'Gran Vía 10',
            'phone' => '+34987654321',
            'email' => 'proflow@test.example',
        ])
        ->assertStatus(200);

    $subdomain = 'proflow-'.substr(bin2hex(random_bytes(4)), 0, 10);

    $step7 = test()->withHeaders($auth)
        ->postJson('/api/v1/onboarding/step/7', [
            'plan' => 'pro',
            'subdomain' => $subdomain,
        ])
        ->assertStatus(200);

    expect($step7->json('data.checkout_url'))->toBe('https://checkout.stripe.test/session_onboarding_pro');

    $user->refresh();
    $business = Business::findOrFail($user->business_id);

    expect($business->plan)->toBe(Plan::Pending)
        ->and($business->is_published)->toBeFalse()
        ->and($business->subdomain)->toBe(strtolower($subdomain));

    event(new WebhookReceived([
        'id' => 'evt_onboarding_pro_flow_'.uniqid(),
        'type' => 'checkout.session.completed',
        'data' => [
            'object' => [
                'metadata' => [
                    'user_id' => (string) $user->id,
                    'business_id' => (string) $business->id,
                ],
                'payment_status' => 'paid',
            ],
        ],
    ]));

    $business->refresh();

    expect($business->plan)->toBe(Plan::Pro)
        ->and($business->is_published)->toBeTrue()
        ->and($business->subdomain)->toBe(strtolower($subdomain));

    test()->getJson("/api/v1/public/{$business->subdomain}")
        ->assertStatus(200)
        ->assertJsonPath('data.name', 'Pro Flow Negocio')
        ->assertJsonPath('data.subdomain', $business->subdomain);
});
