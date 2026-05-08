<?php

namespace App\Observers;

use App\Models\Business;
use App\Support\PublicPageCache;

class BusinessObserver
{
    /**
     * Se dispara tras created y updated. Invalida el subdominio nuevo y, si ha cambiado,
     * también el antiguo (caso poco frecuente: rebranding de subdominio).
     */
    public function saved(Business $business): void
    {
        $original = $business->getOriginal('subdomain');
        if (is_string($original) && $original !== '' && $original !== $business->subdomain) {
            PublicPageCache::forgetSubdomain($original);
        }
        PublicPageCache::forget($business);
    }

    public function deleted(Business $business): void
    {
        PublicPageCache::forget($business);
    }

    public function restored(Business $business): void
    {
        PublicPageCache::forget($business);
    }

    public function forceDeleted(Business $business): void
    {
        PublicPageCache::forget($business);
    }
}
