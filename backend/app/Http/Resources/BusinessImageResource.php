<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class BusinessImageResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'url' => $this->url,
            'section' => $this->section,
            'display_order' => $this->display_order,
            'width' => $this->width,
            'height' => $this->height,
        ];
    }
}
