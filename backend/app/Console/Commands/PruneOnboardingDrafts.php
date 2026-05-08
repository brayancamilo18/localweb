<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

/**
 * Limpieza periódica de borradores de onboarding huérfanos.
 *
 * Diferencias con onboarding:clean-orphaned-drafts (que se mantiene como red de seguridad):
 *  - Umbral más conservador (48h en lugar de 8h).
 *  - Mira la mtime más reciente de los archivos del directorio, no la del directorio en sí
 *    (porque modificar un archivo no siempre actualiza la mtime del padre en algunos FS).
 */
class PruneOnboardingDrafts extends Command
{
    protected $signature = 'onboarding:prune-drafts';

    protected $description = 'Borra directorios storage/app/private/onboarding/{userId} cuyo archivo más reciente tenga >48h.';

    public function handle(): int
    {
        $disk = Storage::disk('local');
        $root = 'onboarding';

        if (! $disk->exists($root)) {
            $this->info('No hay directorio de onboarding. Nada que hacer.');
            Log::info('Onboarding drafts pruned', ['directories_removed' => 0]);

            return self::SUCCESS;
        }

        $threshold = now()->subHours(48)->getTimestamp();
        $removed = 0;

        foreach ($disk->directories($root) as $relativeDir) {
            $userId = basename($relativeDir);
            if ($userId === '' || ! ctype_digit($userId)) {
                continue;
            }

            $files = $disk->allFiles($relativeDir);
            $latest = 0;

            foreach ($files as $file) {
                try {
                    $mtime = (int) $disk->lastModified($file);
                } catch (\Throwable) {
                    continue;
                }
                if ($mtime > $latest) {
                    $latest = $mtime;
                }
            }

            // Sin archivos (directorio vacío) lo consideramos también huérfano.
            if ($files !== [] && $latest > $threshold) {
                continue;
            }

            $disk->deleteDirectory($relativeDir);

            try {
                Cache::forget("onboarding:{$userId}");
            } catch (\Throwable $e) {
                Log::warning('Failed to forget onboarding cache after prune', [
                    'user_id' => $userId,
                    'message' => $e->getMessage(),
                ]);
            }

            $removed++;
        }

        Log::info('Onboarding drafts pruned', ['directories_removed' => $removed]);
        $this->info("Directorios de borrador eliminados: {$removed}");

        return self::SUCCESS;
    }
}
