<?php

namespace App\Observers;

use App\Models\BusinessService;
use App\Support\PublicPageCache;

class BusinessServiceObserver
{
    public function saved(BusinessService $service): void
    {
        PublicPageCache::forget($service->business);
    }

    public function deleted(BusinessService $service): void
    {
        PublicPageCache::forget($service->business);
    }
}
