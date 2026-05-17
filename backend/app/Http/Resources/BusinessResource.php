<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class BusinessResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $groupedImages = $this->normalizeGroupedImages();

        return [
            'id' => $this->id,
            'name' => $this->name,
            'subdomain' => $this->subdomain,
            'subdomain_type' => $this->subdomain_type,
            'sector' => $this->sector,
            'template_id' => $this->template_id,
            'logo_path' => $this->logo_path,
            'logo_url' => $this->logo_url,
            'description' => $this->description,
            'tagline' => $this->tagline,
            'phone' => $this->phone,
            /** Email público de contacto del negocio (columna propia en
             * `businesses`, no derivado del owner): el usuario quiere poder
             * mostrar en la web pública un correo distinto al de su login. */
            'email' => $this->email,
            'address' => $this->address,
            'city' => $this->city,
            'country' => $this->country,
            'country_code' => $this->country_code,
            'lat' => $this->lat,
            'lng' => $this->lng,
            'google_maps_url' => $this->google_maps_url,
            'google_business_url' => $this->google_business_url,
            'booking_url' => $this->booking_url,
            'instagram_url' => $this->instagram_url,
            'tiktok_url' => $this->tiktok_url,
            'facebook_url' => $this->facebook_url,
            'vcard_enabled' => (bool) $this->vcard_enabled,
            'schedule' => $this->schedule,
            'is_published' => $this->is_published,
            'plan' => is_object($this->plan) ? $this->plan->value : $this->plan,
            'plan_activated_at' => $this->plan_activated_at,
            'onboarding_completed_at' => $this->onboarding_completed_at,
            'is_free' => $this->is_free,
            'is_pro' => $this->is_pro,
            'template' => $this->whenLoaded('template', fn () => new TemplateResource($this->template)),
            'images' => $groupedImages,
            'services' => $this->whenLoaded(
                'services',
                fn () => BusinessServiceResource::collection($this->services)->resolve(),
            ),
            'stats' => $this->when(isset($this->stats), $this->stats),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }

    /**
     * @return array{cover: array, gallery: array, about: array}
     */
    private function normalizeGroupedImages(): array
    {
        $sections = ['cover', 'gallery', 'about'];
        $grouped = $this->images
            ? $this->images->groupBy('section')->map(
                fn ($items) => BusinessImageResource::collection($items)->resolve(),
            )->all()
            : [];

        $out = [];
        foreach ($sections as $section) {
            $out[$section] = $grouped[$section] ?? [];
        }

        return $out;
    }
}
