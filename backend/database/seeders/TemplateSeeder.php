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
            ['name' => 'Urban Bold', 'slug' => 'urban-bold', 'primary_color' => '#D4FF3A', 'requires_pro' => false],
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
