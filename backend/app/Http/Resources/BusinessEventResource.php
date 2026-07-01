<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class BusinessEventResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'event_date' => $this->event_date?->toIso8601String(),
            'location' => $this->location,
            'description' => $this->description,
            'image_url' => $this->image_url,
        ];
    }
}
