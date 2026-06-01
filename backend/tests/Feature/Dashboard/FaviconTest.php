<?php

use App\Enums\Plan;
use App\Models\Business;
use App\Services\SeoMetaBuilder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

uses(RefreshDatabase::class);

beforeEach(function () {
    Storage::fake('local');
    Storage::fake('r2');
});

function proBusiness(array $overrides = []): Business
{
    return Business::factory()->withTemplate()->create(array_merge([
        'plan' => Plan::Pro,
        'onboarding_completed_at' => now(),
        'is_published' => true,
    ], $overrides));
}

function freeBusiness(array $overrides = []): Business
{
    return Business::factory()->withTemplate()->create(array_merge([
        'plan' => Plan::Free,
        'onboarding_completed_at' => now(),
        'is_published' => true,
    ], $overrides));
}

it('allows a pro business to upload a favicon png', function () {
    $business = proBusiness();
    $user = verifiedDashboardUser($business);

    test()->actingAs($user)
        ->post('/api/v1/dashboard/favicon', [
            'file' => UploadedFile::fake()->image('icon.png', 200, 200),
        ])
        ->assertOk()
        ->assertJsonPath('data.favicon_url', fn ($url) => is_string($url) && $url !== '');

    $business->refresh();

    expect($business->favicon_path)->not->toBeNull()
        ->and($business->favicon_path)->toStartWith("businesses/{$business->id}/favicon/")
        ->and($business->favicon_path)->toEndWith('.png');

    expect(Storage::disk('r2')->exists($business->favicon_path))->toBeTrue();
});

it('accepts jpeg favicon uploads after client-side compression', function () {
    $business = proBusiness();
    $user = verifiedDashboardUser($business);

    test()->actingAs($user)
        ->post('/api/v1/dashboard/favicon', [
            'file' => UploadedFile::fake()->image('icon.jpg', 512, 512),
        ])
        ->assertOk();

    $business->refresh();

    expect($business->favicon_path)->toEndWith('.png');
    expect(Storage::disk('r2')->exists($business->favicon_path))->toBeTrue();
});

it('persists favicon uploads as square png files', function () {
    $business = proBusiness();
    $user = verifiedDashboardUser($business);

    test()->actingAs($user)
        ->post('/api/v1/dashboard/favicon', [
            'file' => UploadedFile::fake()->image('wide.png', 300, 100),
        ])
        ->assertOk();

    $business->refresh();
    $path = $business->favicon_path;

    expect($path)->toEndWith('.png');
    expect(Storage::disk('r2')->exists($path))->toBeTrue();

    $contents = Storage::disk('r2')->get($path);
    $info = getimagesizefromstring($contents);

    expect($info)->not->toBeFalse()
        ->and($info[0])->toBe($info[1])
        ->and($info['mime'])->toBe('image/png');
});

it('returns 422 upgrade required when a free business uploads a favicon', function () {
    $business = freeBusiness();
    $user = verifiedDashboardUser($business);

    test()->actingAs($user)
        ->post('/api/v1/dashboard/favicon', [
            'file' => UploadedFile::fake()->image('icon.png', 64, 64),
        ])
        ->assertStatus(422)
        ->assertJsonPath('upgrade_required', true);

    expect($business->fresh()->favicon_path)->toBeNull();
});

it('deletes favicon file and clears favicon_path', function () {
    $business = proBusiness();
    $user = verifiedDashboardUser($business);

    test()->actingAs($user)
        ->post('/api/v1/dashboard/favicon', [
            'file' => UploadedFile::fake()->image('icon.png', 120, 120),
        ])
        ->assertOk();

    $business->refresh();
    $path = $business->favicon_path;

    expect($path)->not->toBeNull();
    expect(Storage::disk('r2')->exists($path))->toBeTrue();

    test()->actingAs($user)
        ->deleteJson('/api/v1/dashboard/favicon')
        ->assertOk()
        ->assertJsonPath('data.favicon_url', null);

    expect($business->fresh()->favicon_path)->toBeNull();
    expect(Storage::disk('r2')->exists($path))->toBeFalse();
});

it('seo meta builder exposes favicon url for pro businesses with favicon', function () {
    $business = proBusiness();
    $path = "businesses/{$business->id}/favicon/seed.png";
    Storage::disk('r2')->put($path, UploadedFile::fake()->image('seed.png', 64, 64)->getContent());
    $business->update(['favicon_path' => $path]);

    $seo = app(SeoMetaBuilder::class)->build($business->fresh());

    expect($seo['favicon_url'])->not->toBeNull()
        ->and($seo['favicon_type'])->toBe('image/png');
});

it('seo meta builder hides favicon for free businesses even when favicon_path is set', function () {
    $business = freeBusiness([
        'favicon_path' => "businesses/999/favicon/legacy.png",
    ]);

    $seo = app(SeoMetaBuilder::class)->build($business);

    expect($seo['favicon_url'])->toBeNull()
        ->and($seo['favicon_type'])->toBeNull();
});
