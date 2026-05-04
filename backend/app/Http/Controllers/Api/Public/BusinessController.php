<?php

namespace App\Http\Controllers\Api\Public;

use App\Enums\EventType;
use App\Http\Controllers\Api\BaseApiController;
use App\Http\Resources\PublicBusinessResource;
use App\Jobs\RegisterPageVisit;
use App\Models\Business;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class BusinessController extends BaseApiController
{
    public function show(Request $request, string $subdomain)
    {
        $cached = Cache::get("public_page:{$subdomain}");
        if ($cached) {
            RegisterPageVisit::dispatch($cached['id'], EventType::Visit, $request->ip(), $request->userAgent());
            return $this->success($cached);
        }

        $business = Business::query()
            ->published()
            ->where('subdomain', $subdomain)
            ->with(['template', 'services', 'images' => fn ($q) => $q->ordered()])
            ->first();

        if (! $business) {
            return $this->error('Not found', [], 404);
        }

        RegisterPageVisit::dispatch($business->id, EventType::Visit, $request->ip(), $request->userAgent());
        $data = (new PublicBusinessResource($business))->resolve();
        Cache::put("public_page:{$subdomain}", $data, 60);

        return $this->success($data);
    }

    public function track(Request $request, string $subdomain)
    {
        $data = $request->validate([
            'type' => ['required', 'in:whatsapp_click,phone_click'],
        ]);

        $business = Business::query()->where('subdomain', $subdomain)->firstOrFail();

        RegisterPageVisit::dispatch(
            $business->id,
            EventType::from($data['type']),
            $request->ip(),
            $request->userAgent()
        );

        return $this->success(['ok' => true]);
    }
}
