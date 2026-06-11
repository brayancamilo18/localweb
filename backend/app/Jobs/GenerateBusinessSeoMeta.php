<?php

namespace App\Jobs;

use App\Enums\Plan;
use App\Exceptions\Ai\AiQuotaExceededException;
use App\Exceptions\Ai\AiUnavailableException;
use App\Models\Business;
use App\Services\Ai\AiTextService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Spatie\Multitenancy\Jobs\NotTenantAware;

class GenerateBusinessSeoMeta implements NotTenantAware, ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public function __construct(public int $businessId) {}

    public function handle(AiTextService $ai): void
    {
        $business = Business::with('owner')->find($this->businessId);
        if ($business === null || $business->plan === Plan::Free) {
            return;
        }

        $user = $business->owner;
        if ($user === null) {
            return;
        }

        try {
            $result = $ai->generateBusinessSeoMeta($user, $business);

            $business->forceFill([
                'seo_title' => $result['seo_title'],
                'seo_description' => $result['seo_description'],
            ])->save();
        } catch (AiUnavailableException|AiQuotaExceededException) {
            // Silencioso: SeoMetaBuilder tiene fallback en runtime.
        }
    }
}
