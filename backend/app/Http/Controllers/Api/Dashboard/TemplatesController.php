<?php

namespace App\Http\Controllers\Api\Dashboard;

use App\Http\Controllers\Api\BaseApiController;
use App\Http\Resources\TemplateResource;
use App\Models\Business;
use App\Services\PlanService;
use App\Services\TemplateService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TemplatesController extends BaseApiController
{
    public function __invoke(Request $request, TemplateService $templates, PlanService $plans): JsonResponse
    {
        $user = $request->user();
        $business = $user->business;
        $canChange = $plans->canChangeTemplate($user);

        $currentTemplateId = $business->template_id;

        $list = $templates->getActiveTemplates()
            ->sortBy([['sort_order', 'asc'], ['id', 'asc']])
            ->values()
            ->map(function ($template) use ($canChange, $currentTemplateId) {
                // La plantilla actual nunca se bloquea (el usuario ya la tiene).
                // Si el plan no permite cambiar de plantilla (FREE), TODAS las demás quedan bloqueadas,
                // independientemente de si son requires_pro o no. Cambiar de plantilla es función PRO.
                $isCurrent = (int) $template->id === (int) $currentTemplateId;
                $template->locked = ! $canChange && ! $isCurrent;

                return $template;
            });

        return $this->success([
            'templates' => TemplateResource::collection($list),
            'meta' => [
                'can_change' => $canChange,
                'current_template_id' => $business->template_id,
                'cooldown_days' => Business::TEMPLATE_CHANGE_COOLDOWN_DAYS,
                'on_cooldown' => $business->isTemplateChangeOnCooldown(),
                'available_at' => $business->templateChangeAvailableAt()?->toIso8601String(),
            ],
        ]);
    }
}
