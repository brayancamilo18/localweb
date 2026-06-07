<?php

namespace App\Services;

use App\Exceptions\Auth\GeocodingException;
use Illuminate\Support\Facades\Http;

class GeocodingService
{
    private const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';

    /** @var array<string, int> */
    private const ADDRESSTYPE_PRIORITY = [
        'house' => 14,
        'building' => 13,
        'place' => 12,
        'address' => 11,
        'amenity' => 10,
        'shop' => 9,
        'road' => 8,
        'residential' => 7,
        'suburb' => 6,
        'neighbourhood' => 5,
        'village' => 4,
        'town' => 3,
        'city' => 2,
        'administrative' => 1,
    ];

    /** @var list<string> */
    private const EXACT_ADDRESSTYPES = ['house', 'building', 'place', 'address', 'amenity', 'shop'];

    /** @var list<string> */
    private const STREET_ADDRESSTYPES = ['road', 'residential'];

    public function geocode(
        string $address,
        ?string $city = null,
        ?string $countryCode = null,
    ): array {
        $address = trim($address);
        $city = $this->normalizeOptional($city);
        $countryCode = $this->normalizeCountryCode($countryCode);

        $results = [];

        if ($city !== null || $countryCode !== null) {
            $results = $this->searchStructured($address, $city, $countryCode);
        }

        if ($results === []) {
            $results = $this->searchFreeform($address, $city, $countryCode);
        }

        if ($results === []) {
            throw new GeocodingException('No se pudo localizar la dirección indicada.');
        }

        $best = $this->selectBestCandidate($results);
        $addresstype = isset($best['addresstype']) ? (string) $best['addresstype'] : null;

        return [
            'lat' => $this->parseCoordinate($best['lat'] ?? null),
            'lng' => $this->parseCoordinate($best['lon'] ?? null),
            'display_name' => (string) ($best['display_name'] ?? ''),
            'precision' => $this->resolvePrecision($addresstype),
            'addresstype' => $addresstype,
        ];
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function searchStructured(string $address, ?string $city, ?string $countryCode): array
    {
        $params = [
            'street' => $address,
            'format' => 'json',
            'addressdetails' => 1,
            'limit' => 5,
            'accept-language' => 'es',
        ];

        if ($city !== null) {
            $params['city'] = $city;
        }

        if ($countryCode !== null) {
            $params['countrycodes'] = strtolower($countryCode);
        }

        return $this->fetchResults($params);
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function searchFreeform(string $address, ?string $city, ?string $countryCode): array
    {
        $queryParts = array_filter([$address, $city], fn (?string $part) => $part !== null && $part !== '');
        $params = [
            'q' => implode(', ', $queryParts),
            'format' => 'json',
            'addressdetails' => 1,
            'limit' => 5,
            'accept-language' => 'es',
        ];

        if ($countryCode !== null) {
            $params['countrycodes'] = strtolower($countryCode);
        }

        return $this->fetchResults($params);
    }

    /**
     * @param  array<string, mixed>  $params
     * @return list<array<string, mixed>>
     */
    private function fetchResults(array $params): array
    {
        $response = Http::timeout(5)
            ->withHeaders([
                'User-Agent' => 'ONEZ/1.0 (app@onez.es)',
            ])
            ->get(self::NOMINATIM_URL, $params);

        $json = $response->json();

        if (! is_array($json)) {
            return [];
        }

        return array_values(array_filter($json, fn ($item) => is_array($item)));
    }

    /**
     * @param  list<array<string, mixed>>  $results
     * @return array<string, mixed>
     */
    private function selectBestCandidate(array $results): array
    {
        usort($results, function (array $a, array $b): int {
            $typeA = isset($a['addresstype']) ? (string) $a['addresstype'] : '';
            $typeB = isset($b['addresstype']) ? (string) $b['addresstype'] : '';

            $priorityA = self::ADDRESSTYPE_PRIORITY[$typeA] ?? 0;
            $priorityB = self::ADDRESSTYPE_PRIORITY[$typeB] ?? 0;

            if ($priorityA !== $priorityB) {
                return $priorityB <=> $priorityA;
            }

            $importanceA = (float) ($a['importance'] ?? 0);
            $importanceB = (float) ($b['importance'] ?? 0);

            return $importanceB <=> $importanceA;
        });

        return $results[0];
    }

    private function resolvePrecision(?string $addresstype): string
    {
        if ($addresstype !== null && in_array($addresstype, self::EXACT_ADDRESSTYPES, true)) {
            return 'exact';
        }

        if ($addresstype !== null && in_array($addresstype, self::STREET_ADDRESSTYPES, true)) {
            return 'street';
        }

        return 'area';
    }

    private function parseCoordinate(mixed $value): float
    {
        if (! is_numeric($value)) {
            throw new GeocodingException('No se pudo localizar la dirección indicada.');
        }

        $float = (float) $value;

        if (! is_finite($float)) {
            throw new GeocodingException('No se pudo localizar la dirección indicada.');
        }

        return $float;
    }

    private function normalizeOptional(?string $value): ?string
    {
        if ($value === null) {
            return null;
        }

        $trimmed = trim($value);

        return $trimmed === '' ? null : $trimmed;
    }

    private function normalizeCountryCode(?string $countryCode): ?string
    {
        $normalized = $this->normalizeOptional($countryCode);

        return $normalized !== null ? strtoupper($normalized) : null;
    }
}
