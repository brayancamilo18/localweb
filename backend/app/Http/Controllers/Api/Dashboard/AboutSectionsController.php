<?php

namespace App\Http\Controllers\Api\Dashboard;

use App\Enums\Plan;
use App\Http\Controllers\Api\BaseApiController;
use App\Http\Resources\BusinessAboutSectionResource;
use App\Models\Business;
use App\Models\BusinessAboutSection;
use App\Services\ImageService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AboutSectionsController extends BaseApiController
{
    public const MAX_TOTAL_SECTIONS = 5;

    private const PRO_MESSAGE = 'Las secciones extra de «Sobre nosotros» son una función Pro';

    public function index(Request $request)
    {
        $sections = $request->user()->business
            ->aboutSections()
            ->orderBy('display_order')
            ->get();

        return $this->success(BusinessAboutSectionResource::collection($sections));
    }

    public function store(Request $request)
    {
        $business = $request->user()->business;

        if ($gate = $this->gatePro($business)) {
            return $gate;
        }

        if ($business->about_sections_count >= self::MAX_TOTAL_SECTIONS) {
            return $this->error('Máximo '.self::MAX_TOTAL_SECTIONS.' secciones de «Sobre nosotros»', [], 422);
        }

        $data = $request->validate([
            'title' => ['nullable', 'string', 'max:160'],
            'description' => ['nullable', 'string', 'max:500'],
        ]);

        $order = (int) $business->aboutSections()->max('display_order');
        $order = $order > 0 ? $order + 1 : 1;

        $section = $business->aboutSections()->create([
            'display_order' => $order,
            'title' => $data['title'] ?? null,
            'description' => $data['description'] ?? null,
        ]);

        $this->syncSectionsCount($business);

        return $this->success(new BusinessAboutSectionResource($section));
    }

    public function update(Request $request, BusinessAboutSection $aboutSection)
    {
        $business = $request->user()->business;

        if ($aboutSection->business_id !== $business->id) {
            return response()->json(['message' => 'No puedes modificar secciones de otro negocio.'], 403);
        }

        if ($gate = $this->gatePro($business)) {
            return $gate;
        }

        $data = $request->validate([
            'title' => ['sometimes', 'nullable', 'string', 'max:160'],
            'description' => ['sometimes', 'nullable', 'string', 'max:500'],
        ]);

        $aboutSection->fill($data);
        $aboutSection->save();

        return $this->success(new BusinessAboutSectionResource($aboutSection->fresh()));
    }

    public function destroy(Request $request, BusinessAboutSection $aboutSection, ImageService $images)
    {
        $business = $request->user()->business;

        if ($aboutSection->business_id !== $business->id) {
            return response()->json(['message' => 'No puedes modificar secciones de otro negocio.'], 403);
        }

        if ($gate = $this->gatePro($business)) {
            return $gate;
        }

        $images->deleteAboutSectionImage($aboutSection);
        $aboutSection->delete();
        $this->syncSectionsCount($business);

        return response()->noContent();
    }

    public function uploadPhoto(Request $request, BusinessAboutSection $aboutSection, ImageService $images)
    {
        $business = $request->user()->business;

        if ($aboutSection->business_id !== $business->id) {
            return response()->json(['message' => 'No puedes modificar secciones de otro negocio.'], 403);
        }

        if ($gate = $this->gatePro($business)) {
            return $gate;
        }

        $request->validate([
            'photo' => ['required', 'image', 'max:10240', 'mimes:jpg,jpeg,png,webp'],
        ], [
            'photo.required' => 'Selecciona una imagen.',
            'photo.image' => 'El archivo debe ser una imagen.',
            'photo.max' => 'La imagen no puede pesar más de 10 MB.',
        ]);

        $images->replaceAboutSectionImage($request->file('photo'), $aboutSection);

        return $this->success(new BusinessAboutSectionResource($aboutSection->fresh()));
    }

    public function deletePhoto(Request $request, BusinessAboutSection $aboutSection, ImageService $images)
    {
        $business = $request->user()->business;

        if ($aboutSection->business_id !== $business->id) {
            return response()->json(['message' => 'No puedes modificar secciones de otro negocio.'], 403);
        }

        if ($gate = $this->gatePro($business)) {
            return $gate;
        }

        $images->deleteAboutSectionImage($aboutSection);

        return $this->success(new BusinessAboutSectionResource($aboutSection->fresh()));
    }

    private function gatePro(Business $business): ?JsonResponse
    {
        if ($business->is_pro || $business->plan === Plan::Pending) {
            return null;
        }

        return response()->json(['message' => self::PRO_MESSAGE], 403);
    }

    private function syncSectionsCount(Business $business): void
    {
        $extras = $business->aboutSections()->count();
        $count = min(self::MAX_TOTAL_SECTIONS, max(1, 1 + $extras));
        $business->forceFill(['about_sections_count' => $count])->save();
    }
}
