<?php

namespace Database\Factories;

use App\Models\Template;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Template>
 */
class TemplateFactory extends Factory
{
    protected $model = Template::class;

    public function definition(): array
    {
        $slug = 'tpl-'.fake()->unique()->lexify('????????');

        return [
            'name' => fake()->words(2, true),
            'slug' => $slug,
            'primary_color' => '#E55A3C',
            'is_active' => true,
            'requires_pro' => false,
            'hero_photo_slots' => 1,
            'sort_order' => 10,
        ];
    }
}
