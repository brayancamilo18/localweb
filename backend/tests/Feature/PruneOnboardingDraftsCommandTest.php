<?php

use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;

beforeEach(function () {
    Storage::fake('local');
});

function touchFileAged(string $relativePath, int $hoursAgo): void
{
    $disk = Storage::disk('local');
    $disk->put($relativePath, 'x');
    $absolute = $disk->path($relativePath);
    touch($absolute, time() - ($hoursAgo * 3600));
}

it('removes onboarding draft directories whose newest file is older than 48h', function () {
    Cache::put('onboarding:42', ['some' => 'draft'], now()->addHours(4));

    touchFileAged('onboarding/42/cover/old.jpg', 49);
    touchFileAged('onboarding/42/gallery/g1.jpg', 50);

    $exit = Artisan::call('onboarding:prune-drafts');

    expect($exit)->toBe(0)
        ->and(Storage::disk('local')->exists('onboarding/42'))->toBeFalse()
        ->and(Cache::has('onboarding:42'))->toBeFalse();
});

it('keeps directories with at least one recent file', function () {
    touchFileAged('onboarding/7/cover/old.jpg', 49);
    touchFileAged('onboarding/7/gallery/recent.jpg', 1);

    Artisan::call('onboarding:prune-drafts');

    expect(Storage::disk('local')->exists('onboarding/7'))->toBeTrue()
        ->and(Storage::disk('local')->exists('onboarding/7/gallery/recent.jpg'))->toBeTrue();
});

it('removes empty onboarding subdirectories as orphans', function () {
    Storage::disk('local')->makeDirectory('onboarding/99');

    Artisan::call('onboarding:prune-drafts');

    expect(Storage::disk('local')->exists('onboarding/99'))->toBeFalse();
});

it('ignores subdirectories whose name is not numeric', function () {
    touchFileAged('onboarding/not-a-user/old.jpg', 60);

    Artisan::call('onboarding:prune-drafts');

    expect(Storage::disk('local')->exists('onboarding/not-a-user'))->toBeTrue();
});

it('returns success when onboarding root does not exist', function () {
    expect(Storage::disk('local')->exists('onboarding'))->toBeFalse();

    expect(Artisan::call('onboarding:prune-drafts'))->toBe(0);
});
