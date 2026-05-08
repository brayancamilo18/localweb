<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AdminBusinessResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'subdomain' => $this->subdomain,
            'sector' => $this->sector,
            'plan' => is_object($this->plan) ? $this->plan->value : $this->plan,
            'is_published' => (bool) $this->is_published,
            'onboarding_completed_at' => $this->onboarding_completed_at?->toIso8601String(),
            'deleted_at' => $this->deleted_at?->toIso8601String(),
            'created_at' => $this->created_at?->toIso8601String(),
            'owner_email' => $this->owner_email,
            'total_visits' => (int) ($this->total_visits ?? 0),
        ];
    }
}
