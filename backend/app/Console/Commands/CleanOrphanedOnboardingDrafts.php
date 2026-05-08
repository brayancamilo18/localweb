<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class CleanOrphanedOnboardingDrafts extends Command
{
    protected $signature = 'onboarding:clean-orphaned-drafts';

    protected $description = 'Elimina carpetas de borrador onboarding antiguas (>8h sin modificar) y vacía la caché Redis asociada';

    public function handle(): int
    {
        $disk = Storage::disk('local');
        $onboardingRoot = 'onboarding';

        if (! $disk->exists($onboardingRoot)) {
            Log::info('Orphaned onboarding drafts cleaned', ['directories_removed' => 0]);
            $this->info('Directorios de borrador eliminados: 0');

            return self::SUCCESS;
        }

        $threshold = now()->subHours(8)->getTimestamp();
        $removed = 0;

        foreach ($disk->directories($onboardingRoot) as $relativeDir) {
            $absolute = $disk->path($relativeDir);
            if (! is_dir($absolute)) {
                continue;
            }

            $mtime = @filemtime($absolute);
            if ($mtime === false || $mtime > $threshold) {
                continue;
            }

            $userId = basename($relativeDir);
            if ($userId === '' || $userId === '.' || $userId === '..' || ! ctype_digit($userId)) {
                continue;
            }

            $disk->deleteDirectory($relativeDir);
            try {
                Cache::forget("onboarding:{$userId}");
            } catch (\Throwable $e) {
                Log::warning('Failed to forget onboarding cache after directory cleanup', [
                    'user_id' => $userId,
                    'message' => $e->getMessage(),
                ]);
            }
            $removed++;
        }

        Log::info('Orphaned onboarding drafts cleaned', ['directories_removed' => $removed]);
        $this->info("Directorios de borrador eliminados: {$removed}");

        return self::SUCCESS;
    }
}
