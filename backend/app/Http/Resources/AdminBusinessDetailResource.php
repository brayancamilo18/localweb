<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AdminBusinessDetailResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
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
            'instagram_url' => $this->instagram_url,
            'tiktok_url' => $this->tiktok_url,
            'facebook_url' => $this->facebook_url,
            'vcard_enabled' => (bool) $this->vcard_enabled,
            'schedule' => $this->schedule,
            'is_published' => (bool) $this->is_published,
            'plan' => is_object($this->plan) ? $this->plan->value : $this->plan,
            'plan_activated_at' => $this->plan_activated_at?->toIso8601String(),
            'onboarding_completed_at' => $this->onboarding_completed_at?->toIso8601String(),
            'deleted_at' => $this->deleted_at?->toIso8601String(),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
            'owner' => $this->when(
                $this->relationLoaded('owner'),
                fn () => $this->owner ? new UserResource($this->owner) : null,
            ),
            'template' => $this->whenLoaded('template', function () {
                return array_merge(
                    (new TemplateResource($this->template))->resolve(),
                    ['is_active' => (bool) $this->template->is_active],
                );
            }),
            'images' => $groupedImages,
            'services' => $this->whenLoaded(
                'services',
                fn () => BusinessServiceResource::collection($this->services)->resolve(),
            ),
        ];
    }
}
