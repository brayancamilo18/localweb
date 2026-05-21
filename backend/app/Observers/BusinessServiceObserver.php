<?php

namespace App\Observers;

use App\Models\BusinessService;
use App\Support\PublicPageCache;

class BusinessServiceObserver
{
    public function saved(BusinessService $service): void
    {
        $service->loadMissing('business');
        if ($service->business?->subdomain) {
            PublicPageCache::forgetAll($service->business->subdomain);
        }
    }

    public function deleted(BusinessService $service): void
    {
        $service->loadMissing('business');
        if ($service->business?->subdomain) {
            PublicPageCache::forgetAll($service->business->subdomain);
        }
    }
}
