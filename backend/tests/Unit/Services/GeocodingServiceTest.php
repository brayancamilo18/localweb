<?php

use App\Exceptions\Auth\GeocodingException;
use App\Services\GeocodingService;
use Illuminate\Support\Facades\Http;

it('geocode returns lat and lng for valid response', function () {
    Http::fake([
        'https://nominatim.openstreetmap.org/search*' => Http::response([
            [
                'lat' => '40.4167754',
                'lon' => '-3.7037902',
                'display_name' => 'Madrid, Spain',
            ],
        ], 200),
    ]);

    $service = new GeocodingService();
    $result = $service->geocode('Madrid');

    expect($result['lat'])->toBe(40.4167754)
        ->and($result['lng'])->toBe(-3.7037902);
});

it('geocode throws GeocodingException for empty response', function () {
    Http::fake([
        'https://nominatim.openstreetmap.org/search*' => Http::response([], 200),
    ]);

    $service = new GeocodingService();
    $service->geocode('Unknown place');
})->throws(GeocodingException::class);
