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
        }
    }
}
