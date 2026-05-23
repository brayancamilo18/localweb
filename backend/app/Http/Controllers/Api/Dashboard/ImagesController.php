<?php

namespace App\Http\Controllers\Api\Dashboard;

use App\Enums\ImageSection;
use App\Http\Controllers\Api\BaseApiController;
use App\Http\Resources\BusinessImageResource;
use App\Http\Resources\BusinessResource;
use App\Models\BusinessImage;
use App\Services\ImageService;
use App\Services\PlanService;
use App\Support\PublicPageCache;
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

        if ($data['section'] === 'gallery') {
            $galleryCount = $business->images()->where('section', ImageSection::Gallery->value)->count();
            if ($galleryCount >= $plans->getMaxPhotos($request->user())) {
                return response()->json([
                    'message' => 'Límite de fotos alcanzado',
                    'upgrade_required' => true,
                ], 422);
            }
        }

        if ($data['section'] === 'cover') {
            $maxCovers = $business->template?->hero_photo_slots ?? 1;
            $coverCount = $business->images()->where('section', ImageSection::Cover->value)->count();
            if ($coverCount >= $maxCovers) {
                return response()->json([
                    'message' => "Límite de fotos de portada alcanzado ($maxCovers máximo)",
                ], 422);
            }
        }

        $order = (int) $business->images()->where('section', $data['section'])->max('display_order') + 1;
        // BusinessImageObserver invalida public_page:{subdomain} al guardar.
        $image = $images->uploadImage($request->file('file'), $business, ImageSection::from($data['section']), $order);

        return $this->success(new BusinessImageResource($image));
    }

    public function destroy(Request $request, BusinessImage $image, ImageService $images)
    {
        if ($image->business_id !== $request->user()->business_id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        // BusinessImageObserver invalida public_page:{subdomain} en deleted.
        $images->deleteImage($image);

        return response()->noContent();
    }

    public function reorder(Request $request, ImageService $images)
    {
        $data = $request->validate([
            'ids' => ['required', 'array'],
            'ids.*' => ['integer'],
        ]);

        $businessId = $request->user()->business_id;
        $ids = array_values(array_unique($data['ids']));
        $ownedCount = BusinessImage::query()
            ->where('business_id', $businessId)
            ->whereIn('id', $ids)
            ->count();
        if ($ownedCount !== count($ids)) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        // ImageService::reorder usa BusinessImage::query()->update() masivo: NO dispara observers,
        // así que invalidamos manualmente con el helper.
        $images->reorder($request->user()->business, $data['ids']);
        PublicPageCache::forget($request->user()->business);

        return $this->success(['ok' => true]);
    }

    public function storeLogo(Request $request, ImageService $images)
    {
        $request->validate([
            'file' => ['required', 'image', 'max:2048', 'mimes:jpg,jpeg,png,webp'],
        ]);

        $business = $request->user()->business;
        if (! $business) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        // BusinessObserver invalida public_page:{subdomain} en saved (replace hace $business->save()).
        $images->replaceBusinessLogo($request->file('file'), $business);

        $fresh = $business->fresh()?->load(['template', 'services', 'images' => fn ($q) => $q->ordered()]);

        return $this->success(new BusinessResource($fresh ?? $business));
    }

    public function destroyLogo(Request $request, ImageService $images)
    {
        $business = $request->user()->business;
        if (! $business) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        // BusinessObserver invalida en saved tras $business->update(['logo_path' => null]).
        $images->deleteBusinessLogo($business);

        $fresh = $business->fresh()?->load(['template', 'services', 'images' => fn ($q) => $q->ordered()]);

        return $this->success(new BusinessResource($fresh ?? $business));
    }

    public function storeFavicon(Request $request, ImageService $images)
    {
        $business = $request->user()->business;
        if (! $business) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        if (! $business->is_pro) {
            return response()->json([
                'message' => 'El favicon personalizado es una función Pro.',
                'upgrade_required' => true,
            ], 422);
        }

        $request->validate([
            'file' => ['required', 'file', 'max:1024', 'mimetypes:image/png,image/svg+xml,image/x-icon,image/vnd.microsoft.icon,image/webp'],
        ]);

        // BusinessObserver invalida public_page:{subdomain} en saved.
        $images->replaceBusinessFavicon($request->file('file'), $business);

        $fresh = $business->fresh()?->load(['template', 'services', 'images' => fn ($q) => $q->ordered()]);

        return $this->success(new BusinessResource($fresh ?? $business));
    }

    public function destroyFavicon(Request $request, ImageService $images)
    {
        $business = $request->user()->business;
        if (! $business) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $images->deleteBusinessFavicon($business);

        $fresh = $business->fresh()?->load(['template', 'services', 'images' => fn ($q) => $q->ordered()]);

        return $this->success(new BusinessResource($fresh ?? $business));
    }
}
