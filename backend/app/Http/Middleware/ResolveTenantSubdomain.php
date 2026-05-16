<?php

namespace App\Http\Middleware;

use App\Models\Business;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ResolveTenantSubdomain
{
    /**
     * Rechaza peticiones API con subdominio de tenant inexistente (header X-Tenant-Subdomain).
     */
    public function handle(Request $request, Closure $next): Response
    {
        $subdomain = trim((string) $request->header('X-Tenant-Subdomain', ''));

        if ($subdomain === '') {
            return $next($request);
        }

        $exists = Business::query()
            ->where('subdomain', strtolower($subdomain))
            ->exists();

        if (! $exists) {
            return response()->json(['error' => 'Tenant not found'], 404);
        }

        return $next($request);
    }
}
