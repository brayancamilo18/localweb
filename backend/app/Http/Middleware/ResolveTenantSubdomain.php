<?php

namespace App\Http\Middleware;

use App\Models\Business;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ResolveTenantSubdomain
{
    /**
     * Hosts de infra (api.onez.es, app.onez.es) que nginx puede mapear como
     * subdominio; no son tenants de negocio.
     *
     * @var list<string>
     */
    private const RESERVED_SUBDOMAINS = [
        'api',
        'app',
        'www',
        'onez',
        'pre',
        'des',
        'mail',
        'smtp',
        'cdn',
    ];

    /**
     * Rechaza peticiones API con subdominio de tenant inexistente (header X-Tenant-Subdomain).
     */
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->isMethod('OPTIONS')) {
            return $next($request);
        }

        $subdomain = config('app.env') === 'production'
            ? ''
            : trim((string) $request->header('X-Tenant-Subdomain', ''));

        if ($subdomain === '' || $this->isReservedSubdomain($subdomain)) {
            return $next($request);
        }

        $exists = Business::query()
            ->where('subdomain', strtolower($subdomain))
            ->exists();

        if (! $exists) {
            return response()->json(['error' => 'Negocio no encontrado'], 404);
        }

        return $next($request);
    }

    private function isReservedSubdomain(string $subdomain): bool
    {
        return in_array(strtolower($subdomain), self::RESERVED_SUBDOMAINS, true);
    }
}
