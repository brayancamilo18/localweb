<?php

namespace App\Http\Resources;

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
            'total_usage' => (int) ($this->total_usage ?? 0),
        ];
    }
}
