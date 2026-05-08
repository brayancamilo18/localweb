<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Schedule::command('onboarding:clean-orphaned-drafts')->dailyAt('03:00');
Schedule::command('onboarding:prune-drafts')->hourly();
Schedule::command('analytics:prune')->daily();
