<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'is_admin' => (bool) $this->is_admin,
            'email_verified_at' => optional($this->email_verified_at)?->toIso8601String(),
            'terms_accepted_at' => optional($this->terms_accepted_at)?->toIso8601String(),
            'terms_version' => $this->terms_version,
            'privacy_policy_version' => $this->privacy_policy_version,
            'marketing_consent_at' => optional($this->marketing_consent_at)?->toIso8601String(),
        ];
    }
}
