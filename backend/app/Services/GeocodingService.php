<?php

namespace App\Services;

use App\Exceptions\Auth\GeocodingException;
use Illuminate\Support\Facades\Http;

class GeocodingService
{
    public function geocode(string $address): array
    {
        $response = Http::withHeaders([
            'User-Agent' => 'LocalWeb/1.0 (localweb@app.com)',
        ])->get('https://nominatim.openstreetmap.org/search', [
            'q' => $address,
            'format' => 'json',
            'limit' => 1,
        ]);

        $item = $response->json()[0] ?? null;

        if (! is_array($item)) {
            throw new GeocodingException('No se pudo localizar la dirección indicada.');
        }

        return [
            'lat' => (float) ($item['lat'] ?? 0),
            'lng' => (float) ($item['lon'] ?? 0),
            'display_name' => (string) ($item['display_name'] ?? ''),
        ];
    }
}
