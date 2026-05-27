<?php

use App\Services\ColorDistance;

beforeEach(function () {
    $this->distance = new ColorDistance;
});

it('deltaE between identical colors is zero', function () {
    expect($this->distance->deltaE2000('#000000', '#000000'))->toBeLessThan(0.01)
        ->and($this->distance->deltaE2000('#ff0000', '#ff0000'))->toBeLessThan(0.01);
});

it('deltaE between white and black is about 100', function () {
    $delta = $this->distance->deltaE2000('#ffffff', '#000000');

    expect($delta)->toBeGreaterThan(95.0)
        ->and($delta)->toBeLessThan(105.0);
});

it('deltaE between nearly identical reds is below 1', function () {
    expect($this->distance->deltaE2000('#ff0000', '#ff0001'))->toBeLessThan(1.0);
});

it('closestInPalette picks burgundy for neon pink in trust-clinic palette', function () {
    $palette = config('branding.palettes.trust-clinic');

    expect($this->distance->closestInPalette('#ff80ab', $palette))->toBe('#7a3e3e');
});

it('closestInPalette picks lime neon for urban lime in tech-sleek palette', function () {
    $palette = config('branding.palettes.tech-sleek');

    expect($this->distance->closestInPalette('#d4ff3a', $palette))->toBe('#a3e635');
});
