<?php

namespace App\Http\Controllers\Api\Dashboard;

use App\Http\Controllers\Api\BaseApiController;
use App\Services\TemplatePalette;
use App\Support\ProFeatures;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BrandColorController extends BaseApiController
{
    public function __construct(
        private readonly TemplatePalette $palette,
    ) {}

    public function show(Request $request): JsonResponse
    {
        $user = $request->user();
        $business = $user->business;
        $template = $business->template;

        $current = $business->brand_color !== null
            ? strtolower($business->brand_color)
            : null;

        return response()->json([
            'palette' => $this->palette->forBusiness($business),
            'current' => $current,
            'effective' => $this->palette->resolveColor($business),
            'default' => $this->palette->defaultColorFor($template),
            'template_slug' => $template?->slug,
            'template_meta' => $template ? config('branding.templates.'.$template->slug) : null,
            'contrast_warning' => $this->palette->contrastWarningFor($current, $template),
            'is_pro' => ProFeatures::canUseProFeatures($user),
            'is_supported' => $this->palette->isTemplateSupported($template),
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        $user = $request->user();
        $business = $user->business;

        if (! ProFeatures::canUseProFeatures($user)) {
            return response()->json([
                'message' => 'Esta función requiere el plan Pro.',
            ], 403);
        }

        $template = $business->template;

        if (! $this->palette->isTemplateSupported($template)) {
            return response()->json([
                'message' => 'Esta plantilla no admite cambio de color de marca todavía.',
            ], 422);
        }

        $data = $request->validate([
            'brand_color' => ['nullable', 'regex:/^#[0-9a-fA-F]{6}$/'],
        ]);

        $value = $data['brand_color'] ?? null;

        if ($value !== null) {
            $value = strtolower($value);
        }

        $business->forceFill(['brand_color' => $value])->save();

        $business->refresh();

        return response()->json([
            'brand_color' => $business->brand_color,
            'effective_color' => $this->palette->resolveColor($business),
            'contrast_warning' => $this->palette->contrastWarningFor($business->brand_color, $template),
        ]);
    }
}
