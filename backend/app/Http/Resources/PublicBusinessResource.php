<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PublicBusinessResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $groupedImages = $this->images
            ? $this->images->groupBy('section')->map(fn ($items) => BusinessImageResource::collection($items)->resolve())
            : [];

        return [
            'id' => $this->id,
            'name' => $this->name,
            'subdomain' => $this->subdomain,
            'sector' => $this->sector,
            'logo_url' => $this->logo_url,
            'description' => $this->description,
            'tagline' => $this->tagline,
            'phone' => $this->phone,
            /** Email público de contacto del negocio (columna propia en
             * `businesses`). Independiente del email de login del owner. */
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
            'is_pro' => (bool) $this->is_pro,
            'whatsapp_url' => $this->whatsapp_url,
            'template' => $this->whenLoaded('template', fn () => new TemplateResource($this->template)),
            'images' => $groupedImages,
            'services' => $this->whenLoaded(
                'services',
                fn () => BusinessServiceResource::collection($this->services)->resolve(),
            ),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
