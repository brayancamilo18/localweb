<?php

namespace App\Support;

use App\Enums\Plan;
use App\Models\User;

class ProFeatures
{
    public static function canUseProFeatures(User $user): bool
    {
        $business = $user->business;

        return $business !== null && $business->plan === Plan::Pro;
    }
}
