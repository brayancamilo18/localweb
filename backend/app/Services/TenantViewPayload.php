<?php

namespace App\Services;

use App\Models\Business;
use Illuminate\Support\Collection;

class TenantViewPayload
{
    public function build(Business $business): array
    {
        $palette = app(\App\Services\TemplatePalette::class);
        $brandVariable = $palette->cssVariableFor($business->template);
        $brandColor = $palette->brandColorForPublicView($business);
        $subdomain = (string) $business->subdomain;
        $apiBaseUrl = rtrim((string) config('app.url'), '/');

        return [
            'business' => $business,
            'logo_url' => $business->logo_url,
            'logo_scale' => filled($business->logo_url)
                ? (float) config('localweb.default_logo_nav_scale', 1.35)
                : null,
            'nombre' => $business->name,
            'tagline' => $business->tagline ?? '',
            'telefono' => $business->phone ?? '',
            'whatsapp' => preg_replace('/\D+/', '', $business->phone ?? '') ?: '',
            'portada' => $this->coverUrl($business, 0),
            'portada_2' => $this->coverUrl($business, 1),
            'portada_3' => $this->coverUrl($business, 2),
            'descripcion' => $business->description ?? '',
            'about_title' => $business->about_title ?? '',
            'about_sections_count' => (int) ($business->about_sections_count ?? 1),
            'about_sections' => $this->aboutSectionsPayload($business),
            'foto_equipo' => $this->aboutUrl($business, 0),
            'direccion' => $business->address ?? '',
            'ciudad' => $business->city ?? '',
            'pais' => $business->country ?? '',
            'anio_fundacion' => $business->created_at
                ? $business->created_at->format('Y')
                : '',
            'correo' => $business->email ?? '',
            'galeria' => $this->galleryUrls($business),
            'horario' => $business->schedule,
            'map_lat' => $business->lat,
            'map_lon' => $business->lng,
            'services' => $this->servicesPayload($business),
            'google_maps_url' => $this->googleMapsUrl($business),
            'google_business_url' => $business->google_business_url ?? '',
            'booking_url' => $business->booking_url ?? '',
            'vcard_enabled' => (bool) $business->vcard_enabled,
            'is_pro' => $business->is_pro,
            'brand_color' => $brandColor,
            'brand_variable' => $brandVariable,
            'subdomain' => $subdomain,
            'api_base_url' => $apiBaseUrl,
            'vcard_download_url' => $apiBaseUrl.'/api/v1/public/'.$subdomain.'/vcard',
            'instagram_url' => $this->socialUrl($business->instagram_url, 'instagram'),
            'tiktok_url' => $this->socialUrl($business->tiktok_url, 'tiktok'),
            'facebook_url' => $this->socialUrl($business->facebook_url, 'facebook'),
        ];
    }

    private function imagesGrouped(Business $business): Collection
    {
        if (! $business->relationLoaded('images')) {
            return collect();
        }

        return $business->images
            ->sortBy('display_order')
            ->groupBy('section');
    }

    private function coverUrl(Business $business, int $index): string
    {
        $cover = $this->imagesGrouped($business)->get('cover', collect())->values();

        return (string) ($cover->get($index)?->url ?? '');
    }

    private function aboutUrl(Business $business, int $index): string
    {
        $about = $this->imagesGrouped($business)->get('about', collect())->values();

        return (string) ($about->get($index)?->url ?? '');
    }

    /**
     * @return list<string>
     */
    private function galleryUrls(Business $business): array
    {
        if (! $business->relationLoaded('images')) {
            return [];
        }

        return $this->imagesGrouped($business)
            ->get('gallery', collect())
            ->values()
            ->map(fn ($image) => (string) $image->url)
            ->filter()
            ->values()
            ->all();
    }

    /**
     * @return list<array{title: string, description: string, image_url: string}>
     */
    private function aboutSectionsPayload(Business $business): array
    {
        if (! $business->relationLoaded('aboutSections')) {
            return [];
        }

        return $business->aboutSections
            ->map(fn ($section) => [
                'title' => $section->title ?? '',
                'description' => $section->description ?? '',
                'image_url' => $section->image_url ?? '',
            ])
            ->values()
            ->all();
    }

    /**
     * @return list<array{name: string, price: float|null, description: string|null}>
     */
    private function servicesPayload(Business $business): array
    {
        if (! $business->relationLoaded('services')) {
            return [];
        }

        return $business->services
            ->map(fn ($service) => [
                'name' => $service->name,
                'price' => is_null($service->price) ? null : (float) $service->price,
                'description' => $service->description,
            ])
            ->values()
            ->all();
    }

    private function googleMapsUrl(Business $business): string
    {
        $manual = trim((string) ($business->google_maps_url ?? ''));
        if ($manual !== '') {
            return $manual;
        }

        $address = trim((string) ($business->address ?? ''));
        $city = trim((string) ($business->city ?? ''));
        if ($address !== '' && $city !== '') {
            return 'https://www.google.com/maps/dir/?api=1&destination='.urlencode($address.', '.$city);
        }

        return '';
    }

    private function socialUrl(?string $url, string $key): string
    {
        $trimmed = trim((string) ($url ?? ''));
        if ($trimmed !== '') {
            return $trimmed;
        }

        return (string) config('localweb.default_social.'.$key);
    }
}
