<?php

use App\Models\Business;
use App\Models\Template;
use App\Services\TemplatePalette;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('resolveColor returns stored color even when contrast is low', function () {
    $noir = Template::create([
        'name' => 'Noir Elite',
        'slug' => 'noir-elite',
        'primary_color' => '#C9A84C',
        'is_active' => true,
        'requires_pro' => false,
        'hero_photo_slots' => 1,
        'sort_order' => 2,
    ]);

    // text_on_dark: #1a1a1a no alcanza 4.5 sobre fondo #0a0a0a.
    $business = Business::factory()->create([
        'template_id' => $noir->id,
        'brand_color' => '#1a1a1a',
    ]);
    $business->setRelation('template', $noir);

    $palette = app(TemplatePalette::class);

    expect($palette->resolveColor($business))->toBe('#1a1a1a')
        ->and($business->brand_color)->toBe('#1a1a1a');
});

it('isTemplateSupported returns false for wild-pet', function () {
    $wild = Template::create([
        'name' => 'Wild Pet',
        'slug' => 'wild-pet',
        'primary_color' => '#000000',
        'is_active' => true,
        'requires_pro' => false,
        'hero_photo_slots' => 1,
        'sort_order' => 99,
    ]);

    expect(app(TemplatePalette::class)->isTemplateSupported($wild))->toBeFalse()
        ->and(config('branding.unsupported_templates'))->toContain('wild-pet');
});
