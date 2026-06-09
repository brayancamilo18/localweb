<?php

namespace App\Console\Commands;

use App\Jobs\GenerateTemplateThumbnail;
use App\Models\Template;
use Illuminate\Console\Command;

/**
 * Genera (o regenera) las miniaturas de las plantillas.
 *
 *   php artisan templates:thumbnails            # todas
 *   php artisan templates:thumbnails urban-bold # una sola
 *   php artisan templates:thumbnails --sync     # ejecuta en proceso (sin cola)
 *   php artisan templates:thumbnails --reset    # limpia thumbnail_url antes de regenerar
 */
class GenerateTemplateThumbnails extends Command
{
    protected $signature = 'templates:thumbnails {slug? : Slug de una plantilla concreta} {--sync : Ejecutar de forma síncrona en vez de encolar} {--reset : Limpiar thumbnail_url/status antes de generar}';

    protected $description = 'Genera capturas webp del hero de las plantillas y las publica en R2 (thumbnail_url).';

    public function handle(): int
    {
        $query = Template::query();
        if ($slug = $this->argument('slug')) {
            $query->where('slug', $slug);
        }

        $templates = $query->orderBy('slug')->get();

        if ($templates->isEmpty()) {
            $this->warn('No se encontraron plantillas'.($slug ? " con slug «{$slug}»" : '').'.');

            return self::FAILURE;
        }

        $sync = (bool) $this->option('sync');

        if ($this->option('reset')) {
            foreach ($templates as $template) {
                $template->forceFill([
                    'thumbnail_url' => null,
                    'thumbnail_status' => 'pending',
                    'thumbnail_generated_at' => null,
                ])->saveQuietly();
            }
            $this->line('· Miniaturas reseteadas en BD.');
        }

        foreach ($templates as $template) {
            if ($sync) {
                $this->line("· Generando {$template->slug}...");
                GenerateTemplateThumbnail::dispatchSync($template->id);
                $template->refresh();
                $this->line("  → {$template->thumbnail_status} ({$template->thumbnail_url})");
            } else {
                GenerateTemplateThumbnail::dispatch($template->id);
                $this->line("· Encolada miniatura de {$template->slug}");
            }
        }

        $this->info(($sync ? 'Generadas' : 'Encoladas').' '.$templates->count().' miniatura(s).');

        return self::SUCCESS;
    }
}
