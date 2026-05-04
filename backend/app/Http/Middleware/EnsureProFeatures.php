<?php

namespace App\Http\Middleware;

use App\Support\ProFeatures;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureProFeatures
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user === null || ! ProFeatures::canUseProFeatures($user)) {
            return response()->json([
                'message' => 'Esta función solo está disponible en el plan Pro.',
            ], 403);
        }

        return $next($request);
    }
}
