<?php

namespace App\Http\Controllers\Api\Account;

use App\Http\Controllers\Api\BaseApiController;
use App\Models\Referral;
use App\Support\ReferralEmailMask;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReferralsController extends BaseApiController
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user()->load('business');

        if (! $user->business?->is_pro) {
            return $this->error('Solo disponible para usuarios Pro', [], 403);
        }

        $code = $user->ensureReferralCode();
        $referrals = $user->referralsAsReferrer()->latest()->get();

        $paid = $referrals->where('status', Referral::STATUS_PAID)->count();
        $rewarded = $referrals->where('status', Referral::STATUS_REWARDED)->count();

        return $this->success([
            'code' => $code,
            'link' => $user->referral_link,
            'counts' => [
                'total' => $referrals->count(),
                'paid' => $paid,
                'rewarded' => $rewarded,
                'pending' => $referrals->where('status', Referral::STATUS_REGISTERED)->count(),
            ],
            'threshold' => (int) config('referrals.reward_threshold'),
            'max' => (int) config('referrals.max_referrals'),
            'template_gift_at' => (int) config('referrals.template_gift_at'),
            'referrals' => $referrals->map(fn (Referral $referral) => [
                'id' => $referral->id,
                'status' => $referral->status,
                'email_masked' => ReferralEmailMask::mask($referral->referred_email),
                'registered_at' => $referral->created_at?->getTimestamp(),
                'first_payment_at' => $referral->first_payment_at?->getTimestamp(),
            ])->values()->all(),
        ]);
    }
}
