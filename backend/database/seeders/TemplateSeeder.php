<?php

namespace Database\Seeders;

use App\Models\Business;
use App\Models\Template;
use Illuminate\Database\Seeder;

class TemplateSeeder extends Seeder
{
    public function run(): void
    {
        /*
         * Catálogo visible para onboarding / selector de plantilla.
         *
         * Por ahora sólo expone **Urban Bold** (`--lime` #D4FF3A); el resto se irá
         * activando añadiendo entradas aquí cuando cada plantilla esté lista.
         */
        $templates = [
            [
                'name' => 'Urban Bold',
                'slug' => 'urban-bold',
                'primary_color' => '#D4FF3A',
                'requires_pro' => false,
                'thumbnail_url' => null,
                'category' => 'bold',
                'suitable_sectors' => null,
                'sort_order' => 10,
                'featured' => true,
            ],
            [
                'name' => 'Noir Elite',
                'slug' => 'noir-elite',
                'primary_color' => '#C8A96E',
                'requires_pro' => false,
                'thumbnail_url' => null,
                'category' => 'elegant',
                'suitable_sectors' => null,
                'sort_order' => 20,
                'featured' => true,
            ],
            [
                'name' => 'Bloom Studio',
                'slug' => 'bloom-studio',
                'primary_color' => '#E8A0BF',
                'requires_pro' => false,
                'thumbnail_url' => null,
                'category' => 'soft',
                'suitable_sectors' => ['belleza', 'peluqueria', 'estetica', 'florista'],
                'sort_order' => 30,
                'featured' => true,
            ],
            [
                'name' => 'Coastal Calm',
                'slug' => 'coastal-calm',
                'primary_color' => '#5B9EA6',
                'requires_pro' => false,
                'thumbnail_url' => null,
                'category' => 'minimal',
                'suitable_sectors' => ['spa', 'yoga', 'bienestar', 'turismo'],
                'sort_order' => 40,
                'featured' => false,
            ],
            [
                'name' => 'Craft Pro',
                'slug' => 'craft-pro',
                'primary_color' => '#E8712A',
                'requires_pro' => false,
                'thumbnail_url' => null,
                'category' => 'warm',
                'suitable_sectors' => ['artesania', 'reformas', 'servicios'],
                'sort_order' => 50,
                'featured' => false,
            ],
            [
                'name' => 'Tavola Warm',
                'slug' => 'tavola-warm',
                'primary_color' => '#C8553D',
                'requires_pro' => true,
                'hero_photo_slots' => 3,
                'thumbnail_url' => null,
                'category' => 'warm',
                'suitable_sectors' => ['restauracion', 'cafeteria', 'panaderia'],
                'sort_order' => 60,
                'featured' => true,
            ],
            [
                'name' => 'Tech Sleek',
                'slug' => 'tech-sleek',
                'primary_color' => '#00E5FF',
                'requires_pro' => false,
                'thumbnail_url' => null,
                'category' => 'modern',
                'suitable_sectors' => ['tecnologia', 'consultoria', 'startup'],
                'sort_order' => 70,
                'featured' => false,
            ],
            [
                'name' => 'Trust Clinic',
                'slug' => 'trust-clinic',
                'primary_color' => '#2E86AB',
                'requires_pro' => false,
                'thumbnail_url' => null,
                'category' => 'minimal',
                'suitable_sectors' => ['clinica', 'dental', 'medico', 'veterinario'],
                'sort_order' => 80,
                'featured' => false,
            ],
            [
                'name' => 'Versa Studio',
                'slug' => 'versa-studio',
                'primary_color' => '#C7634D',
                'requires_pro' => true,
                'hero_photo_slots' => 3,
                'thumbnail_url' => null,
                'category' => 'modern',
                'suitable_sectors' => null,
                'sort_order' => 90,
                'featured' => false,
            ],
            [
                'name' => 'Mono Edito',
                'slug' => 'mono-edito',
                'primary_color' => '#E04E2C',
                'requires_pro' => true,
                'hero_photo_slots' => 3,
                'thumbnail_url' => null,
                'category' => 'minimal',
                'suitable_sectors' => ['fotografia', 'diseno', 'arquitectura'],
                'sort_order' => 100,
                'featured' => false,
            ],
            [
                'name' => 'Luxe Atelier',
                'slug' => 'luxe-atelier',
                'primary_color' => '#B68A50',
                'requires_pro' => true,
                'hero_photo_slots' => 3,
                'thumbnail_url' => null,
                'category' => 'elegant',
                'suitable_sectors' => ['belleza', 'moda', 'joyeria'],
                'sort_order' => 110,
                'featured' => false,
            ],
        ];

        $keepSlugs = array_column($templates, 'slug');

        foreach ($templates as $template) {
            Template::updateOrCreate(
                ['slug' => $template['slug']],
                $template + ['is_active' => true]
            );
        }

        /*
         * Limpieza de plantillas obsoletas: cualquier registro cuyo slug ya no figura
         * en la lista de arriba se considera retirado. Antes de borrarlo desvinculamos
         * cualquier negocio que lo estuviera usando para evitar romper la FK; el
         * negocio queda con `template_id = null` y el flujo de dashboard/admin permite
         * reasignarlo manualmente.
         */
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
