<?php

use App\Models\Business;
use App\Models\PageVisit;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;

uses(RefreshDatabase::class);

it('analytics prune deletes visits older than 180 days in chunks', function () {
    $b = Business::create([
        'name' => 'P',
        'subdomain' => 'prune-'.uniqid(),
        'subdomain_type' => 'random',
        'sector' => 'otros',
    ]);

    PageVisit::create([
        'business_id' => $b->id,
        'event_type' => 'visit',
        'visited_at' => now()->subDays(181),
    ]);

    PageVisit::create([
        'business_id' => $b->id,
        'event_type' => 'visit',
        'visited_at' => now()->subDays(10),
    ]);

    Artisan::call('analytics:prune');

    expect(PageVisit::count())->toBe(1)
        ->and(PageVisit::first()->visited_at->isAfter(now()->subDays(30)))->toBeTrue();
});
