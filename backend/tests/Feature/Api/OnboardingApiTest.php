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
    test()->actingAs($user)
        ->getJson('/api/v1/onboarding/status')
        ->assertStatus(200)
        ->assertJsonPath('data.is_complete', false)
        ->assertJsonPath('data.step', 1);
});

it('templates without business returns full catalog with pro templates locked', function () {
    Template::create([
        'name' => 'Noir Elite',
        'slug' => 'noir-elite',
        'primary_color' => '#C9A84C',
        'is_active' => true,
        'requires_pro' => false,
        'sort_order' => 10,
    ]);
    Template::create([
        'name' => 'Tavola Warm',
        'slug' => 'tavola-warm',
        'primary_color' => '#C8553D',
        'is_active' => true,
        'requires_pro' => true,
        'sort_order' => 20,
    ]);
    $user = User::factory()->create();
    test()->actingAs($user)
        ->getJson('/api/v1/onboarding/templates')
        ->assertStatus(200)
        ->assertJsonCount(2, 'data')
        ->assertJsonPath('data.0.slug', 'noir-elite')
        ->assertJsonPath('data.0.locked', false)
        ->assertJsonPath('data.1.slug', 'tavola-warm')
        ->assertJsonPath('data.1.locked', true);
});

it('step1 invalid template returns 422', function () {
    $user = User::factory()->create();
    test()->actingAs($user)
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
    test()->actingAs($user)
        ->postJson('/api/v1/onboarding/step/1', [
            'template_id' => $template->id,
            'sector' => 'otros',
        ])->assertStatus(200)->assertJsonPath('data.ok', true);

    expect(Cache::get("onboarding:{$user->id}"))->toBeArray();
});

it('step3 without business_name returns 422', function () {
    $user = User::factory()->create();
    test()->actingAs($user)
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
    test()->actingAs($user)
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
    test()->actingAs($user)
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
    test()->actingAs($user)
        ->getJson('/api/v1/onboarding/status')
        ->assertStatus(200)
        ->assertJsonPath('data.is_complete', true)
        ->assertJsonPath('data.step', 8);
});

it('step4 rejects more than 3 photos when user has no pro business', function () {
    Storage::fake('local');
    $user = User::factory()->create();
    $photos = collect(range(1, 4))->map(fn () => UploadedFile::fake()->image('x.jpg', 200, 200))->all();

    test()->actingAs($user)
        ->post('/api/v1/onboarding/step/4', ['photos' => $photos])
        ->assertStatus(422);
});

it('step4 allows four photos when business plan is pending pro', function () {
    // Con $business cargado, step4 sube a `r2` vía ImageService (no a `local` como el modo draft).
    Storage::fake('local');
    Storage::fake('r2');
    $business = Business::create([
        'name' => 'Pro Pending',
        'subdomain' => 'pro-pend-'.substr(sha1((string) random_int(0, PHP_INT_MAX)), 0, 10),
        'subdomain_type' => 'custom',
        'sector' => 'otros',
        'plan' => Plan::Pending,
        'is_published' => false,
    ]);
    $user = User::factory()->create(['business_id' => $business->id]);
    $photos = collect(range(1, 4))->map(fn ($i) => UploadedFile::fake()->image("g{$i}.jpg", 200, 200))->all();

    test()->actingAs($user)
        ->post('/api/v1/onboarding/step/4', ['photos' => $photos])
        ->assertStatus(200)
        ->assertJsonPath('data.ok', true)
        ->assertJsonPath('data.count', 4);
});

it('step7 pro returns 422 with reason=reserved for reserved subdomains', function () {
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
        'business_name' => 'Reserved Test',
    ], now()->addHours(4));
    test()->actingAs($user)
        ->postJson('/api/v1/onboarding/step/7', [
            'plan' => 'pro',
            'subdomain' => 'admin',
        ])
        ->assertStatus(422)
        ->assertJsonPath('errors.subdomain', 'reserved');
});

it('step7 pro returns 422 with reason=invalid_format for malformed subdomains', function () {
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
        'business_name' => 'Bad Format',
    ], now()->addHours(4));
    test()->actingAs($user)
        ->postJson('/api/v1/onboarding/step/7', [
            'plan' => 'pro',
            'subdomain' => '-bad-',
        ])
        ->assertStatus(422)
        ->assertJsonPath('errors.subdomain', 'invalid_format');
});

it('step7 pro returns 422 with reason=taken when subdomain already exists', function () {
    Business::create([
        'name' => 'Existing',
        'subdomain' => 'mi-tienda',
        'subdomain_type' => 'custom',
        'sector' => 'otros',
    ]);

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
        'business_name' => 'Take Test',
    ], now()->addHours(4));
    test()->actingAs($user)
        ->postJson('/api/v1/onboarding/step/7', [
            'plan' => 'pro',
            'subdomain' => 'mi-tienda',
        ])
        ->assertStatus(422)
        ->assertJsonPath('errors.subdomain', 'taken');
});

it('step7 pro returns 422 with reason=too_short for missing/short subdomain', function () {
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
        'business_name' => 'Short',
    ], now()->addHours(4));
    test()->actingAs($user)
        ->postJson('/api/v1/onboarding/step/7', ['plan' => 'pro'])
        ->assertStatus(422)
        ->assertJsonPath('errors.subdomain', 'too_short');

    test()->actingAs($user)
        ->postJson('/api/v1/onboarding/step/7', ['plan' => 'pro', 'subdomain' => 'ab'])
        ->assertStatus(422)
        ->assertJsonPath('errors.subdomain', 'too_short');
});

it('status with business but onboarding not completed returns step 8 draft', function () {
    $business = Business::create([
        'name' => 'Almost',
        'subdomain' => 'alm-tttt-cccc',
        'subdomain_type' => 'custom',
        'sector' => 'otros',
        'template_id' => null,
        'plan' => Plan::Pro,
        'is_published' => false,
        'onboarding_completed_at' => null,
    ]);
    $user = User::factory()->create(['business_id' => $business->id]);
    test()->actingAs($user)
        ->getJson('/api/v1/onboarding/status')
        ->assertStatus(200)
        ->assertJsonPath('data.is_complete', false)
        ->assertJsonPath('data.step', 8)
        ->assertJsonPath('data.draft.business_name', 'Almost')
        ->assertJsonPath('data.draft.subdomain', 'alm-tttt-cccc');
});

it('step8 free publishes and finalizes onboarding in the same call', function () {
    $business = Business::create([
        'name' => 'Free Pub',
        'subdomain' => 'free-pub-'.substr(sha1((string) random_int(0, PHP_INT_MAX)), 0, 6),
        'subdomain_type' => 'random',
        'sector' => 'otros',
        'plan' => Plan::Free,
        'is_published' => false,
        'onboarding_completed_at' => null,
    ]);
    $user = User::factory()->create(['business_id' => $business->id]);

    test()->actingAs($user)
        ->postJson('/api/v1/onboarding/step/8')
        ->assertStatus(200)
        ->assertJsonPath('data.ok', true);

    $business->refresh();
    expect($business->is_published)->toBeTrue()
        ->and($business->onboarding_completed_at)->not->toBeNull();
});

it('step8 pro publishes but does NOT finalize onboarding (defers to /finalize)', function () {
    // Bug del bucle reportado: si step8 marcara onboarding_completed_at en Pro, el guard
    // del front echaría al usuario fuera del wizard antes de poder ver el step9 (extras).
    $business = Business::create([
        'name' => 'Pro Defer',
        'subdomain' => 'pro-def-'.substr(sha1((string) random_int(0, PHP_INT_MAX)), 0, 6),
        'subdomain_type' => 'custom',
        'sector' => 'otros',
        'plan' => Plan::Pro,
        'is_published' => false,
        'onboarding_completed_at' => null,
    ]);
    $user = User::factory()->create(['business_id' => $business->id]);

    test()->actingAs($user)
        ->postJson('/api/v1/onboarding/step/8')
        ->assertStatus(200);

    $business->refresh();
    expect($business->is_published)->toBeTrue()
        ->and($business->onboarding_completed_at)->toBeNull();
});

it('step8 pending also defers finalization (Stripe webhook may still be in flight)', function () {
    // Si el usuario pulsó publicar antes de que el webhook le pase a Pro, no finalizamos:
    // el flujo Pro se cierra desde Step9 → POST /onboarding/finalize.
    $business = Business::create([
        'name' => 'Pending Defer',
        'subdomain' => 'pen-def-'.substr(sha1((string) random_int(0, PHP_INT_MAX)), 0, 6),
        'subdomain_type' => 'custom',
        'sector' => 'otros',
        'plan' => Plan::Pending,
        'is_published' => false,
        'onboarding_completed_at' => null,
    ]);
    $user = User::factory()->create(['business_id' => $business->id]);

    test()->actingAs($user)
        ->postJson('/api/v1/onboarding/step/8')
        ->assertStatus(200);

    $business->refresh();
    expect($business->is_published)->toBeTrue()
        ->and($business->onboarding_completed_at)->toBeNull();
});

it('finalize endpoint sets onboarding_completed_at and is idempotent', function () {
    $business = Business::create([
        'name' => 'Finalize Me',
        'subdomain' => 'fin-'.substr(sha1((string) random_int(0, PHP_INT_MAX)), 0, 6),
        'subdomain_type' => 'custom',
        'sector' => 'otros',
        'plan' => Plan::Pro,
        'is_published' => true,
        'onboarding_completed_at' => null,
    ]);
    $user = User::factory()->create(['business_id' => $business->id]);

    test()->actingAs($user)
        ->postJson('/api/v1/onboarding/finalize')
        ->assertStatus(200)
        ->assertJsonPath('data.ok', true);

    $business->refresh();
    $first = $business->onboarding_completed_at;
    expect($first)->not->toBeNull();

    test()->actingAs($user)
        ->postJson('/api/v1/onboarding/finalize')
        ->assertStatus(200);

    $business->refresh();
    expect($business->onboarding_completed_at?->toIso8601String())->toBe($first?->toIso8601String());
});

it('finalize endpoint returns 404 when user has no business', function () {
    $user = User::factory()->create();
    test()->actingAs($user)
        ->postJson('/api/v1/onboarding/finalize')
        ->assertStatus(404);
});
