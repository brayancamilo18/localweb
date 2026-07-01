<?php

namespace App\Observers;

use App\Models\BusinessEvent;
use App\Support\PublicPageCache;

class BusinessEventObserver
{
    public function saved(BusinessEvent $event): void
    {
        $this->forgetCache($event);
    }

    public function deleted(BusinessEvent $event): void
    {
        $this->forgetCache($event);
    }

    private function forgetCache(BusinessEvent $event): void
    {
        $business = $event->business;
        if ($business) {
            PublicPageCache::forget($business);
        }
    }
}
