<?php

use App\Enums\Plan;
use App\Models\Business;
use App\Models\Template;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;

uses(RefreshDatabase::class);

it('status without business returns step one and incomplete', function () {
    $user = User::factory()->create();
    $token = $user->createToken('lw-spa')->plainTextToken;

    test()->withHeader('Authorization', "Bearer {$token}")
        ->getJson('/api/v1/onboarding/status')
        ->assertStatus(200)
        ->assertJsonPath('data.is_complete', false)
        ->assertJsonPath('data.step', 1);
});

it('templates without business returns free tier list', function () {
    Template::create([
        'name' => 'Noir Elite',
        'slug' => 'noir-elite',
        'primary_color' => '#C9A84C',
        'is_active' => true,
        'requires_pro' => false,
    ]);
    $user = User::factory()->create();
    $token = $user->createToken('lw-spa')->plainTextToken;

    test()->withHeader('Authorization', "Bearer {$token}")
        ->getJson('/api/v1/onboarding/templates')
        ->assertStatus(200)
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.slug', 'noir-elite');
});

it('step1 invalid template returns 422', function () {
    $user = User::factory()->create();
    $token = $user->createToken('lw-spa')->plainTextToken;

    test()->withHeader('Authorization', "Bearer {$token}")
        ->postJson('/api/v1/onboarding/step/1', [
            'template_id' => 9999,
            'sector' => 'otros',
        ])->assertStatus(422);
});

it('step1 valid stores cache', function () {
    $template = Template::create([
        'name' => 'Noir Elite',
        'slug' => 'noir-elite',
        'primary_color' => '#C9A84C',
        'is_active' => true,
        'requires_pro' => false,
    ]);
    $user = User::factory()->create();
    $token = $user->createToken('lw-spa')->plainTextToken;

    test()->withHeader('Authorization', "Bearer {$token}")
        ->postJson('/api/v1/onboarding/step/1', [
            'template_id' => $template->id,
            'sector' => 'otros',
        ])->assertStatus(200)->assertJsonPath('data.ok', true);

    expect(Cache::get("onboarding:{$user->id}"))->toBeArray();
});

it('step3 without business_name returns 422', function () {
    $user = User::factory()->create();
    $token = $user->createToken('lw-spa')->plainTextToken;

    test()->withHeader('Authorization', "Bearer {$token}")
        ->postJson('/api/v1/onboarding/step/3', [])
        ->assertStatus(422);
});

it('step7 free creates business and returns public url', function () {
    $template = Template::create([
        'name' => 'Noir Elite',
        'slug' => 'noir-elite',
        'primary_color' => '#C9A84C',
        'is_active' => true,
        'requires_pro' => false,
    ]);
    $user = User::factory()->create();
    Cache::put("onboarding:{$user->id}", [
        'template_id' => $template->id,
        'sector' => 'otros',
        'business_name' => 'Biz Onboarding',
    ], now()->addHours(4));
    $token = $user->createToken('lw-spa')->plainTextToken;

    test()->withHeader('Authorization', "Bearer {$token}")
        ->postJson('/api/v1/onboarding/step/7', ['plan' => 'free'])
        ->assertStatus(200)
        ->assertJsonPath('data.ok', true)
        ->assertJsonPath('data.plan', 'free');

    expect(Business::count())->toBe(1);
});

it('step7 pro creates pending business and returns stripe checkout url in testing', function () {
    $template = Template::create([
        'name' => 'Noir Elite',
        'slug' => 'noir-elite',
        'primary_color' => '#C9A84C',
        'is_active' => true,
        'requires_pro' => false,
    ]);
    $user = User::factory()->create();
    $sub = 'pro-'.substr(sha1((string) random_int(0, PHP_INT_MAX)), 0, 10);
    Cache::put("onboarding:{$user->id}", [
        'template_id' => $template->id,
        'sector' => 'otros',
        'business_name' => 'Pro Onboarding',
        'address' => 'Calle Test 1',
        'phone' => '+34123456789',
    ], now()->addHours(4));
    $token = $user->createToken('lw-spa')->plainTextToken;

    test()->withHeader('Authorization', "Bearer {$token}")
        ->postJson('/api/v1/onboarding/step/7', [
            'plan' => 'pro',
            'subdomain' => $sub,
        ])
        ->assertStatus(200)
        ->assertJsonPath('data.ok', true)
        ->assertJsonPath('data.plan', 'pro')
        ->assertJsonPath('data.checkout_url', 'https://checkout.stripe.test/session_onboarding_pro');

    $user->refresh();
    expect($user->business_id)->not->toBeNull();
    $business = Business::find($user->business_id);
    expect($business)->not->toBeNull();
    expect($business->subdomain)->toBe(strtolower($sub));
});

it('status after complete returns true', function () {
    $business = Business::create([
        'name' => 'Biz',
        'subdomain' => 'zzz-tttt-cccc',
        'subdomain_type' => 'random',
        'sector' => 'otros',
        'onboarding_completed_at' => now(),
    ]);
    $user = User::factory()->create(['business_id' => $business->id]);
    $token = $user->createToken('lw-spa')->plainTextToken;

    test()->withHeader('Authorization', "Bearer {$token}")
        ->getJson('/api/v1/onboarding/status')
        ->assertStatus(200)
        ->assertJsonPath('data.is_complete', true)
        ->assertJsonPath('data.step', 8);
});

it('step4 rejects more than 3 photos when user has no pro business', function () {
    Storage::fake('local');
    $user = User::factory()->create();
    $token = $user->createToken('lw-spa')->plainTextToken;

    $photos = collect(range(1, 4))->map(fn () => UploadedFile::fake()->image('x.jpg', 200, 200))->all();

    test()->withHeaders([
        'Authorization' => "Bearer {$token}",
        'Accept' => 'application/json',
    ])
        ->post('/api/v1/onboarding/step/4', ['photos' => $photos])
        ->assertStatus(422);
});

it('step4 allows four photos when business plan is pending pro', function () {
    Storage::fake('local');
    $business = Business::create([
        'name' => 'Pro Pending',
        'subdomain' => 'pro-pend-'.substr(sha1((string) random_int(0, PHP_INT_MAX)), 0, 10),
        'subdomain_type' => 'custom',
        'sector' => 'otros',
        'plan' => Plan::Pending,
        'is_published' => false,
    ]);
    $user = User::factory()->create(['business_id' => $business->id]);
    $token = $user->createToken('lw-spa')->plainTextToken;

    $photos = collect(range(1, 4))->map(fn ($i) => UploadedFile::fake()->image("g{$i}.jpg", 200, 200))->all();

    test()->withHeader('Authorization', "Bearer {$token}")
        ->post('/api/v1/onboarding/step/4', ['photos' => $photos])
        ->assertStatus(200)
        ->assertJsonPath('data.ok', true)
        ->assertJsonPath('data.count', 4);
});

it('status with business but onboarding not completed returns step 8 draft', function () {
    $business = Business::create([
        'name' => 'Almost',
        'subdomain' => 'alm-tttt-cccc',
        'subdomain_type' => 'custom',
        'sector' => 'otros',
        'template_id' => null,
        'plan' => 'pending',
        'is_published' => false,
        'onboarding_completed_at' => null,
    ]);
    $user = User::factory()->create(['business_id' => $business->id]);
    $token = $user->createToken('lw-spa')->plainTextToken;

    test()->withHeader('Authorization', "Bearer {$token}")
        ->getJson('/api/v1/onboarding/status')
        ->assertStatus(200)
        ->assertJsonPath('data.is_complete', false)
        ->assertJsonPath('data.step', 8)
        ->assertJsonPath('data.draft.business_name', 'Almost')
        ->assertJsonPath('data.draft.subdomain', 'alm-tttt-cccc');
});
