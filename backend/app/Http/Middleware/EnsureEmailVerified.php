<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureEmailVerified
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user && $user->email_verified_at === null) {
            return response()->json([
                'message' => 'Debes verificar tu correo antes de continuar.',
                'code' => 'email_not_verified',
            ], 403);
        }

        return $next($request);
    }
}
