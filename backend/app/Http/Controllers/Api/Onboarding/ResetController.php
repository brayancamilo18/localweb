<?php

namespace App\Http\Controllers\Api\Onboarding;

use App\Http\Controllers\Api\BaseApiController;
use App\Services\OnboardingResetService;
use App\Services\ProPlanReconciliationService;
use Illuminate\Http\Request;

class ResetController extends BaseApiController
{
    public function __invoke(
        Request $request,
        OnboardingResetService $reset,
        ProPlanReconciliationService $planReconciliation,
    ): \Illuminate\Http\JsonResponse {
        $user = $request->user()->load(['business', 'subscriptions']);

        if ($user->business?->onboarding_completed_at) {
            return $this->error('El onboarding ya está completado.', [], 409);
        }

        if ($planReconciliation->hasPaidAccess($user)) {
            $reset->resetForUser($user);

            return $this->success([
                'ok' => true,
                'step' => 8,
                'skipped' => true,
                'reason' => 'paid_subscription',
            ]);
        }

        $reset->resetForUser($user);

        return $this->success(['ok' => true, 'step' => 1]);
    }
}
