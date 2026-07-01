<?php

namespace App\Http\Controllers\Api\Dashboard;

use App\Enums\Plan;
use App\Http\Controllers\Api\BaseApiController;
use App\Http\Resources\BusinessEventResource;
use App\Models\Business;
use App\Models\BusinessEvent;
use App\Services\ImageService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EventsController extends BaseApiController
{
    public const MAX_EVENTS = 15;

    private const PRO_MESSAGE = 'Los eventos son una función Pro';

    public function index(Request $request)
    {
        $events = $request->user()->business
            ->events()
            ->orderBy('event_date')
            ->get();

        return $this->success(BusinessEventResource::collection($events));
    }

    public function store(Request $request)
    {
        $business = $request->user()->business;

        if ($gate = $this->gatePro($business)) {
            return $gate;
        }

        if ($business->events()->count() >= self::MAX_EVENTS) {
            return $this->error('Máximo '.self::MAX_EVENTS.' eventos por negocio', [], 422);
        }

        $data = $request->validate([
            'title' => ['required', 'string', 'max:120'],
            'event_date' => ['required', 'date'],
            'location' => ['nullable', 'string', 'max:160'],
            'description' => ['nullable', 'string', 'max:500'],
        ]);

        $event = $business->events()->create($data);

        return $this->success(new BusinessEventResource($event));
    }

    public function update(Request $request, BusinessEvent $event)
    {
        $business = $request->user()->business;

        if ($event->business_id !== $business->id) {
            return response()->json(['message' => 'No puedes modificar eventos de otro negocio.'], 403);
        }

        if ($gate = $this->gatePro($business)) {
            return $gate;
        }

        $data = $request->validate([
            'title' => ['sometimes', 'required', 'string', 'max:120'],
            'event_date' => ['sometimes', 'required', 'date'],
            'location' => ['sometimes', 'nullable', 'string', 'max:160'],
            'description' => ['sometimes', 'nullable', 'string', 'max:500'],
        ]);

        $event->fill($data);
        $event->save();

        return $this->success(new BusinessEventResource($event->fresh()));
    }

    public function destroy(Request $request, BusinessEvent $event, ImageService $images)
    {
        $business = $request->user()->business;

        if ($event->business_id !== $business->id) {
            return response()->json(['message' => 'No puedes modificar eventos de otro negocio.'], 403);
        }

        if ($gate = $this->gatePro($business)) {
            return $gate;
        }

        $images->deleteEventImage($event);
        $event->delete();

        return response()->noContent();
    }

    public function uploadPhoto(Request $request, BusinessEvent $event, ImageService $images)
    {
        $business = $request->user()->business;

        if ($event->business_id !== $business->id) {
            return response()->json(['message' => 'No puedes modificar eventos de otro negocio.'], 403);
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

        $images->replaceEventImage($request->file('photo'), $event);

        return $this->success(new BusinessEventResource($event->fresh()));
    }

    public function deletePhoto(Request $request, BusinessEvent $event, ImageService $images)
    {
        $business = $request->user()->business;

        if ($event->business_id !== $business->id) {
            return response()->json(['message' => 'No puedes modificar eventos de otro negocio.'], 403);
        }

        if ($gate = $this->gatePro($business)) {
            return $gate;
        }

        $images->deleteEventImage($event);

        return $this->success(new BusinessEventResource($event->fresh()));
    }

    private function gatePro(Business $business): ?JsonResponse
    {
        if ($business->is_pro || $business->plan === Plan::Pending) {
            return null;
        }

        return response()->json(['message' => self::PRO_MESSAGE], 403);
    }
}
