<?php

use App\Models\Business;
use App\Models\User;
use App\Services\PlanService;

it('free user cannot access analytics', function () {
    $user = new User();
    $user->setRelation('business', new Business(['plan' => 'free']));

    $service = new PlanService();

    expect($service->canAccessAnalytics($user))->toBeFalse();
});

it('pro user can access analytics', function () {
    $user = new User();
    $user->setRelation('business', new Business(['plan' => 'pro']));

    $service = new PlanService();

    expect($service->canAccessAnalytics($user))->toBeTrue();
});

it('free user max photos is three', function () {
    $user = new User();
    $user->setRelation('business', new Business(['plan' => 'free']));

    $service = new PlanService();

    expect($service->getMaxPhotos($user))->toBe(3);
});

it('pro user max photos is twenty', function () {
    $user = new User();
    $user->setRelation('business', new Business(['plan' => 'pro']));

    $service = new PlanService();

    expect($service->getMaxPhotos($user))->toBe(20);
});
