<?php

namespace App\Observers;

use App\Models\BusinessImage;
use App\Support\PublicPageCache;

class BusinessImageObserver
{
    public function saved(BusinessImage $image): void
    {
        PublicPageCache::forget($image->business);
    }

    public function deleted(BusinessImage $image): void
    {
        PublicPageCache::forget($image->business);
    }
}
