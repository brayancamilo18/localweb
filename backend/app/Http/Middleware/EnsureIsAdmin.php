<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureIsAdmin
{
    /**
     * Deniega acceso con 403 si no hay usuario autenticado o si no es administrador.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user || ! $user->is_admin) {
            return response()->json([
                'message' => 'No tienes permiso para acceder a esta sección.',
            ], 403);
        }

        return $next($request);
    }
}
