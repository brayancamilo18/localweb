<?php

use App\Exceptions\Auth\GeocodingException;
use App\Services\GeocodingService;
use Illuminate\Support\Facades\Http;

it('geocode returns lat and lng for valid response with a single address argument', function () {
    Http::fake([
        'https://nominatim.openstreetmap.org/search*' => Http::response([
            [
                'lat' => '40.4167754',
                'lon' => '-3.7037902',
                'display_name' => 'Madrid, Spain',
                'addresstype' => 'city',
                'importance' => 0.9,
            ],
        ], 200),
    ]);

    $service = new GeocodingService;
    $result = $service->geocode('Madrid');

    expect($result['lat'])->toBe(40.4167754)
        ->and($result['lng'])->toBe(-3.7037902)
        ->and($result['precision'])->toBe('area');
});

it('uses structured search when city and country code are provided', function () {
    Http::fake([
        'https://nominatim.openstreetmap.org/search*' => Http::response([
            [
                'lat' => '41.3874',
                'lon' => '2.1686',
                'display_name' => 'Carrer Provença 281, Barcelona, Spain',
                'addresstype' => 'house',
                'importance' => 0.6,
            ],
        ], 200),
    ]);

    $service = new GeocodingService;
    $service->geocode('Carrer Provença 281', 'Barcelona', 'ES');

    Http::assertSent(function ($request) {
        $query = $request->data();

        return str_contains($request->url(), 'nominatim.openstreetmap.org/search')
            && ($query['street'] ?? null) === 'Carrer Provença 281'
            && ($query['city'] ?? null) === 'Barcelona'
            && ($query['countrycodes'] ?? null) === 'es';
    });
});

it('prefers house over road when multiple candidates are returned', function () {
    Http::fake([
        'https://nominatim.openstreetmap.org/search*' => Http::response([
            [
                'lat' => '40.4150',
                'lon' => '-3.7070',
                'display_name' => 'Calle Mayor, Madrid, Spain',
                'addresstype' => 'road',
                'importance' => 0.8,
            ],
            [
                'lat' => '40.4169',
                'lon' => '-3.7035',
                'display_name' => 'Calle Mayor 5, Madrid, Spain',
                'addresstype' => 'house',
                'importance' => 0.4,
            ],
        ], 200),
    ]);

    $service = new GeocodingService;
    $result = $service->geocode('Calle Mayor 5', 'Madrid', 'ES');

    expect($result['lat'])->toBe(40.4169)
        ->and($result['lng'])->toBe(-3.7035)
        ->and($result['addresstype'])->toBe('house');
});

it('maps precision from addresstype correctly', function (string $addresstype, string $expectedPrecision) {
    Http::fake([
        'https://nominatim.openstreetmap.org/search*' => Http::response([
            [
                'lat' => '40.4167754',
                'lon' => '-3.7037902',
                'display_name' => 'Example location',
                'addresstype' => $addresstype,
                'importance' => 0.5,
            ],
        ], 200),
    ]);

    $service = new GeocodingService;
    $result = $service->geocode('Example', 'Madrid', 'ES');

    expect($result['precision'])->toBe($expectedPrecision);
})->with([
    ['house', 'exact'],
    ['building', 'exact'],
    ['road', 'street'],
    ['city', 'area'],
    ['suburb', 'area'],
]);

it('falls back to freeform search when structured search returns no results', function () {
    Http::fake([
        'https://nominatim.openstreetmap.org/search*' => Http::sequence()
            ->push([], 200)
            ->push([
                [
                    'lat' => '40.4167754',
                    'lon' => '-3.7037902',
                    'display_name' => 'Madrid, Spain',
                    'addresstype' => 'city',
                    'importance' => 0.9,
                ],
            ], 200),
    ]);

    $service = new GeocodingService;
    $result = $service->geocode('Madrid', 'Madrid', 'ES');

    expect($result['lat'])->toBe(40.4167754)
        ->and($result['lng'])->toBe(-3.7037902);

    Http::assertSentCount(2);

    Http::assertSent(function ($request) {
        $query = $request->data();

        return isset($query['street']);
    });

    Http::assertSent(function ($request) {
        $query = $request->data();

        return isset($query['q'])
            && ($query['countrycodes'] ?? null) === 'es';
    });
});

it('throws GeocodingException for empty response', function () {
    Http::fake([
        'https://nominatim.openstreetmap.org/search*' => Http::response([], 200),
    ]);

    $service = new GeocodingService;
    $service->geocode('Unknown place');
})->throws(GeocodingException::class);

it('throws GeocodingException when lat is not numeric', function () {
    Http::fake([
        'https://nominatim.openstreetmap.org/search*' => Http::response([
            [
                'lat' => '',
                'lon' => '-3.7037902',
                'display_name' => 'Invalid coordinates',
                'addresstype' => 'house',
                'importance' => 0.5,
            ],
        ], 200),
    ]);

    $service = new GeocodingService;
    $service->geocode('Invalid', 'Madrid', 'ES');
})->throws(GeocodingException::class);
