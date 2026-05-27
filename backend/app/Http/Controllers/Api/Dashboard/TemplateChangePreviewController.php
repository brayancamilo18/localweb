<?php

namespace App\Http\Controllers\Api\Dashboard;

use App\Http\Controllers\Api\BaseApiController;
use App\Models\Template;
use App\Services\PlanService;
use App\Services\TemplatePalette;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TemplateChangePreviewController extends BaseApiController
{
    public function __invoke(
        Request $request,
        Template $template,
        PlanService $plans,
        TemplatePalette $palette,
    ): JsonResponse {
        $user = $request->user();
        $business = $user->business;

        if (! $template->is_active) {
            return $this->error('La plantilla seleccionada no está disponible.', [], 422);
        }

        if ((int) $business->template_id === (int) $template->id) {
            return response()->json(['same_template' => true]);
        }

        if (! $plans->canChangeTemplate($user)) {
            return $this->error(
                'Cambiar de plantilla es una función PRO. Mejora tu plan para personalizar tu diseño.',
                ['plan' => 'upgrade_required'],
                403,
            );
        }

        if ($template->requires_pro && ! $plans->canChangeTemplate($user)) {
            return $this->error('Esta plantilla solo está disponible para usuarios PRO.', ['plan' => 'upgrade_required'], 403);
        }

        if ($business->isTemplateChangeOnCooldown()) {
            $availableAt = $business->templateChangeAvailableAt();

            return $this->error(
                'Solo puedes cambiar de plantilla una vez cada '.\App\Models\Business::TEMPLATE_CHANGE_COOLDOWN_DAYS.' días.',
                [
                    'cooldown' => true,
                    'available_at' => $availableAt?->toIso8601String(),
                ],
                429,
            );
        }

        $preview = $palette->previewChange($business, $template);
        $hasCurrent = $business->brand_color !== null;

        return response()->json([
            'same_template' => false,
            'template' => [
                'id' => $template->id,
                'name' => $template->name,
                'slug' => $template->slug,
            ],
            'brand_color' => [
                'has_current' => $hasCurrent,
                'current_color' => $preview['current_color'],
                'current_in_new' => $preview['current_in_new'],
                'suggested_color' => $preview['suggested_color'],
                'new_palette' => $preview['new_palette'],
                'new_default' => $preview['new_default'],
                'new_template_supported' => $preview['new_template_supported'],
            ],
        ]);
    }
}
