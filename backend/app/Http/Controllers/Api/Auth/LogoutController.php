<?php

namespace App\Http\Controllers\Api\Auth;

use App\Http\Controllers\Api\BaseApiController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Laravel\Sanctum\PersonalAccessToken;
use Symfony\Component\HttpFoundation\Response;

class LogoutController extends BaseApiController
{
    public function __invoke(Request $request): Response
    {
        // Compatibilidad con tokens Sanctum (integraciones third-party): solo borramos
        // si el request viene autenticado vía bearer (PersonalAccessToken). En el flujo
        // SPA por cookie, currentAccessToken() devuelve TransientToken (sin delete()).
        $token = $request->user()?->currentAccessToken();
        if ($token instanceof PersonalAccessToken) {
            $token->delete();
        }

        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->noContent();
    }
}
