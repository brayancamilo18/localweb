<?php

namespace App\Console\Commands;

use App\Models\PageVisit;
use Illuminate\Console\Command;

class PruneOldPageVisits extends Command
{
    protected $signature = 'analytics:prune';

    protected $description = 'Remove page_visits older than 180 days (retention)';

    public function handle(): int
    {
        $cutoff = now()->subDays(180);
        $deleted = 0;

        while (true) {
            $ids = PageVisit::query()
                ->where('visited_at', '<', $cutoff)
                ->orderBy('id')
                ->limit(1000)
                ->pluck('id');

            if ($ids->isEmpty()) {
                break;
            }

            $deleted += PageVisit::query()->whereIn('id', $ids)->delete();
        }

        $this->info("Deleted {$deleted} page visit(s) with visited_at before {$cutoff->toIso8601String()}.");

        return self::SUCCESS;
    }
}
