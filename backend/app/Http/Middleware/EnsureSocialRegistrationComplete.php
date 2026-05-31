<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureSocialRegistrationComplete
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user === null) {
            return $next($request);
        }

        if ($user->provider !== null && $user->provider !== ''
            && ($user->business_id === null || $user->terms_accepted_at === null)) {
            return response()->json([
                'message' => 'Completa el registro con los datos de tu negocio.',
                'redirect' => '/register/social',
            ], 403);
        }

        return $next($request);
    }
}
