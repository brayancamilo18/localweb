<?php

namespace App\Support;

use App\Models\Business;
use Illuminate\Support\Facades\Cache;

/**
 * Helper para invalidar el cache de la página pública (clave "public_page:{subdomain}").
 *
 * Llamar siempre que se modifique algo que se sirva en GET /api/v1/public/{subdomain}.
 * En la práctica, esto se hace automáticamente vía los observers
 * (BusinessObserver, BusinessImageObserver, BusinessServiceObserver). Este helper
 * existe para los casos puntuales donde se hagan updates "bulk" vía DB::table() o
 * query()->update() que no disparan eventos Eloquent.
 */
class PublicPageCache
{
    public const KEY_PREFIX = 'public_page:';

    // Cache key para el HTML renderizado de la página pública (Blade server-side).
    // Separado de KEY_PREFIX (que cachea el JSON del API público) para poder
    // invalidarlos independientemente si hace falta.
    public const HTML_KEY_PREFIX = 'public_html:';

    /**
     * TTL del HTML renderizado en segundos.
     * Más alto que el JSON del API (300s) porque el HTML cambia menos
     * frecuentemente y regenerarlo es más costoso (renderizado Blade completo).
     */
    public const HTML_TTL = 900;

    public static function getHtml(string $subdomain): ?string
    {
        $value = Cache::get(self::HTML_KEY_PREFIX.$subdomain);

        return is_string($value) ? $value : null;
    }

    public static function putHtml(string $subdomain, string $html): void
    {
        Cache::put(
            self::HTML_KEY_PREFIX.$subdomain,
            $html,
            self::HTML_TTL
        );
    }

    public static function forgetHtml(string $subdomain): void
    {
        Cache::forget(self::HTML_KEY_PREFIX.$subdomain);
    }

    /**
     * Invalida AMBAS caches (JSON del API y HTML renderizado) para un subdominio.
     */
    public static function forgetAll(string $subdomain): void
    {
        if ($subdomain === '') {
            return;
        }

        Cache::forget(self::KEY_PREFIX.$subdomain);
        self::forgetHtml($subdomain);
    }

    public static function forget(?Business $business): void
    {
        if ($business?->subdomain) {
            self::forgetSubdomain($business->subdomain);
        }
    }

    public static function forgetSubdomain(?string $subdomain): void
    {
        if (is_string($subdomain) && $subdomain !== '') {
            Cache::forget(self::KEY_PREFIX.$subdomain);
            Cache::forget(self::HTML_KEY_PREFIX.$subdomain);
        }
    }
}
