<?php

namespace App\Http\Controllers\Api\Dashboard;

use App\Http\Controllers\Api\BaseApiController;
use App\Http\Resources\BusinessResource;
use App\Enums\ImageSection;
use App\Models\Template;
use App\Services\BusinessService;
use App\Services\ImageService;
use App\Services\PlanService;
use App\Services\TemplateContrast;
use App\Services\TemplatePalette;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class TemplateChangeController extends BaseApiController
{
    public function __invoke(
        Request $request,
        PlanService $plans,
        BusinessService $service,
        TemplatePalette $palette,
        TemplateContrast $contrast,
        ImageService $imageService,
    ): JsonResponse {
        $user = $request->user();
        $business = $user->business;

        $data = $request->validate([
            'template_id' => ['required', 'integer', 'exists:templates,id'],
            'brand_color' => ['sometimes', 'nullable', 'string', 'regex:/^#[0-9a-fA-F]{6}$/'],
            'keep_current_brand_color' => ['sometimes', 'boolean'],
        ]);

        $template = Template::query()->active()->find($data['template_id']);

        if ($template === null) {
            return $this->error('La plantilla seleccionada no está disponible.', [], 422);
        }

        if ((int) $business->template_id === (int) $template->id) {
            $business->load(['template', 'services', 'images' => fn ($q) => $q->ordered()]);

            return $this->success(new BusinessResource($business));
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

        $brandColorPayload = null;
        $brandColorTouched = false;

        if ($request->has('brand_color')) {
            $brandColorTouched = true;
            $proposed = $data['brand_color'] ?? null;

            if ($proposed !== null) {
                $brandColorPayload = strtolower($proposed);
            } else {
                $brandColorPayload = null;
            }
        }

        if (! $brandColorTouched && ($data['keep_current_brand_color'] ?? false)) {
            $currentColor = $business->brand_color;

            if ($currentColor !== null && $palette->isValidForTemplate($currentColor, $template)) {
                // No hace falta tocar brand_color; queda como está.
            }
        }

        $updatePayload = [
            'template_id' => $template->id,
            'template_changed_at' => now(),
        ];

        if ($brandColorTouched) {
            $updatePayload['brand_color'] = $brandColorPayload;
        }

        DB::transaction(function () use ($business, $service, $updatePayload, $template, $imageService) {
            $service->update($business, $updatePayload);

            $newSlots = (int) ($template->hero_photo_slots ?? 1);
            $excessCovers = $business->images()
                ->where('section', ImageSection::Cover->value)
                ->ordered()
                ->skip($newSlots)
                ->take(100)
                ->get();

            foreach ($excessCovers as $cover) {
                $imageService->deleteImage($cover);
            }

            $business->load(['template', 'services', 'images' => fn ($q) => $q->ordered()]);
        });

        return $this->success(new BusinessResource($business));
    }
}
