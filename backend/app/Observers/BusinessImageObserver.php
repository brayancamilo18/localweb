<?php

namespace App\Observers;

use App\Models\BusinessImage;
use App\Support\PublicPageCache;
use Illuminate\Support\Facades\Cache;

class BusinessImageObserver
{
    public function saved(BusinessImage $image): void
    {
        $image->loadMissing('business');
        if ($image->business?->subdomain) {
            PublicPageCache::forgetAll($image->business->subdomain);
            Cache::forget('sitemap:tenant:'.$image->business->subdomain);
        }
    }

    public function deleted(BusinessImage $image): void
    {
        $image->loadMissing('business');
        if ($image->business?->subdomain) {
            PublicPageCache::forgetAll($image->business->subdomain);
            Cache::forget('sitemap:tenant:'.$image->business->subdomain);
        }
    }
}
