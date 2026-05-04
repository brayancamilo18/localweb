<?php

namespace App\Console\Commands;

use App\Models\BusinessImage;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;

class SyncBusinessImagesToObjectStorage extends Command
{
    protected $signature = 'business-images:sync-to-object-storage {--dry-run : Solo listar, no subir}';

    protected $description = 'Sube a MinIO/S3 las imágenes que quedaron en disco local (r2-local) para que coincidan con la base de datos';

    public function handle(): int
    {
        if (config('filesystems.disks.r2.driver') !== 's3') {
            $this->error('El disco r2 no es S3. Configura AWS_ACCESS_KEY_ID, AWS_ENDPOINT, AWS_BUCKET y AWS_URL (MinIO).');
            $this->line('Mientras r2 apunte a disco local, la API generará URLs a MinIO pero los bytes no existirán allí (404).');

            return self::FAILURE;
        }

        $remote = Storage::disk('r2');
        $legacy = Storage::disk('r2_legacy_local');
        $dry = (bool) $this->option('dry-run');

        $ok = 0;
        $skip = 0;
        $missing = 0;
        $rows = BusinessImage::query()->orderBy('id');

        /** @var BusinessImage $image */
        foreach ($rows->cursor() as $image) {
            $path = $image->path;
            if ($path === '' || $path === '0') {
                continue;
            }

            if ($remote->exists($path)) {
                $skip++;

                continue;
            }

            if (! $legacy->exists($path)) {
                $this->warn("Sin archivo local ni en bucket: id={$image->id} path={$path}");
                $missing++;

                continue;
            }

            if ($dry) {
                $this->line("[dry-run] subiría: {$path}");
                $ok++;

                continue;
            }

            $body = $legacy->get($path);
            $remote->put($path, $body, ['visibility' => 'public']);
            $this->info("Subido: {$path}");
            $ok++;
        }

        $this->newLine();
        $this->info("Listo. En bucket: {$skip} ya existían, {$ok} ".($dry ? 'pendientes' : 'subidos').", {$missing} sin fichero local.");
        if (! $dry && $ok > 0) {
            $this->line('Vacía la caché de páginas públicas: php artisan cache:clear');
        }

        return self::SUCCESS;
    }
}
