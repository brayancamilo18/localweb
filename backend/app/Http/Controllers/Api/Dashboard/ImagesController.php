<?php

namespace App\Http\Controllers\Api\Dashboard;

use App\Enums\ImageSection;
use App\Http\Controllers\Api\BaseApiController;
use App\Http\Resources\BusinessImageResource;
use App\Models\BusinessImage;
use App\Services\ImageService;
use App\Services\PlanService;
use Illuminate\Http\Request;

class ImagesController extends BaseApiController
{
    public function store(Request $request, ImageService $images, PlanService $plans)
    {
        $data = $request->validate([
            'file' => ['required', 'image', 'max:10240'],
            'section' => ['required', 'in:cover,gallery,about'],
        ]);

        $business = $request->user()->business;
        if ($business->images()->count() >= $plans->getMaxPhotos($request->user())) {
            return response()->json([
                'message' => 'Límite de fotos alcanzado',
                'upgrade_required' => true,
            ], 422);
        }

        $order = (int) $business->images()->where('section', $data['section'])->max('display_order') + 1;
        $image = $images->uploadImage($request->file('file'), $business, ImageSection::from($data['section']), $order);

        return $this->success(new BusinessImageResource($image));
    }

    public function destroy(Request $request, BusinessImage $image, ImageService $images)
    {
        if ($image->business_id !== $request->user()->business_id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $images->deleteImage($image);

        return response()->noContent();
    }

    public function reorder(Request $request, ImageService $images)
    {
        $data = $request->validate([
            'ids' => ['required', 'array'],
            'ids.*' => ['integer'],
        ]);

        $images->reorder($request->user()->business, $data['ids']);

        return $this->success(['ok' => true]);
    }
}
