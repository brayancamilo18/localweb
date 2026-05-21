<?php

namespace Database\Factories;

use App\Models\Business;
use App\Models\Template;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Business>
 */
class BusinessFactory extends Factory
{
    protected $model = Business::class;

    public function definition(): array
    {
        return [
            'name' => fake()->company(),
            'subdomain' => 'biz-'.fake()->unique()->lexify('????????'),
            'subdomain_type' => 'random',
            'sector' => 'otros',
            'template_id' => null,
            'logo_path' => null,
            'description' => fake()->optional()->sentence(),
            'tagline' => fake()->optional()->catchPhrase(),
            'phone' => fake()->optional()->e164PhoneNumber(),
            'email' => fake()->optional()->safeEmail(),
            'address' => fake()->optional()->streetAddress(),
            'city' => fake()->optional()->city(),
            'country' => fake()->optional()->country(),
            'country_code' => fake()->optional()->countryCode(),
            'lat' => null,
            'lng' => null,
            'schedule' => null,
            'is_published' => false,
            'plan' => 'free',
            'plan_activated_at' => null,
            'google_maps_url' => null,
            'google_business_url' => null,
            'booking_url' => null,
            'vcard_enabled' => false,
            'instagram_url' => null,
            'tiktok_url' => null,
            'facebook_url' => null,
        ];
    }

    public function published(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_published' => true,
        ]);
    }

    public function withTemplate(?Template $template = null): static
    {
        return $this->state(function () use ($template) {
            if ($template === null) {
                $template = Template::query()->firstOrCreate(
                    ['slug' => 'urban-bold'],
                    [
                        'name' => 'Urban Bold',
                        'primary_color' => '#E55A3C',
                        'is_active' => true,
                        'requires_pro' => false,
                        'hero_photo_slots' => 1,
                        'sort_order' => 10,
                    ]
                );
            }

            return ['template_id' => $template->id];
        });
    }
}
