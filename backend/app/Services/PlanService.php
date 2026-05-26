<?php

namespace App\Services;

use App\Models\User;

class PlanService
{
    public function canAccessAnalytics(User $user): bool
    {
        return (bool) $this->planConfig($user)['analytics'];
    }

    public function getAnalyticsDaysLimit(User $user): int
    {
        return (int) $this->planConfig($user)['analytics_days'];
    }

    public function getMaxPhotos(User $user): int
    {
        return (int) $this->planConfig($user)['max_photos'];
    }

    public function canChooseSubdomain(User $user): bool
    {
        return (bool) $this->planConfig($user)['can_choose_subdomain'];
    }

    public function canChangeTemplate(User $user): bool
    {
        return (bool) $this->planConfig($user)['can_change_template'];
    }

    public function canRemoveBranding(User $user): bool
    {
        return (bool) $this->planConfig($user)['remove_branding'];
    }

    private function planConfig(User $user): array
    {
        $plan = $user->business?->plan;

        if (is_object($plan) && property_exists($plan, 'value')) {
            $plan = $plan->value;
        }

        $plan = is_string($plan) ? $plan : 'free';

        return config("plans.{$plan}", config('plans.free'));
    }
}
