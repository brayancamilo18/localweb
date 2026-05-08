<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AdminUserResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'email_verified_at' => $this->email_verified_at?->toIso8601String(),
            'is_admin' => (bool) $this->is_admin,
            'business' => $this->business
                ? [
                    'id' => $this->business->id,
                    'name' => $this->business->name,
                    'subdomain' => $this->business->subdomain,
                ]
                : null,
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
