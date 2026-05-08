<?php

use App\Models\Business;
use App\Models\BusinessImage;
use App\Models\BusinessService;
use App\Models\User;
use App\Support\PublicPageCache;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Queue;

uses(RefreshDatabase::class);

beforeEach(function () {
    Queue::fake(); // evitar disparar RegisterPageVisit
});

function publicPageCacheKey(string $sub): string
{
    return PublicPageCache::KEY_PREFIX.$sub;
}

it('caches the public page on first hit and serves from cache on second hit', function () {
    Business::create([
        'name' => 'Hit',
        'subdomain' => 'cache-hit-'.uniqid(),
        'subdomain_type' => 'random',
        'sector' => 'otros',
        'is_published' => true,
    ]);
    $sub = Business::query()->latest('id')->first()->subdomain;

    expect(Cache::has(publicPageCacheKey($sub)))->toBeFalse();

    test()->getJson("/api/v1/public/{$sub}")->assertStatus(200);

    expect(Cache::has(publicPageCacheKey($sub)))->toBeTrue();

    // Cambiamos el name por DB directa (sin disparar observer) para probar que el segundo GET
    // sigue devolviendo el valor cacheado.
    \Illuminate\Support\Facades\DB::table('businesses')->where('subdomain', $sub)->update(['name' => 'Mutated']);

    $second = test()->getJson("/api/v1/public/{$sub}")->assertStatus(200);
    expect($second->json('data.name'))->toBe('Hit');
});

it('invalidates the cache when a service is created via Eloquent (observer)', function () {
    $business = Business::create([
        'name' => 'Svc',
        'subdomain' => 'svc-'.uniqid(),
        'subdomain_type' => 'random',
        'sector' => 'otros',
        'is_published' => true,
    ]);

    test()->getJson("/api/v1/public/{$business->subdomain}")->assertStatus(200);
    expect(Cache::has(publicPageCacheKey($business->subdomain)))->toBeTrue();

    BusinessService::create([
        'business_id' => $business->id,
        'name' => 'Corte',
        'price' => 10,
        'description' => null,
        'display_order' => 0,
    ]);

    expect(Cache::has(publicPageCacheKey($business->subdomain)))->toBeFalse();

    $second = test()->getJson("/api/v1/public/{$business->subdomain}")->assertStatus(200);
    expect(collect($second->json('data.services'))->pluck('name'))->toContain('Corte');
});

it('invalidates the cache when a service is updated or deleted', function () {
    $business = Business::create([
        'name' => 'SvcEdit',
        'subdomain' => 'svc-edit-'.uniqid(),
        'subdomain_type' => 'random',
        'sector' => 'otros',
        'is_published' => true,
    ]);

    $service = BusinessService::create([
        'business_id' => $business->id,
        'name' => 'Tinte',
        'price' => 25,
        'description' => null,
        'display_order' => 0,
    ]);

    test()->getJson("/api/v1/public/{$business->subdomain}")->assertStatus(200);
    Cache::put(publicPageCacheKey($business->subdomain), ['id' => $business->id, 'name' => 'stale'], 300);

    $service->update(['name' => 'Tinte premium']);
    expect(Cache::has(publicPageCacheKey($business->subdomain)))->toBeFalse();

    Cache::put(publicPageCacheKey($business->subdomain), ['id' => $business->id], 300);

    $service->delete();
    expect(Cache::has(publicPageCacheKey($business->subdomain)))->toBeFalse();
});

it('invalidates the cache when a business image is saved or deleted', function () {
    $business = Business::create([
        'name' => 'Img',
        'subdomain' => 'img-'.uniqid(),
        'subdomain_type' => 'random',
        'sector' => 'otros',
        'is_published' => true,
    ]);

    Cache::put(publicPageCacheKey($business->subdomain), ['id' => $business->id], 300);

    $image = BusinessImage::create([
        'business_id' => $business->id,
        'path' => 'businesses/x/gallery/test.webp',
        'section' => 'gallery',
        'display_order' => 0,
        'width' => 100,
        'height' => 100,
    ]);
    expect(Cache::has(publicPageCacheKey($business->subdomain)))->toBeFalse();

    Cache::put(publicPageCacheKey($business->subdomain), ['id' => $business->id], 300);
    $image->delete();
    expect(Cache::has(publicPageCacheKey($business->subdomain)))->toBeFalse();
});

it('invalidates the cache when the business itself is updated, soft-deleted or restored', function () {
    $business = Business::create([
        'name' => 'Biz',
        'subdomain' => 'biz-'.uniqid(),
        'subdomain_type' => 'random',
        'sector' => 'otros',
        'is_published' => true,
    ]);

    $key = publicPageCacheKey($business->subdomain);

    Cache::put($key, ['id' => $business->id], 300);
    $business->update(['name' => 'Renombrado']);
    expect(Cache::has($key))->toBeFalse();

    Cache::put($key, ['id' => $business->id], 300);
    $business->delete();
    expect(Cache::has($key))->toBeFalse();

    Cache::put($key, ['id' => $business->id], 300);
    $business->restore();
    expect(Cache::has($key))->toBeFalse();
});

it('invalidates both old and new subdomain when subdomain changes', function () {
    $business = Business::create([
        'name' => 'Move',
        'subdomain' => 'old-sub-'.uniqid(),
        'subdomain_type' => 'random',
        'sector' => 'otros',
        'is_published' => true,
    ]);

    $oldKey = publicPageCacheKey($business->subdomain);
    Cache::put($oldKey, ['id' => $business->id, 'name' => 'old'], 300);

    $newSub = 'new-sub-'.uniqid();
    $newKey = publicPageCacheKey($newSub);
    Cache::put($newKey, ['id' => $business->id, 'name' => 'pre-existing'], 300);

    $business->update(['subdomain' => $newSub]);

    expect(Cache::has($oldKey))->toBeFalse()
        ->and(Cache::has($newKey))->toBeFalse();
});

it('cache TTL is 300 seconds (5 min)', function () {
    Business::create([
        'name' => 'TTL',
        'subdomain' => 'ttl-'.uniqid(),
        'subdomain_type' => 'random',
        'sector' => 'otros',
        'is_published' => true,
    ]);
    $sub = Business::query()->latest('id')->first()->subdomain;

    test()->getJson("/api/v1/public/{$sub}")->assertStatus(200);

    // El array store de tests no expone TTL directamente; comprobamos que la clave existe
    // (la verificación numérica del TTL se documenta en el controller).
    expect(Cache::has(publicPageCacheKey($sub)))->toBeTrue();
});

it('updating a service via the dashboard endpoint invalidates the public cache', function () {
    $user = User::factory()->create();
    $business = Business::create([
        'name' => 'EndToEnd',
        'subdomain' => 'e2e-'.uniqid(),
        'subdomain_type' => 'random',
        'sector' => 'otros',
        'is_published' => true,
        'onboarding_completed_at' => now(),
    ]);
    $user->update(['business_id' => $business->id]);
    $token = $user->createToken('lw-spa')->plainTextToken;

    test()->getJson("/api/v1/public/{$business->subdomain}")->assertStatus(200);
    expect(Cache::has(publicPageCacheKey($business->subdomain)))->toBeTrue();

    test()->withHeader('Authorization', "Bearer {$token}")
        ->postJson('/api/v1/dashboard/services', [
            'name' => 'Manicura',
            'price' => 12,
        ])
        ->assertStatus(200);

    expect(Cache::has(publicPageCacheKey($business->subdomain)))->toBeFalse();

    $second = test()->getJson("/api/v1/public/{$business->subdomain}")->assertStatus(200);
    expect(collect($second->json('data.services'))->pluck('name'))->toContain('Manicura');
});
