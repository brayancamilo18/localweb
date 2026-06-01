<?php

namespace App\Http\Middleware;

use App\Models\Business;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ResolveTenantForWeb
{
    public function handle(Request $request, Closure $next): Response
    {
        $host = $request->getHost();
        $root = (string) config('localweb.domains.root');
        $tenantSuffix = (string) config('localweb.domains.tenant_suffix');

        if ($host === $root) {
            return $next($request);
        }

        $subdomain = null;
        $suffix = '.'.$tenantSuffix;

        if (str_ends_with($host, $suffix)) {
            $prefix = substr($host, 0, -strlen($suffix));
            if ($prefix !== '') {
                $dotPos = strpos($prefix, '.');
                $subdomain = $dotPos === false ? $prefix : substr($prefix, 0, $dotPos);
            }
        }

        if (config('app.env') !== 'production') {
            $headerSubdomain = trim((string) $request->header('X-Tenant-Subdomain', ''));
            if ($headerSubdomain !== '') {
                $subdomain = strtolower($headerSubdomain);
            }
        }

        if ($subdomain === null || $subdomain === '') {
            return $next($request);
        }

        $subdomain = strtolower($subdomain);

        $business = Business::query()
            ->where('subdomain', $subdomain)
            ->where('is_published', true)
            ->with([
                'template',
                'services',
                'images' => fn ($q) => $q->ordered(),
            ])
            ->first();

        if (! $business) {
            abort(404);
        }

        $request->attributes->set('tenant_business', $business);

        return $next($request);
    }
}
