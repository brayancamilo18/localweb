<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Bloquea el dashboard hasta que el usuario tenga un negocio usable.
 *
 * Casos:
 * - Sin negocio (nunca completó onboarding): 403 con `redirect` → `/onboarding`.
 * - Negocio soft-deleted (p. ej. eliminado desde admin): 403 con `code`
 *   `business_deleted` y sin `redirect`, para no reabrir el wizard y crear otro negocio.
 */
class EnsureBusinessComplete
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user === null) {
            return $next($request);
        }

        $business = $user->business()->withTrashed()->first();

        if ($business?->trashed()) {
            return response()->json([
                'message' => 'Tu negocio ha sido eliminado.',
                'code' => 'business_deleted',
            ], 403);
        }

        if ($business === null) {
            return response()->json([
                'message' => 'Onboarding no completado',
                'redirect' => '/onboarding',
            ], 403);
        }

        return $next($request);
    }
}
