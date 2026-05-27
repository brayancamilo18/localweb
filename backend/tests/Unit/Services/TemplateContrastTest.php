<?php

use App\Models\Template;
use App\Services\TemplateContrast;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function contrastTemplate(string $slug): Template
{
    return Template::query()->firstOrCreate(
        ['slug' => $slug],
        [
            'name' => 'Template '.$slug,
            'primary_color' => '#000000',
            'is_active' => true,
            'requires_pro' => false,
            'hero_photo_slots' => 1,
            'sort_order' => 1,
        ],
    );
}

it('rejects invalid hex format', function () {
    $service = app(TemplateContrast::class);
    $result = $service->check('not-a-hex', contrastTemplate('urban-bold'));
    expect($result['ok'])->toBeFalse()->and($result['reason'])->toBe('invalid_hex');
});

it('rejects templates without metadata (e.g. wild-pet)', function () {
    $service = app(TemplateContrast::class);
    $result = $service->check('#0066cc', contrastTemplate('wild-pet'));
    expect($result['ok'])->toBeFalse()->and($result['reason'])->toBe('no_metadata');
});

it('accepts a custom color that passes contrast on bg template', function () {
    $service = app(TemplateContrast::class);
    // urban-bold: bg, ink #0a0a0a sobre color. #ffaa00 contrasta bien con negro.
    $result = $service->check('#ffaa00', contrastTemplate('urban-bold'));
    expect($result['ok'])->toBeTrue();
});

it('rejects yellow on white as text', function () {
    $service = app(TemplateContrast::class);
    $result = $service->check('#ffff00', contrastTemplate('mono-edito'));
    expect($result['ok'])->toBeFalse()->and($result['reason'])->toBe('low_contrast');
});

it('rejects light pink on cream bg (mixed)', function () {
    $service = app(TemplateContrast::class);
    $result = $service->check('#ffe0e0', contrastTemplate('bloom-studio'));
    expect($result['ok'])->toBeFalse()->and($result['reason'])->toBe('low_contrast');
});

it('rejects very dark on dark bg (text_on_dark)', function () {
    $service = app(TemplateContrast::class);
    $result = $service->check('#1a1a1a', contrastTemplate('tech-sleek'));
    expect($result['ok'])->toBeFalse()->and($result['reason'])->toBe('low_contrast');
});

it('all curated palette colors pass contrast on their own template', function () {
    $service = app(TemplateContrast::class);
    foreach (config('branding.palettes') as $slug => $colors) {
        if (! config('branding.templates.'.$slug)) {
            continue;
        }
        $template = contrastTemplate($slug);
        foreach ($colors as $hex) {
            $result = $service->check($hex, $template);
            expect($result['ok'])->toBeTrue("$slug $hex");
        }
    }
});
