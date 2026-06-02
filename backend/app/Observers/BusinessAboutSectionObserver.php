<?php

namespace App\Observers;

use App\Models\BusinessAboutSection;
use App\Support\PublicPageCache;

class BusinessAboutSectionObserver
{
    public function saved(BusinessAboutSection $section): void
    {
        $this->forgetCache($section);
    }

    public function deleted(BusinessAboutSection $section): void
    {
        $this->forgetCache($section);
    }

    private function forgetCache(BusinessAboutSection $section): void
    {
        $business = $section->business;
        if ($business) {
            PublicPageCache::forget($business);
        }
    }
}
