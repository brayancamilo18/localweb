<?php

namespace App\Http\Controllers;

use App\Models\Business;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Symfony\Component\HttpFoundation\Response;

class PublicRobotsController extends Controller
{
    public function show(Request $request): Response
    {
        $business = $request->attributes->get('tenant_business');

        if ($business === null) {
            $cacheKey = 'robots:root';
            $cached = Cache::get($cacheKey);
            if ($cached) {
                return $this->robotsResponse($cached);
            }
            $content = $this->rootRobotsContent();
            Cache::put($cacheKey, $content, 3600);

            return $this->robotsResponse($content);
        }

        $cacheKey = 'robots:'.$business->subdomain;
        $cached = Cache::get($cacheKey);
        if ($cached) {
            return $this->robotsResponse($cached);
        }
        $content = $this->tenantRobotsContent($business);
        Cache::put($cacheKey, $content, 3600);

        return $this->robotsResponse($content);
    }

    private function rootRobotsContent(): string
    {
        $root = (string) config('localweb.domains.root');

        return implode(PHP_EOL, [
            'User-agent: *',
            'Allow: /',
            'Disallow: /dashboard',
            'Disallow: /dashboard/',
            'Disallow: /admin',
            'Disallow: /admin/',
            'Disallow: /api/',
            'Disallow: /onboarding',
            'Disallow: /onboarding/',
            'Disallow: /login',
            'Disallow: /register',
            'Disallow: /verify-email',
            'Disallow: /forgot-password',
            'Disallow: /reset-password',
            'Sitemap: https://'.$root.'/sitemap-index.xml',
            '',
        ]);
    }

    private function tenantRobotsContent(Business $business): string
    {
        $sitemap = 'https://'.$business->subdomain.'.'.config('localweb.domains.tenant_suffix').'/sitemap.xml';

        return implode(PHP_EOL, [
            'User-agent: *',
            'Allow: /',
            'Disallow: /api/',
            'Sitemap: '.$sitemap,
            '',
        ]);
    }

    private function robotsResponse(string $content): Response
    {
        return response($content, 200)
            ->header('Content-Type', 'text/plain');
    }
}
