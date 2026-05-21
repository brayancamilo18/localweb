<?php

namespace App\Observers;

use App\Models\Business;
use App\Support\PublicPageCache;
use Illuminate\Support\Facades\Cache;

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
            PublicPageCache::forgetAll($original);
            Cache::forget('robots:'.$original);
            Cache::forget('sitemap:tenant:'.$original);
        }
        PublicPageCache::forgetAll($business->subdomain);
        Cache::forget('robots:'.$business->subdomain);
        Cache::forget('sitemap:tenant:'.$business->subdomain);

        if ($business->wasChanged('is_published') || $business->wasRecentlyCreated) {
            Cache::forget('sitemap:master');
        }
    }

    public function deleted(Business $business): void
    {
        PublicPageCache::forgetAll($business->subdomain);
        Cache::forget('sitemap:master');
    }

    public function restored(Business $business): void
    {
        PublicPageCache::forgetAll($business->subdomain);
        Cache::forget('sitemap:master');
    }

    public function forceDeleted(Business $business): void
    {
        PublicPageCache::forgetAll($business->subdomain);
    }
}
