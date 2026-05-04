<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class BusinessResource extends JsonResource
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
            'subdomain_type' => $this->subdomain_type,
            'sector' => $this->sector,
            'template_id' => $this->template_id,
            'logo_path' => $this->logo_path,
            'logo_url' => $this->logo_url,
            'description' => $this->description,
            'tagline' => $this->tagline,
            'phone' => $this->phone,
            'address' => $this->address,
            'lat' => $this->lat,
            'lng' => $this->lng,
            'google_maps_url' => $this->google_maps_url,
            'google_business_url' => $this->google_business_url,
            'booking_url' => $this->booking_url,
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
}
