<?php

namespace App\Http\Controllers;

use App\Enums\EventType;
use App\Jobs\RegisterPageVisit;
use App\Models\Business;
use App\Services\JsonLdBuilder;
use App\Services\SeoMetaBuilder;
use App\Services\TenantViewPayload;
use App\Support\PublicPageCache;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\View;
use Symfony\Component\HttpFoundation\Response;
use Throwable;

class PublicTenantPageController extends Controller
{
    public function show(Request $request): Response
    {
        $business = $request->attributes->get('tenant_business');

        if (! $business instanceof Business) {
            abort(404);
        }

        $cached = PublicPageCache::getHtml($business->subdomain);
        if ($cached !== null) {
            $this->registerVisit($business->id, $request);

            return response($cached)->header('X-Cache', 'HIT');
        }

        $slug = $business->template?->slug;
        $viewName = 'public.templates.'.$slug;

        if ($slug === null || ! View::exists($viewName)) {
            $viewName = 'public.templates.urban-bold';
            Log::warning('Tenant page: template not found, using fallback', [
                'business_id' => $business->id,
                'template_slug' => $slug,
            ]);
        }

        $payload = app(TenantViewPayload::class)->build($business);
        $seo = app(SeoMetaBuilder::class)->build($business);
        $jsonLd = app(JsonLdBuilder::class)->build($business);

        $html = view($viewName, array_merge(
            $payload,
            [
                'seo' => $seo,
                'business' => $business,
                'jsonLd' => $jsonLd,
            ]
        ))->render();

        PublicPageCache::putHtml($business->subdomain, $html);

        $this->registerVisit($business->id, $request);

        return response($html)->header('X-Cache', 'MISS');
    }

    public function notFound(): Response
    {
        return response(view('public.404'), 404);
    }

    private function registerVisit(int $businessId, Request $request): void
    {
        try {
            RegisterPageVisit::dispatch(
                $businessId,
                EventType::Visit,
                $request->ip(),
                $request->userAgent(),
            );
        } catch (Throwable $e) {
            Log::warning('Failed to register page visit from tenant page', [
                'business_id' => $businessId,
                'exception' => $e->getMessage(),
            ]);
        }
    }
}
