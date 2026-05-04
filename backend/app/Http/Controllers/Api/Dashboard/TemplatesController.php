<?php

namespace App\Http\Controllers\Api\Dashboard;

use App\Http\Controllers\Api\BaseApiController;
use App\Http\Resources\TemplateResource;
use App\Services\TemplateService;
use Illuminate\Http\Request;

class TemplatesController extends BaseApiController
{
    public function __invoke(Request $request, TemplateService $templates)
    {
        $plan = $request->user()->business?->plan;
        if (is_object($plan) && property_exists($plan, 'value')) {
            $plan = $plan->value;
        }

        return $this->success(TemplateResource::collection(
            $templates->getTemplatesForPlan((string) ($plan ?: 'free'))
        ));
    }
}
