<?php

namespace App\Jobs;

use App\Models\Template;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Intervention\Image\Drivers\Gd\Driver as GdDriver;
use Intervention\Image\Drivers\Imagick\Driver as ImagickDriver;
use Intervention\Image\ImageManager;
use Spatie\Browsershot\Browsershot;
use Spatie\Multitenancy\Jobs\NotTenantAware;

/**
 * Genera la miniatura (captura del hero) de una plantilla con Browsershot,
 * la codifica a webp, la sube a R2 y guarda la ruta en templates.thumbnail_url.
 *
 * Importante: las escrituras sobre el Template se hacen con saveQuietly() para no
 * disparar de nuevo TemplateObserver (que despacha este mismo job) y evitar bucles.
 */
class GenerateTemplateThumbnail implements NotTenantAware, ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public int $tries = 3;

    public array $backoff = [30, 120];

    public function __construct(public int $templateId) {}

    public function handle(): void
    {
        $template = Template::find($this->templateId);
        if (! $template) {
            return;
        }

        /** @var array<string,mixed> $cfg */
        $cfg = config('templates.thumbnails');

        $url = sprintf(
            '%s/templates/%s.html?v=5&embed=1&preview=1&landingDemo=1',
            $cfg['base_url'],
            $template->slug,
        );

        try {
            $png = $this->capture($url, $cfg);
            $webp = $this->encodeWebp($png, (int) $cfg['webp_quality']);

            $path = sprintf(
                '%s/%s/thumb-%s.webp',
                $cfg['path_prefix'],
                $template->slug,
                substr(md5($webp), 0, 10),
            );

            /** @var \Illuminate\Filesystem\FilesystemAdapter $disk */
            $disk = Storage::disk($cfg['disk']);

            $previous = $template->thumbnail_url;

            $disk->put($path, $webp, [
                'visibility' => 'public',
                'ContentType' => 'image/webp',
            ]);

            $template->forceFill([
                'thumbnail_url' => $path,
                'thumbnail_status' => 'ready',
                'thumbnail_generated_at' => now(),
            ])->saveQuietly();

            // Borrar la captura anterior (si existía y cambió de ruta) para no acumular objetos.
            if ($previous && $previous !== $path && $disk->exists($previous)) {
                $disk->delete($previous);
            }
        } catch (\Throwable $e) {
            Log::warning('GenerateTemplateThumbnail: fallo al generar miniatura', [
                'template' => $template->slug,
                'error' => $e->getMessage(),
            ]);

            $template->forceFill(['thumbnail_status' => 'failed'])->saveQuietly();

            throw $e;
        }
    }

    /**
     * @param  array<string,mixed>  $cfg
     */
    private function capture(string $url, array $cfg): string
    {
        $browsershot = Browsershot::url($url)
            ->windowSize((int) $cfg['width'], (int) $cfg['height'])
            ->deviceScaleFactor(1)
            ->waitUntilNetworkIdle()
            ->setDelay((int) $cfg['settle_ms'])
            ->timeout((int) $cfg['timeout_s'])
            ->ignoreHttpsErrors();

        if (! empty($cfg['no_sandbox'])) {
            $browsershot->noSandbox();
        }
        if (! empty($cfg['node_binary'])) {
            $browsershot->setNodeBinary($cfg['node_binary']);
        }
        if (! empty($cfg['npm_binary'])) {
            $browsershot->setNpmBinary($cfg['npm_binary']);
        }
        if (! empty($cfg['node_module_path'])) {
            $browsershot->setNodeModulePath($cfg['node_module_path']);
        }
        if (! empty($cfg['chrome_path'])) {
            $browsershot->setChromePath($cfg['chrome_path']);
        }

        return $browsershot->screenshot();
    }

    private function encodeWebp(string $png, int $quality): string
    {
        $manager = extension_loaded('imagick')
            ? new ImageManager(new ImagickDriver)
            : new ImageManager(new GdDriver);

        return $manager->decodeBinary($png)
            ->encodeUsingFileExtension('webp', $quality)
            ->toString();
    }
}
