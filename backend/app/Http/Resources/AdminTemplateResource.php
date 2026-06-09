<?php

namespace App\Http\Resources;

use App\Support\R2PublicUrl;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AdminTemplateResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'slug' => $this->slug,
            'primary_color' => $this->primary_color,
            'is_active' => (bool) $this->is_active,
            'requires_pro' => (bool) $this->requires_pro,
            'hero_photo_slots' => (int) ($this->hero_photo_slots ?? 1),
            'thumbnail_url' => R2PublicUrl::forPath($this->thumbnail_url),
            'thumbnail_status' => $this->thumbnail_status ?? 'pending',
            'thumbnail_generated_at' => $this->thumbnail_generated_at?->toIso8601String(),
            'category' => $this->category,
            'suitable_sectors' => (array) ($this->suitable_sectors ?: []),
            'sort_order' => (int) $this->sort_order,
            'featured' => (bool) $this->featured,
            'total_usage' => (int) ($this->total_usage ?? 0),
        ];
    }
}
