<?php

namespace App\Http\Controllers\Api\Dashboard;

use App\Enums\Plan;
use App\Exceptions\Auth\GeocodingException;
use App\Http\Controllers\Api\BaseApiController;
use App\Jobs\GenerateBusinessSeoMeta;
use App\Http\Resources\BusinessResource;
use App\Models\PageVisit;
use App\Services\BusinessService;
use App\Services\GeocodingService;
use App\Services\PlanService;
use App\Support\PublicPageCache;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BusinessController extends BaseApiController
{
    public function show(Request $request, PlanService $plans)
    {
        $user = $request->user();
        $business = $user->business()
            ->with(['template', 'services', 'aboutSections', 'events', 'images' => fn ($q) => $q->ordered()])
            ->firstOrFail();

        if ($plans->canAccessAnalytics($user)) {
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
        }

        return $this->success(new BusinessResource($business));
    }

    public function update(Request $request, BusinessService $service, GeocodingService $geo)
    {
        $business = $request->user()->business;

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

        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:80'],
            'tagline' => ['nullable', 'string', 'max:120'],
            'description' => ['nullable', 'string', 'max:500'],
            'about_title' => ['nullable', 'string', 'max:160'],
            'phone' => ['nullable', 'string', 'max:30'],
            /** Email público de contacto, independiente del email de login del
             * owner: el dueño puede mostrar `info@…` en su web aunque inicie
             * sesión con su correo personal. */
            'email' => ['nullable', 'email', 'max:191'],
            'address' => ['nullable', 'string'],
            'schedule' => ['nullable', 'array'],
            'hide_closed_days' => ['sometimes', 'boolean'],
            'google_maps_url' => ['nullable', 'string', 'max:2048', 'regex:#^https?://.+#i'],
            'google_business_url' => ['nullable', 'string', 'max:2048', 'regex:#^https?://.+#i'],
            'booking_url' => ['nullable', 'string', 'max:2048', 'regex:#^https?://.+#i'],
            'instagram_url' => ['nullable', 'string', 'max:2048', 'regex:#^https?://.+#i'],
            'tiktok_url' => ['nullable', 'string', 'max:2048', 'regex:#^https?://.+#i'],
            'facebook_url' => ['nullable', 'string', 'max:2048', 'regex:#^https?://.+#i'],
            'vcard_enabled' => ['sometimes', 'boolean'],
            'events_enabled' => ['sometimes', 'boolean'],
        ]);

        if (array_key_exists('address', $data) && $data['address'] !== $business->address) {
            try {
                $coords = $geo->geocode(
                    (string) $data['address'],
                    (string) ($business->city ?? '') ?: null,
                    $business->country_code ? strtoupper((string) $business->country_code) : null,
                );
                $data['lat'] = $coords['lat'];
                $data['lng'] = $coords['lng'];
            } catch (\Throwable) {
            }
        }

        // BusinessObserver invalida public_page:{subdomain} en saved.
        $updated = $service->update($business, $data);

        // SEO automático: si Pro y han cambiado description o tagline, regenerar en background.
        if (
            $updated->plan !== Plan::Free &&
            (
                ($request->has('description') && (string) $business->description !== (string) $updated->description) ||
                ($request->has('tagline') && (string) $business->tagline !== (string) $updated->tagline)
            )
        ) {
            GenerateBusinessSeoMeta::dispatch($updated->id)->afterCommit();
        }

        $updated->load(['template', 'services', 'events', 'images' => fn ($q) => $q->ordered()]);

        return $this->success(new BusinessResource($updated));
    }

    /**
     * Actualiza país, ciudad y dirección del negocio y recalcula el pin del mapa.
     *
     * A diferencia de update(), aquí SIEMPRE re-geocodificamos con los valores nuevos
     * (país + ciudad + dirección) para que el marcador caiga en el sitio exacto. Si
     * Nominatim no logra ubicar la dirección, NO guardamos: así la web nunca muestra
     * un pin que no corresponde con la dirección escrita.
     */
    public function updateLocation(Request $request, BusinessService $service, GeocodingService $geo): JsonResponse
    {
        $business = $request->user()->business;

        $data = $request->validate([
            'address' => ['required', 'string', 'max:255'],
            'city' => ['required', 'string', 'max:120'],
            'country' => ['required', 'string', 'max:120'],
            'country_code' => ['required', 'string', 'size:2', 'regex:/^[A-Z]{2}$/'],
        ], [
            'address.required' => 'Indica la dirección de tu negocio.',
            'city.required' => 'Indica la ciudad.',
            'country.required' => 'Indica el país.',
            'country_code.required' => 'Indica el código de país.',
            'country_code.size' => 'El código de país debe tener 2 letras.',
            'country_code.regex' => 'El código de país debe tener 2 letras en mayúscula (por ejemplo, ES).',
        ]);

        try {
            $coords = $geo->geocode(
                $data['address'],
                $data['city'],
                strtoupper($data['country_code']),
            );
        } catch (GeocodingException) {
            return $this->error(
                'No pudimos situar esa dirección en el mapa. Revisa el país, la ciudad y la dirección (incluye el número).',
                ['address' => 'not_found'],
                422,
            );
        }

        // BusinessObserver invalida public_page:{subdomain} en saved.
        $updated = $service->update($business, [
            'address' => $data['address'],
            'city' => $data['city'],
            'country' => $data['country'],
            'country_code' => strtoupper($data['country_code']),
            'lat' => $coords['lat'],
            'lng' => $coords['lng'],
        ]);
        $updated->load(['template', 'services', 'images' => fn ($q) => $q->ordered()]);

        return $this->success([
            'business' => new BusinessResource($updated),
            'geocoded' => true,
            'geocode_precision' => $coords['precision'] ?? 'area',
        ]);
    }

    public function completeTour(Request $request)
    {
        $business = $request->user()->business;
        if ($business->dashboard_tour_completed_at === null) {
            $business->dashboard_tour_completed_at = now();
            $business->save();
        }

        return response()->noContent();
    }

    public function completeProTour(Request $request)
    {
        $business = $request->user()->business;
        if ($business->dashboard_pro_tour_completed_at === null) {
            $business->dashboard_pro_tour_completed_at = now();
            $business->save();
        }

        return response()->noContent();
    }

    public function setSubdomain(Request $request, BusinessService $businessService): JsonResponse
    {
        $business = $request->user()->business;

        if ($business->subdomain_type === 'custom') {
            return $this->error('El subdominio ya está configurado y es inmutable.', [], 422);
        }

        $raw = strtolower(trim((string) ($request->input('subdomain') ?? '')));
        $reason = $businessService->getSubdomainRejectionReason($raw, $business->id);
        if ($reason !== null) {
            return $this->error('Subdominio no válido', ['subdomain' => $reason], 422);
        }

        $previousSubdomain = $business->subdomain;
        $business->subdomain = $raw;
        $business->subdomain_type = 'custom';
        // Tras upgrade Free→Pro, Stripe deja is_published=false hasta elegir el slug público.
        $business->is_published = true;
        $business->save();

        PublicPageCache::forgetSubdomain($previousSubdomain);
        PublicPageCache::forget($business);

        $business->load(['template', 'services', 'images' => fn ($q) => $q->ordered()]);

        return $this->success(new BusinessResource($business));
    }
}
