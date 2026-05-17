<?php

use App\Services\PublicPageUrlService;
use Illuminate\Support\Facades\Config;

it('builds tenant url from configured public page domain', function () {
    Config::set('public_page.domain', 'onez.es');
    Config::set('public_page.scheme', 'https');

    $url = (new PublicPageUrlService)->forSubdomain('silgodev');

    expect($url)->toBe('https://silgodev.onez.es');
});

it('falls back to app url host when public page domain is not set', function () {
    Config::set('public_page.domain', null);
    Config::set('app.url', 'http://localhost');

    $url = (new PublicPageUrlService)->forSubdomain('demo');

    expect($url)->toBe('http://demo.localhost');
});
