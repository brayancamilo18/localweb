<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureBusinessComplete
{
    public function handle(Request $request, Closure $next): Response
    {
        if (! $request->user()?->business) {
            return response()->json([
                'message' => 'Onboarding no completado',
                'redirect' => '/onboarding',
            ], 403);
        }

        return $next($request);
    }
}
