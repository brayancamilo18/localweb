<?php

namespace App\Http\Controllers\Api\Admin;

use App\Enums\EventType;
use App\Enums\Plan;
use App\Http\Controllers\Api\BaseApiController;
use App\Http\Requests\Admin\UpdateBusinessRequest;
use App\Http\Resources\AdminBusinessDetailResource;
use App\Http\Resources\AdminBusinessResource;
use App\Models\Business;
use App\Models\BusinessImage;
use App\Models\PageVisit;
use App\Models\User;
use App\Services\BusinessService;
use App\Services\GeocodingService;
use App\Support\PublicPageCache;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class BusinessesController extends BaseApiController
{
    public function index(Request $request)
    {
        $validated = $request->validate([
            'per_page' => ['sometimes', 'integer', 'min:1', 'max:100'],
            'search' => ['sometimes', 'string', 'max:120'],
            'sector' => ['sometimes', 'string', 'max:60'],
            'plan' => ['sometimes', 'string', 'in:free,pro,pending'],
            'is_published' => ['sometimes', 'boolean'],
            'onboarding_completed' => ['sometimes', 'boolean'],
            'with_trashed' => ['sometimes', 'boolean'],
            'sort' => ['sometimes', 'string', 'in:name,created_at,plan_activated_at'],
            'direction' => ['sometimes', 'string', 'in:asc,desc'],
        ]);

        $perPage = (int) ($validated['per_page'] ?? 20);

        $query = Business::query()
            ->select('businesses.*')
            ->addSelect([
                'owner_email' => User::query()
                    ->select('email')
                    ->whereColumn('business_id', 'businesses.id')
                    ->orderBy('users.id')
                    ->limit(1),
            ])
            ->withCount([
                'pageVisits as total_visits' => fn ($q) => $q->where('event_type', EventType::Visit),
            ]);

        if ($request->boolean('with_trashed')) {
            $query->withTrashed();
        }

        if (! empty($validated['search'])) {
            $term = '%'.$validated['search'].'%';
            $query->where(function ($q) use ($term) {
                $q->where('businesses.name', 'like', $term)
                    ->orWhere('businesses.subdomain', 'like', $term);
            });
        }

        if (! empty($validated['sector'])) {
            $query->where('businesses.sector', $validated['sector']);
        }

        if (! empty($validated['plan'])) {
            $query->where('businesses.plan', $validated['plan']);
        }

        if ($request->has('is_published')) {
            $query->where('businesses.is_published', $request->boolean('is_published'));
        }

        if ($request->has('onboarding_completed')) {
            if ($request->boolean('onboarding_completed')) {
                $query->whereNotNull('businesses.onboarding_completed_at');
            } else {
                $query->whereNull('businesses.onboarding_completed_at');
            }
        }

        $sort = $validated['sort'] ?? 'created_at';
        $direction = $validated['direction'] ?? 'desc';
        $query->orderBy('businesses.'.$sort, $direction);

        $paginator = $query->paginate($perPage)->withQueryString();

        return $this->success([
            'items' => AdminBusinessResource::collection($paginator->items())->resolve(),
            'pagination' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
                'from' => $paginator->firstItem(),
                'to' => $paginator->lastItem(),
            ],
        ]);
    }

    public function show(Business $business)
    {
        $business->load([
            'owner',
            'template',
            'services',
            'images' => fn ($q) => $q->ordered(),
        ]);

        $visitCountsRaw = PageVisit::query()
            ->where('business_id', $business->id)
            ->selectRaw('event_type, COUNT(*) as c')
            ->groupBy('event_type')
            ->pluck('c', 'event_type');

        $visitCounts = [
            'visit' => (int) ($visitCountsRaw['visit'] ?? 0),
            'whatsapp_click' => (int) ($visitCountsRaw['whatsapp_click'] ?? 0),
            'phone_click' => (int) ($visitCountsRaw['phone_click'] ?? 0),
        ];

        return $this->success([
            'business' => array_merge(
                (new AdminBusinessDetailResource($business))->resolve(),
                ['visit_counts' => $visitCounts],
            ),
        ]);
    }

    public function update(
        UpdateBusinessRequest $request,
        Business $business,
        BusinessService $service,
        GeocodingService $geo,
    ) {
        foreach (['google_maps_url', 'google_business_url', 'booking_url', 'instagram_url', 'tiktok_url', 'facebook_url'] as $field) {
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

        $data = $request->validated();

        if (
            array_key_exists('plan', $data)
            && Plan::from($data['plan']) === Plan::Pro
            && $business->plan !== Plan::Pro
            && ! array_key_exists('plan_activated_at', $data)
        ) {
            $data['plan_activated_at'] = now();
        }

        if (array_key_exists('address', $data) && (string) ($data['address'] ?? '') !== (string) ($business->address ?? '')) {
            try {
                $coords = $geo->geocode(
                    (string) ($data['address'] ?? ''),
                    (string) ($data['city'] ?? $business->city ?? '') ?: null,
                    strtoupper((string) ($data['country_code'] ?? $business->country_code ?? '')) ?: null,
                );
                $data['lat'] = $coords['lat'];
                $data['lng'] = $coords['lng'];
            } catch (\Throwable) {
            }
        }

        // BusinessObserver invalida public_page:{subdomain} en saved.
        $updated = $service->update($business, $data);

        $updated->load([
            'owner',
            'template',
            'services',
            'images' => fn ($q) => $q->ordered(),
        ]);

        $visitCountsRaw = PageVisit::query()
            ->where('business_id', $updated->id)
            ->selectRaw('event_type, COUNT(*) as c')
            ->groupBy('event_type')
            ->pluck('c', 'event_type');

        $visitCounts = [
            'visit' => (int) ($visitCountsRaw['visit'] ?? 0),
            'whatsapp_click' => (int) ($visitCountsRaw['whatsapp_click'] ?? 0),
            'phone_click' => (int) ($visitCountsRaw['phone_click'] ?? 0),
        ];

        return $this->success([
            'business' => array_merge(
                (new AdminBusinessDetailResource($updated))->resolve(),
                ['visit_counts' => $visitCounts],
            ),
        ]);
    }

    public function togglePublish(Business $business)
    {
        // BusinessObserver invalida public_page:{subdomain} en saved.
        $business->is_published = ! $business->is_published;
        $business->save();

        return $this->success([
            'is_published' => (bool) $business->is_published,
        ]);
    }

    public function destroy(Business $business)
    {
        if ($business->trashed()) {
            return response()->noContent();
        }

        // BusinessObserver invalida public_page:{subdomain} en deleted.
        $business->delete();

        return response()->noContent();
    }

    public function restore(Business $business)
    {
        if (! $business->trashed()) {
            return $this->error('El negocio no está eliminado', [], 422);
        }

        // BusinessObserver invalida public_page:{subdomain} en restored.
        $business->restore();

        return response()->noContent();
    }

    public function forceDelete(Business $business)
    {
        if (! $business->trashed()) {
            return $this->error(
                'Solo se puede borrar permanentemente un negocio ya eliminado (soft delete)',
                [],
                422,
            );
        }

        $subdomain = $business->subdomain;

        DB::transaction(function () use ($business): void {
            foreach (BusinessImage::query()->where('business_id', $business->id)->cursor() as $image) {
                Storage::disk('r2')->delete($image->path);
            }

            if ($business->logo_path) {
                Storage::disk('r2')->delete($business->logo_path);
            }

            // PageVisit::query()->delete() es bulk → no afecta a public_page; el observer de Business
            // disparará en forceDelete dentro de esta transacción.
            PageVisit::query()->where('business_id', $business->id)->delete();

            $business->forceDelete();
        });

        // Defensa en profundidad: el observer ya invalidó, pero llamamos al helper por si en algún
        // entorno los eventos quedaran desactivados (p. ej. `withoutEvents`).
        PublicPageCache::forgetSubdomain($subdomain);

        return response()->noContent();
    }
}
