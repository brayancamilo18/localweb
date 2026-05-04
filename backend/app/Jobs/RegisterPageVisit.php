<?php

namespace App\Jobs;

use App\Enums\EventType;
use App\Models\PageVisit;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Spatie\Multitenancy\Jobs\NotTenantAware;

class RegisterPageVisit implements ShouldQueue, NotTenantAware
{
    use Queueable;

    public function __construct(
        public int $business_id,
        public EventType $eventType,
        public ?string $ip,
        public ?string $user_agent
    ) {}

    public function handle(): void
    {
        PageVisit::create([
            'business_id' => $this->business_id,
            'event_type' => $this->eventType,
            'ip' => $this->ip,
            'user_agent' => $this->user_agent,
            'visited_at' => now(),
        ]);
    }
}
