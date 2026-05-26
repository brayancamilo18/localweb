<?php

namespace App\Http\Controllers\Api\Onboarding;

use App\Http\Controllers\Api\BaseApiController;
use App\Http\Resources\TemplateResource;
use App\Services\TemplateService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TemplatesController extends BaseApiController
{
    public function __invoke(Request $request, TemplateService $templates): JsonResponse
    {
        $business = $request->user()->business;
        $plan = $business?->plan ?? 'free';
        $effectivePlan = in_array($plan, ['pro', 'pending'], true) ? 'pro' : 'free';

        $list = $templates->getTemplatesForOnboarding($effectivePlan)
            ->sortBy([['sort_order', 'asc'], ['id', 'asc']])
            ->values();

        return $this->success(TemplateResource::collection($list)->resolve());
    }
}
