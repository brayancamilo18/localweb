<?php

namespace App\Http\Controllers\Api\Onboarding;

use App\Http\Controllers\Api\BaseApiController;
use App\Services\OnboardingResetService;
use Illuminate\Http\Request;

class ResetController extends BaseApiController
{
    public function __invoke(Request $request, OnboardingResetService $reset): \Illuminate\Http\JsonResponse
    {
        $user = $request->user()->load('business');

        if ($user->business?->onboarding_completed_at) {
            return $this->error('El onboarding ya está completado.', [], 409);
        }

        $reset->resetForUser($user);

        return $this->success(['ok' => true, 'step' => 1]);
    }
}
