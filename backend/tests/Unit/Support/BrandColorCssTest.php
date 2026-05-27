<?php

use App\Support\BrandColorCss;

it('generates root style with hover and soft derivatives', function () {
    $style = BrandColorCss::rootStyleBlock('accent', '#0f7b5f');

    expect($style)
        ->toContain('--accent: #0f7b5f')
        ->toContain('--accent-hover:')
        ->toContain('--accent-soft:')
        ->toContain('--accent-on:');
});

it('uses light text on dark brand colors', function () {
    $props = BrandColorCss::propertiesFor('gold', '#5a1f1f');

    expect($props['gold-on'])->toBe('#ffffff')
        ->and($props['gold-hover'])->not->toBe('#5a1f1f');
});

it('syncs terracotta-soft with brand hex', function () {
    $props = BrandColorCss::propertiesFor('terracotta', '#7a3e3e');

    expect($props['terracotta'])->toBe('#7a3e3e')
        ->and($props['terracotta-soft'])->toMatch('/^#[0-9a-f]{6}$/');
});
