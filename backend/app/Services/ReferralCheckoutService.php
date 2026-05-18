<?php

namespace App\Services;

use App\Models\Referral;
use App\Models\User;
use Illuminate\Support\Facades\Log;
use Laravel\Cashier\SubscriptionBuilder;

class ReferralCheckoutService
{
    /**
     * @internal Solo para aserciones en tests.
     *
     * @var object{couponId: ?string, allowPromotionCodes: bool}|null
     */
    public static ?object $subscriptionConfigForTests = null;

    public function pendingReferral(User $user): ?Referral
    {
        return $user->referralAsReferred()
            ->where('status', Referral::STATUS_REGISTERED)
            ->first();
    }

    /**
     * @return array{subscription: SubscriptionBuilder, referral: ?Referral}
     */
    public function applyToSubscription(User $user, SubscriptionBuilder $subscription): array
    {
        $referral = $this->pendingReferral($user);

        if ($referral !== null) {
            $couponId = config('referrals.ref_coupon_id');

            if (is_string($couponId) && $couponId !== '') {
                $subscription = $subscription->withCoupon($couponId);
            } else {
                Log::warning('Referral first-free coupon not configured', [
                    'user_id' => $user->id,
                    'referral_id' => $referral->id,
                ]);
                $subscription = $subscription->allowPromotionCodes();
            }
        } else {
            $subscription = $subscription->allowPromotionCodes();
        }

        $this->recordSubscriptionConfigForTests($subscription);

        return [
            'subscription' => $subscription,
            'referral' => $referral,
        ];
    }

    /**
     * @return array<string, int>
     */
    public function referralMetadata(?Referral $referral): array
    {
        if ($referral === null) {
            return [];
        }

        return ['referral_id' => $referral->id];
    }

    private function recordSubscriptionConfigForTests(SubscriptionBuilder $subscription): void
    {
        if (! app()->runningUnitTests()) {
            return;
        }

        self::$subscriptionConfigForTests = (object) [
            'couponId' => $subscription->couponId,
            'allowPromotionCodes' => $subscription->allowPromotionCodes,
        ];
    }
}
