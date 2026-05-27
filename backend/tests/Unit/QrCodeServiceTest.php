<?php

use App\Models\Business;
use App\Models\Template;
use App\Services\QrCodeService;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('uses brand_color for QR when no override is passed', function () {
    $template = Template::create([
        'name' => 'Urban Bold',
        'slug' => 'urban-bold',
        'primary_color' => '#D4FF3A',
        'is_active' => true,
        'requires_pro' => false,
    ]);
    $business = Business::factory()->create([
        'template_id' => $template->id,
        'brand_color' => '#19b3f5',
    ]);
    $business->load('template');

    $color = app(QrCodeService::class)->colorForBusiness($business);

    expect($color)->toBe('#19B3F5');
});

it('prefers explicit override over brand_color', function () {
    $template = Template::create([
        'name' => 'Urban Bold',
        'slug' => 'urban-bold',
        'primary_color' => '#D4FF3A',
        'is_active' => true,
        'requires_pro' => false,
    ]);
    $business = Business::factory()->create([
        'template_id' => $template->id,
        'brand_color' => '#19b3f5',
    ]);
    $business->load('template');

    $color = app(QrCodeService::class)->colorForBusiness($business, '#FF0000');

    expect($color)->toBe('#FF0000');
});
