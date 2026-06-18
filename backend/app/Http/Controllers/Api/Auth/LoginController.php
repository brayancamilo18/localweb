<?php

namespace App\Http\Controllers\Api\Auth;

use App\Exceptions\Auth\InvalidCredentialsException;
use App\Exceptions\Auth\TooManyLoginAttemptsException;
use App\Http\Controllers\Api\BaseApiController;
use App\Http\Resources\BusinessResource;
use App\Http\Resources\UserResource;
use App\Models\SecurityEvent;
use App\Services\AuthService;
use App\Services\ProPlanReconciliationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class LoginController extends BaseApiController
{
    public function __invoke(Request $request, AuthService $authService, ProPlanReconciliationService $planReconciliation)
    {
        $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ], [
            'email.required' => 'Introduce tu correo electrónico.',
            'email.email' => 'Introduce un correo electrónico válido.',
            'password.required' => 'Introduce tu contraseña.',
        ]);

        $key = $authService->getRateLimitKey($request);

        try {
            $authService->checkRateLimit($key);
            $user = $authService->attemptLogin($request->string('email')->toString(), $request->string('password')->toString());
            $authService->clearRateLimit($key);
        } catch (TooManyLoginAttemptsException $e) {
            return $this->error('Demasiados intentos', ['seconds_until_release' => $e->secondsUntilRelease], 429);
        } catch (InvalidCredentialsException) {
            $authService->incrementFailedAttempts($key);

            return $this->error('Credenciales incorrectas', [], 401);
        }

        // Sanctum SPA: la cookie HttpOnly de sesión sustituye al bearer token.
        // Regeneramos el ID de sesión para mitigar session-fixation tras login.
        Auth::guard('web')->login($user);
        $request->session()->regenerate();

        SecurityEvent::record($user, SecurityEvent::TYPE_LOGIN, $request);

        $user->load(['business.template', 'business.images', 'subscriptions']);
        $planReconciliation->reconcile($user);
        $user->load(['business.template', 'business.images']);

        return $this->success([
            'user' => new UserResource($user),
            'business' => $user->business ? new BusinessResource($user->business) : null,
        ]);
    }
}
