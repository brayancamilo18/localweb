<?php

namespace App\Http\Requests\Admin;

use App\Enums\Plan;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Enum;

class UpdateBusinessRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $business = $this->route('business');

        return [
            'name' => ['sometimes', 'string', 'max:80'],
            'subdomain' => [
                'sometimes',
                'string',
                'max:63',
                'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/',
                Rule::unique('businesses', 'subdomain')->ignore($business->id),
            ],
            'subdomain_type' => ['sometimes', 'string', Rule::in(['random', 'custom'])],
            'sector' => ['sometimes', 'string', 'max:60'],
            'template_id' => ['sometimes', 'nullable', 'integer', 'exists:templates,id'],
            'logo_path' => ['sometimes', 'nullable', 'string', 'max:255'],
            'description' => ['sometimes', 'nullable', 'string', 'max:500'],
            'tagline' => ['sometimes', 'nullable', 'string', 'max:120'],
            'phone' => ['sometimes', 'nullable', 'string', 'max:30'],
            'address' => ['sometimes', 'nullable', 'string'],
            'lat' => ['sometimes', 'nullable', 'numeric'],
            'lng' => ['sometimes', 'nullable', 'numeric'],
            'schedule' => ['sometimes', 'nullable', 'array'],
            'is_published' => ['sometimes', 'boolean'],
            'plan' => ['sometimes', new Enum(Plan::class)],
            'plan_activated_at' => ['sometimes', 'nullable', 'date'],
            'onboarding_completed_at' => ['sometimes', 'nullable', 'date'],
            'google_maps_url' => ['sometimes', 'nullable', 'string', 'max:2048'],
            'google_business_url' => ['sometimes', 'nullable', 'string', 'max:2048'],
            'booking_url' => ['sometimes', 'nullable', 'string', 'max:2048'],
            'instagram_url' => ['sometimes', 'nullable', 'string', 'max:2048'],
            'tiktok_url' => ['sometimes', 'nullable', 'string', 'max:2048'],
            'facebook_url' => ['sometimes', 'nullable', 'string', 'max:2048'],
            'vcard_enabled' => ['sometimes', 'boolean'],
        ];
    }
}
