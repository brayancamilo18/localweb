<?php

namespace App\Http\Controllers\Api\Dashboard;

use App\Http\Controllers\Api\BaseApiController;
use App\Http\Resources\BusinessResource;
use App\Models\Template;
use App\Services\BusinessService;
use App\Services\PlanService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TemplateChangeController extends BaseApiController
{
    public function __invoke(
        Request $request,
        PlanService $plans,
        BusinessService $service,
    ): JsonResponse {
        $user = $request->user();
        $business = $user->business;

        $data = $request->validate([
            'template_id' => ['required', 'integer', 'exists:templates,id'],
        ]);

        $template = Template::query()->active()->find($data['template_id']);

        if ($template === null) {
            return $this->error('La plantilla seleccionada no está disponible.', [], 422);
        }

        // Si no cambia nada (misma plantilla), devolvemos el negocio sin consumir cooldown.
        if ((int) $business->template_id === (int) $template->id) {
            $business->load(['template', 'services', 'images' => fn ($q) => $q->ordered()]);

            return $this->success(new BusinessResource($business));
        }

        // 1) ¿El plan permite cambiar de plantilla?
        if (! $plans->canChangeTemplate($user)) {
            return $this->error(
                'Cambiar de plantilla es una función PRO. Mejora tu plan para personalizar tu diseño.',
                ['plan' => 'upgrade_required'],
                403,
            );
        }

        // 2) ¿La plantilla destino requiere PRO? (defensa extra; un PRO siempre pasa)
        if ($template->requires_pro && ! $plans->canChangeTemplate($user)) {
            return $this->error('Esta plantilla solo está disponible para usuarios PRO.', ['plan' => 'upgrade_required'], 403);
        }

        // 3) Cooldown
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

        // Cambio efectivo: actualiza plantilla y sella el cooldown.
        // BusinessObserver invalida la caché pública en saved().
        $service->update($business, [
            'template_id' => $template->id,
            'template_changed_at' => now(),
        ]);

        $business->load(['template', 'services', 'images' => fn ($q) => $q->ordered()]);

        return $this->success(new BusinessResource($business));
    }
}
