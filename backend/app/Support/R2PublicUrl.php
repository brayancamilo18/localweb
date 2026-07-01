<?php

namespace App\Support;

use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\URL;

/**
 * URLs públicas de objetos en el disco `r2`.
 *
 * En producción, AWS_URL debe ser la URL CDN pública (navegador). Si apunta a
 * localhost/MinIO interno, generamos URL vía proxy de la API (/api/v1/media/…).
 */
final class R2PublicUrl
{
    public static function forPath(?string $path): ?string
    {
        if ($path === null || $path === '') {
            return null;
        }

        $path = ltrim($path, '/');

        try {
            /** @var \Illuminate\Filesystem\FilesystemAdapter $disk */
            $disk = Storage::disk('r2');
            $direct = $disk->url($path);
        } catch (\Throwable $e) {
            Log::warning('R2PublicUrl: no se pudo generar URL directa', [
                'path' => $path,
                'error' => $e->getMessage(),
            ]);

            return self::proxyUrl($path);
        }

        if (! is_string($direct) || $direct === '') {
            return self::proxyUrl($path);
        }

        if (self::mustUseProxy($direct)) {
            return self::proxyUrl($path);
        }

        return self::ensureHttpsInProduction($direct);
    }

    public static function proxyUrl(string $path): string
    {
        return URL::route('media.show', ['path' => $path], absolute: true);
    }

    public static function isAllowedPath(string $path): bool
    {
        if ($path === '' || str_contains($path, '..')) {
            return false;
        }

        if (preg_match('#^businesses/\d+/(cover|gallery|about|about_sections|events|logo|favicon)/#', $path)) {
            return true;
        }

        // Miniaturas de plantillas: templates/{slug}/thumb-{hash}.webp
        return (bool) preg_match('#^templates/[a-z0-9-]+/thumb[a-z0-9.\-]*\.webp$#i', $path);
    }

    private static function mustUseProxy(string $url): bool
    {
        if (filter_var($url, FILTER_VALIDATE_URL) === false) {
            return true;
        }

        $host = strtolower((string) parse_url($url, PHP_URL_HOST));

        if ($host === '') {
            return true;
        }

        if (in_array($host, ['localhost', '127.0.0.1', 'minio', 'nginx', 'php'], true)) {
            return true;
        }

        if (str_ends_with($host, '.local') || str_ends_with($host, '.internal')) {
            return true;
        }

        // IPs privadas (MinIO/docker en la red interna del VPS).
        if (preg_match('/^(10|127|192\.168|172\.(1[6-9]|2\d|3[01]))\./', $host)) {
            return true;
        }

        return (bool) config('filesystems.disks.r2.force_proxy', false);
    }

    private static function ensureHttpsInProduction(string $url): string
    {
        if (! app()->environment('production')) {
            return $url;
        }

        if (str_starts_with($url, 'http://')) {
            return 'https://'.substr($url, 7);
        }

        return $url;
    }
}
