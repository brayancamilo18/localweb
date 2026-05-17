<?php

use App\Models\Business;
use App\Models\BusinessImage;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Storage;

uses(RefreshDatabase::class);

it('returns proxied image URLs when r2 public url is localhost', function () {
    Storage::fake('r2');
    Storage::disk('r2')->put('businesses/1/cover/x.webp', 'bytes');

    Config::set('filesystems.disks.r2.url', 'http://localhost:9000/bucket');

    $business = Business::create([
        'name' => 'B',
        'subdomain' => 'img-url-test-aaaa',
        'subdomain_type' => 'random',
        'sector' => 'otros',
    ]);
    BusinessImage::create([
        'business_id' => $business->id,
        'path' => 'businesses/1/cover/x.webp',
        'section' => 'cover',
        'display_order' => 0,
    ]);
    $user = User::factory()->create(['business_id' => $business->id]);

    $response = test()->actingAs($user)
        ->getJson('/api/v1/dashboard/business')
        ->assertOk();

    $url = $response->json('data.images.cover.0.url');
    expect($url)->toBeString()->toContain('/api/v1/media/businesses/1/cover/x.webp');
});
