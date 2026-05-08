<?php

namespace App\Http\Controllers\Api\Dashboard;

use App\Enums\Plan;
use App\Http\Controllers\Api\BaseApiController;
use App\Http\Resources\BusinessServiceResource;
use App\Models\Business;
use App\Models\BusinessService;
use App\Support\PublicPageCache;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ServicesController extends BaseApiController
{
    private const MAX_SERVICES_PRO = 15;

    private const MAX_SERVICES_FREE = 3;

    private const PRO_SERVICES_MESSAGE = 'Los servicios ilimitados son una función Pro';

    public function index(Request $request)
    {
        $services = $request->user()->business->services()->get();

        return $this->success(BusinessServiceResource::collection($services));
    }

    public function store(Request $request)
    {
        $business = $request->user()->business;

        if ($gate = $this->gateFreeServicesLimitForStore($business)) {
            return $gate;
        }

        if ($business->is_pro && $business->services()->count() >= self::MAX_SERVICES_PRO) {
            return $this->error('Máximo '.self::MAX_SERVICES_PRO.' servicios por negocio', [], 422);
        }

        $data = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'price' => ['nullable', 'numeric', 'min:0'],
            'description' => ['nullable', 'string', 'max:200'],
        ]);

        $order = (int) $business->services()->max('display_order') + 1;

        // BusinessServiceObserver invalida public_page:{subdomain} en saved.
        $service = $business->services()->create([
            'name' => $data['name'],
            'price' => $data['price'] ?? null,
            'description' => $data['description'] ?? null,
            'display_order' => $order,
        ]);

        return $this->success(new BusinessServiceResource($service));
    }

    public function update(Request $request, BusinessService $service)
    {
        if ($service->business_id !== $request->user()->business_id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $business = $request->user()->business;
        if ($gate = $this->gateFreeServicesLimitForUpdate($business)) {
            return $gate;
        }

        $data = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:100'],
            'price' => ['nullable', 'numeric', 'min:0'],
            'description' => ['nullable', 'string', 'max:200'],
        ]);

        // BusinessServiceObserver invalida public_page:{subdomain} en saved.
        $service->fill($data);
        $service->save();

        return $this->success(new BusinessServiceResource($service->fresh()));
    }

    public function destroy(Request $request, BusinessService $service)
    {
        if ($service->business_id !== $request->user()->business_id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        // BusinessServiceObserver invalida public_page:{subdomain} en deleted.
        $service->delete();

        return response()->noContent();
    }

    public function reorder(Request $request)
    {
        $data = $request->validate([
            'ids' => ['required', 'array'],
            'ids.*' => ['integer'],
        ]);

        $business = $request->user()->business;

        // Update bulk vía query()->update(): NO dispara observer, así que invalidamos manualmente.
        DB::transaction(function () use ($business, $data): void {
            foreach (array_values($data['ids']) as $order => $id) {
                BusinessService::query()
                    ->where('business_id', $business->id)
                    ->whereKey($id)
                    ->update(['display_order' => $order]);
            }
        });

        PublicPageCache::forget($business);

        return $this->success(['ok' => true]);
    }

    private function treatsAsProForServiceLimits(Business $business): bool
    {
        return $business->is_pro || $business->plan === Plan::Pending;
    }

    private function gateFreeServicesLimitForStore(Business $business): ?JsonResponse
    {
        if ($this->treatsAsProForServiceLimits($business)) {
            return null;
        }

        if ($business->services()->count() >= self::MAX_SERVICES_FREE) {
            return response()->json(['message' => self::PRO_SERVICES_MESSAGE], 403);
        }

        return null;
    }

    private function gateFreeServicesLimitForUpdate(Business $business): ?JsonResponse
    {
        if ($this->treatsAsProForServiceLimits($business)) {
            return null;
        }

        if ($business->services()->count() > self::MAX_SERVICES_FREE) {
            return response()->json(['message' => self::PRO_SERVICES_MESSAGE], 403);
        }

        return null;
    }
}
