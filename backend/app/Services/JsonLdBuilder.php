<?php

namespace App\Services;

use App\Models\Business;

class JsonLdBuilder
{
    private const DAY_MAP = [
        'mon' => 'Monday',
        'tue' => 'Tuesday',
        'wed' => 'Wednesday',
        'thu' => 'Thursday',
        'fri' => 'Friday',
        'sat' => 'Saturday',
        'sun' => 'Sunday',
    ];

    public function build(Business $business): string
    {
        $data = [
            '@context' => 'https://schema.org',
            '@type' => $this->resolveType((string) $business->sector),
            'name' => $business->name,
            'description' => $business->description,
            'url' => 'https://'.$business->subdomain.'.'.config('localweb.domains.tenant_suffix').'/',
            'telephone' => $business->phone,
            'email' => $business->email,
        ];

        $logo = $this->buildLogo($business);
        if ($logo !== null) {
            $data['logo'] = $logo;
        }

        $images = $this->buildImages($business);
        if ($images !== []) {
            $data['image'] = $images;
        }

        $address = $this->buildAddress($business);
        if ($address !== null) {
            $data['address'] = $address;
        }

        $geo = $this->buildGeo($business);
        if ($geo !== null) {
            $data['geo'] = $geo;
        }

        if (is_string($business->google_maps_url) && trim($business->google_maps_url) !== '') {
            $data['hasMap'] = $business->google_maps_url;
        }

        $openingHours = $this->buildOpeningHours($business);
        if ($openingHours !== []) {
            $data['openingHoursSpecification'] = $openingHours;
        }

        $sameAs = $this->buildSameAs($business);
        if ($sameAs !== []) {
            $data['sameAs'] = $sameAs;
        }

        return json_encode(
            $this->filterEmpty($data),
            JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT
        );
    }

    private function resolveType(string $sector): string
    {
        $sector = strtolower(trim($sector));

        return match (true) {
            in_array($sector, ['restauracion', 'restaurante', 'cafeteria', 'bar', 'panaderia', 'pasteleria', 'heladeria']) => 'FoodEstablishment',
            in_array($sector, ['peluqueria', 'barberia', 'belleza', 'estetica', 'spa', 'masajes', 'nail']) => 'HealthAndBeautyBusiness',
            in_array($sector, ['clinica', 'medico', 'dentista', 'dental', 'veterinario', 'fisioterapia', 'psicologia', 'optica']) => 'MedicalBusiness',
            in_array($sector, ['hotel', 'hostal', 'pension', 'alojamiento', 'turismo', 'apartamento']) => 'LodgingBusiness',
            in_array($sector, ['gimnasio', 'yoga', 'pilates', 'crossfit', 'deporte', 'fitness']) => 'SportsActivityLocation',
            in_array($sector, ['tienda', 'comercio', 'moda', 'ropa', 'calzado', 'joyeria', 'optica', 'libreria']) => 'Store',
            in_array($sector, ['automocion', 'taller', 'neumaticos', 'concesionario']) => 'AutomotiveBusiness',
            in_array($sector, ['inmobiliaria', 'arquitectura', 'reformas', 'construccion', 'fontaneria', 'electricidad', 'carpinteria', 'cerrajeria', 'pintura', 'limpieza', 'jardineria']) => 'HomeAndConstructionBusiness',
            in_array($sector, ['educacion', 'academia', 'escuela', 'idiomas', 'formacion']) => 'EducationalOrganization',
            in_array($sector, ['abogado', 'notaria', 'asesoria', 'consultoria', 'contabilidad', 'gestion']) => 'ProfessionalService',
            default => 'LocalBusiness',
        };
    }

    private function buildLogo(Business $business): ?array
    {
        $logoUrl = $business->logo_url;
        if ($logoUrl === null) {
            return null;
        }

        $logo = $this->filterEmpty([
            '@type' => 'ImageObject',
            'url' => $logoUrl,
        ]);

        return $logo === [] ? null : $logo;
    }

    /**
     * @return list<string>
     */
    private function buildImages(Business $business): array
    {
        $images = [];

        if (! $business->relationLoaded('images')) {
            return $images;
        }

        foreach ($business->images as $img) {
            if (in_array($img->section, ['cover', 'gallery'], true)) {
                $url = $img->url;
                if (is_string($url) && trim($url) !== '') {
                    $images[] = $url;
                }
            }
            if (count($images) >= 10) {
                break;
            }
        }

        return $images;
    }

    private function buildAddress(Business $business): ?array
    {
        if ($business->address === null && $business->city === null) {
            return null;
        }

        $address = $this->filterEmpty([
            '@type' => 'PostalAddress',
            'streetAddress' => $business->address,
            'addressLocality' => $business->city,
            'addressCountry' => $business->country_code,
        ]);

        return $address === [] ? null : $address;
    }

    private function buildGeo(Business $business): ?array
    {
        if ($business->lat === null || $business->lng === null) {
            return null;
        }

        $geo = $this->filterEmpty([
            '@type' => 'GeoCoordinates',
            'latitude' => $business->lat,
            'longitude' => $business->lng,
        ]);

        return $geo === [] ? null : $geo;
    }

    /**
     * @return list<array<string, string>>
     */
    private function buildOpeningHours(Business $business): array
    {
        $schedule = $business->schedule;
        if (! is_array($schedule)) {
            return [];
        }

        $specs = [];

        foreach (self::DAY_MAP as $key => $dayName) {
            if (! isset($schedule[$key]) || ! is_array($schedule[$key])) {
                continue;
            }

            $day = $schedule[$key];

            if (($day['closed'] ?? false) === true) {
                continue;
            }

            $opens = $day['open'] ?? null;
            $closes = $day['close'] ?? null;

            if (! is_string($opens) || trim($opens) === '' || ! is_string($closes) || trim($closes) === '') {
                continue;
            }

            $specs[] = $this->filterEmpty([
                '@type' => 'OpeningHoursSpecification',
                'dayOfWeek' => 'https://schema.org/'.$dayName,
                'opens' => $opens,
                'closes' => $closes,
            ]);
        }

        return $specs;
    }

    /**
     * @return list<string>
     */
    private function buildSameAs(Business $business): array
    {
        return array_values(array_filter([
            $business->instagram_url,
            $business->tiktok_url,
            $business->facebook_url,
            $business->google_business_url,
        ], fn ($url) => is_string($url) && trim($url) !== ''));
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    private function filterEmpty(array $data): array
    {
        return array_filter($data, function ($value) {
            if ($value === null) {
                return false;
            }
            if (is_string($value) && trim($value) === '') {
                return false;
            }
            if (is_array($value) && count($value) === 0) {
                return false;
            }

            return true;
        });
    }
}
