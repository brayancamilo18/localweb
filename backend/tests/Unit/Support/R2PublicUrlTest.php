<?php

use App\Support\R2PublicUrl;
use Illuminate\Support\Facades\URL;

it('builds proxy URLs for allowed paths', function () {
    URL::forceRootUrl('https://app.onez.es');

    $url = R2PublicUrl::proxyUrl('businesses/42/cover/photo.webp');

    expect($url)->toContain('/api/v1/media/businesses/42/cover/photo.webp');
});

it('rejects unsafe media paths', function () {
    expect(R2PublicUrl::isAllowedPath('../etc/passwd'))->toBeFalse()
        ->and(R2PublicUrl::isAllowedPath('businesses/1/cover/x.webp'))->toBeTrue()
        ->and(R2PublicUrl::isAllowedPath('businesses/1/logo/x.png'))->toBeTrue()
        ->and(R2PublicUrl::isAllowedPath('businesses/1/events/x.webp'))->toBeTrue();
});

it('returns null for empty paths', function () {
    expect(R2PublicUrl::forPath(null))->toBeNull()
        ->and(R2PublicUrl::forPath(''))->toBeNull();
});
