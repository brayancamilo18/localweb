<?php

namespace App\Http\Controllers\Api\Dashboard;

use App\Http\Controllers\Api\BaseApiController;
use App\Http\Resources\BusinessResource;
use App\Models\PageVisit;
use App\Services\BusinessService;
use App\Services\GeocodingService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class BusinessController extends BaseApiController
{
    public function show(Request $request)
    {
        $business = $request->user()->business()
            ->with(['template', 'services', 'images' => fn ($q) => $q->ordered()])
            ->firstOrFail();

        $weekly = PageVisit::query()
            ->where('business_id', $business->id)
            ->where('visited_at', '>=', now()->subDays(7))
            ->selectRaw('event_type, count(*) as total')
            ->groupBy('event_type')
            ->pluck('total', 'event_type');

        $business->stats = [
            'visit' => (int) ($weekly['visit'] ?? 0),
            'whatsapp_click' => (int) ($weekly['whatsapp_click'] ?? 0),
            'phone_click' => (int) ($weekly['phone_click'] ?? 0),
        ];

        return $this->success(new BusinessResource($business));
    }

    public function update(Request $request, BusinessService $service, GeocodingService $geo)
    {
        $business = $request->user()->business;

        foreach (['google_maps_url', 'google_business_url', 'booking_url'] as $field) {
            if (! $request->has($field)) {
                continue;
            }
            $v = $request->input($field);
            if ($v === '' || $v === null) {
                $request->merge([$field => null]);

                continue;
            }
            if (is_string($v) && ! preg_match('#^https?://#i', $v)) {
                $request->merge([$field => 'https://'.ltrim($v, '/')]);
            }
        }

        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:80'],
            'tagline' => ['nullable', 'string', 'max:120'],
            'description' => ['nullable', 'string', 'max:500'],
            'phone' => ['nullable', 'string', 'max:30'],
            'address' => ['nullable', 'string'],
            'template_id' => ['nullable', 'integer'],
            'schedule' => ['nullable', 'array'],
            'google_maps_url' => ['nullable', 'string', 'max:500', 'regex:#^https?://.+#i'],
            'google_business_url' => ['nullable', 'string', 'max:500', 'regex:#^https?://.+#i'],
            'booking_url' => ['nullable', 'string', 'max:500', 'regex:#^https?://.+#i'],
            'vcard_enabled' => ['sometimes', 'boolean'],
        ]);

        if (array_key_exists('address', $data) && $data['address'] !== $business->address) {
            try {
                $coords = $geo->geocode((string) $data['address']);
                $data['lat'] = $coords['lat'];
                $data['lng'] = $coords['lng'];
            } catch (\Throwable) {
            }
        }

        $updated = $service->update($business, $data);
        Cache::forget("public_page:{$updated->subdomain}");
        $updated->load(['template', 'services', 'images' => fn ($q) => $q->ordered()]);

        return $this->success(new BusinessResource($updated));
    }
}
