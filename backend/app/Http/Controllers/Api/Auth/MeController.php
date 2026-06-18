<?php

namespace App\Http\Controllers\Api\Auth;

use App\Http\Controllers\Api\BaseApiController;
use App\Http\Resources\BusinessResource;
use App\Http\Resources\UserResource;
use App\Models\Referral;
use App\Services\ProPlanReconciliationService;
use Illuminate\Http\Request;

class MeController extends BaseApiController
{
    public function __invoke(Request $request, ProPlanReconciliationService $planReconciliation)
    {
        $user = $request->user()->load([
            'business.template',
            'business.images',
            'referralAsReferred.referrer',
            'subscriptions',
        ]);

        $planReconciliation->reconcile($user);
        $user->load([
            'business.template',
            'business.images',
        ]);

        $data = [
            'user' => new UserResource($user),
            'business' => $user->business ? new BusinessResource($user->business) : null,
        ];

        $referral = $user->referralAsReferred;

        if ($referral !== null && $referral->status === Referral::STATUS_REGISTERED) {
            $data['referral_context'] = [
                'referrer_name' => $referral->referrer->name ?? 'Alguien',
                'promo_code_first_free' => config('referrals.ref_coupon_id'),
            ];
        }

        return $this->success($data);
    }
}
