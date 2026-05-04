<?php

namespace Database\Seeders;

use App\Models\Business;
use App\Models\Template;
use Illuminate\Database\Seeder;

class TemplateSeeder extends Seeder
{
    public function run(): void
    {
        $keepSlugs = ['noir-elite', 'bloom-studio'];

        $templates = [
            ['name' => 'Noir Elite', 'slug' => 'noir-elite', 'primary_color' => '#C9A84C', 'requires_pro' => false],
            ['name' => 'Bloom Studio', 'slug' => 'bloom-studio', 'primary_color' => '#E8572A', 'requires_pro' => false],
        ];

        foreach ($templates as $template) {
            Template::updateOrCreate(
                ['slug' => $template['slug']],
                $template + ['is_active' => true]
            );
        }

        $idsToRemove = Template::query()
            ->whereNotIn('slug', $keepSlugs)
            ->pluck('id');

        if ($idsToRemove->isNotEmpty()) {
            Business::query()
                ->whereIn('template_id', $idsToRemove)
                ->update(['template_id' => null]);

            Template::query()
                ->whereIn('id', $idsToRemove)
                ->delete();
        }
    }
}
