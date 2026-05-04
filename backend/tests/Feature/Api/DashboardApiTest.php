<?php

use App\Models\Business;
use App\Models\BusinessImage;
use App\Models\Template;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;

uses(RefreshDatabase::class);

it('dashboard business without business returns 403', function () {
    $user = User::factory()->create();
    $token = $user->createToken('lw-spa')->plainTextToken;

    test()->withHeader('Authorization', "Bearer {$token}")
        ->getJson('/api/v1/dashboard/business')
        ->assertStatus(403);
});

it('dashboard business with business returns 200', function () {
    $template = Template::create(['name' => 'Noir Elite', 'slug' => 'noir-elite', 'primary_color' => '#C9A84C', 'is_active' => true, 'requires_pro' => false]);
    $business = Business::create(['name' => 'B', 'subdomain' => 'abc-def-ghij', 'subdomain_type' => 'random', 'sector' => 'otros', 'template_id' => $template->id]);
    $user = User::factory()->create(['business_id' => $business->id]);
    $token = $user->createToken('lw-spa')->plainTextToken;

    test()->withHeader('Authorization', "Bearer {$token}")
        ->getJson('/api/v1/dashboard/business')
        ->assertStatus(200)
        ->assertJsonPath('data.id', $business->id);
});

it('dashboard update business persists changes', function () {
    $business = Business::create(['name' => 'B', 'subdomain' => 'bcd-efgh-jklm', 'subdomain_type' => 'random', 'sector' => 'otros']);
    $user = User::factory()->create(['business_id' => $business->id]);
    $token = $user->createToken('lw-spa')->plainTextToken;

    test()->withHeader('Authorization', "Bearer {$token}")
        ->putJson('/api/v1/dashboard/business', ['name' => 'Nuevo Nombre'])
        ->assertStatus(200);

    expect($business->fresh()->name)->toBe('Nuevo Nombre');
});

it('stats free user returns upgrade required', function () {
    $business = Business::create(['name' => 'B', 'subdomain' => 'ccc-dddd-eeee', 'subdomain_type' => 'random', 'sector' => 'otros', 'plan' => 'free']);
    $user = User::factory()->create(['business_id' => $business->id]);
    $token = $user->createToken('lw-spa')->plainTextToken;

    test()->withHeader('Authorization', "Bearer {$token}")
        ->getJson('/api/v1/dashboard/stats')
        ->assertStatus(403)
        ->assertJsonPath('upgrade_required', true);
});

it('images upload over free limit returns 422 upgrade required', function () {
    $business = Business::create(['name' => 'B', 'subdomain' => 'fff-gggg-hhhh', 'subdomain_type' => 'random', 'sector' => 'otros', 'plan' => 'free']);
    $user = User::factory()->create(['business_id' => $business->id]);
    for ($i = 0; $i < 3; $i++) {
        BusinessImage::create(['business_id' => $business->id, 'path' => "x/{$i}.webp", 'section' => 'gallery', 'display_order' => $i]);
    }
    $token = $user->createToken('lw-spa')->plainTextToken;

    test()->withHeader('Authorization', "Bearer {$token}")
        ->post('/api/v1/dashboard/images', [
            'file' => UploadedFile::fake()->image('a.jpg'),
            'section' => 'gallery',
        ])
        ->assertStatus(422)
        ->assertJsonPath('upgrade_required', true);
});

it('deleting image from other business returns 403', function () {
    $businessA = Business::create(['name' => 'A', 'subdomain' => 'aaa-bbbb-cccc', 'subdomain_type' => 'random', 'sector' => 'otros']);
    $businessB = Business::create(['name' => 'B', 'subdomain' => 'ddd-eeee-ffff', 'subdomain_type' => 'random', 'sector' => 'otros']);
    $userA = User::factory()->create(['business_id' => $businessA->id]);
    $imageB = BusinessImage::create(['business_id' => $businessB->id, 'path' => 'x.webp', 'section' => 'gallery', 'display_order' => 0]);
    $token = $userA->createToken('lw-spa')->plainTextToken;

    test()->withHeader('Authorization', "Bearer {$token}")
        ->deleteJson("/api/v1/dashboard/images/{$imageB->id}")
        ->assertStatus(403);
});
