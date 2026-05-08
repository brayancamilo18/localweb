<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Api\BaseApiController;
use App\Http\Resources\AdminTemplateResource;
use App\Models\Template;
use Illuminate\Http\JsonResponse;

class TemplatesController extends BaseApiController
{
    public function index(): JsonResponse
    {
        $templates = Template::query()
            ->withCount(['businesses as total_usage'])
            ->orderByDesc('total_usage')
            ->orderBy('name')
            ->get();

        return $this->success([
            'templates' => AdminTemplateResource::collection($templates),
        ]);
    }

    public function toggleActive(Template $template): JsonResponse
    {
        $template->update(['is_active' => ! $template->is_active]);
        $template->loadCount(['businesses as total_usage']);

        return $this->success([
            'template' => new AdminTemplateResource($template),
        ]);
    }

    public function togglePro(Template $template): JsonResponse
    {
        $template->update(['requires_pro' => ! $template->requires_pro]);
        $template->loadCount(['businesses as total_usage']);

        return $this->success([
            'template' => new AdminTemplateResource($template),
        ]);
    }
}
