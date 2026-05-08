<?php

namespace App\Jobs;

use App\Enums\EventType;
use App\Models\PageVisit;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Spatie\Multitenancy\Jobs\NotTenantAware;

class RegisterPageVisit implements NotTenantAware, ShouldQueue
{
    use Queueable;

    private static bool $ipSaltMissingLogged = false;

    public function __construct(
        public int $business_id,
        public EventType $eventType,
        public ?string $ip,
        public ?string $user_agent
    ) {}

    public function handle(): void
    {
        $salt = (string) config('services.analytics.ip_salt', '');

        $ua = $this->user_agent ? mb_substr($this->user_agent, 0, 255) : null;

        $ipHash = null;
        $dedupeKeySuffix = null;

        if ($salt !== '') {
            $ipHash = hash_hmac('sha256', $this->ip ?? '', $salt);
            $dedupeKeySuffix = $ipHash;
        } else {
            if (! self::$ipSaltMissingLogged) {
                Log::warning('ANALYTICS_IP_SALT is empty; page visit ip_hash will not be stored.');
                self::$ipSaltMissingLogged = true;
            }
            // Sin salt no persistimos hash; la clave de dedupe sigue basada en IP solo en memoria (no en BD).
            $dedupeKeySuffix = hash('sha256', $this->ip ?? '');
        }

        if ($this->eventType === EventType::Visit && $dedupeKeySuffix !== null) {
            $dedupKey = "visit_dedup:{$this->business_id}:{$dedupeKeySuffix}";
            if (Cache::has($dedupKey)) {
                return;
            }
            Cache::put($dedupKey, true, now()->addMinutes(30));
        }

        PageVisit::create([
            'business_id' => $this->business_id,
            'event_type' => $this->eventType,
            'ip_hash' => $ipHash,
            'user_agent' => $ua,
            'visited_at' => now(),
        ]);
    }
}
