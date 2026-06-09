<?php

namespace App\Observers;

use App\Jobs\GenerateTemplateThumbnail;
use App\Models\Template;

/**
 * Regenera la miniatura de la plantilla cuando se crea o cuando cambia su `slug`
 * (es decir, cambia el HTML de origen). Los toggles de is_active/requires_pro NO
 * regeneran. Las escrituras del propio job usan saveQuietly() y no llegan aquí,
 * evitando bucles.
 */
class TemplateObserver
{
    public function created(Template $template): void
    {
        $this->dispatchThumbnail($template);
    }

    public function updated(Template $template): void
    {
        if ($template->wasChanged('slug')) {
            $this->dispatchThumbnail($template);
        }
    }

    private function dispatchThumbnail(Template $template): void
    {
        // En tests (cola sync, sin navegador) no lanzamos Browsershot. Quien necesite
        // probar el despacho debe usar Queue::fake() explícitamente.
        if (app()->runningUnitTests()) {
            return;
        }

        $template->forceFill(['thumbnail_status' => 'pending'])->saveQuietly();
        GenerateTemplateThumbnail::dispatch($template->id);
    }
}
