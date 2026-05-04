<?php

namespace App\Http\Controllers\Api\Auth;

use App\Exceptions\Auth\InvalidCredentialsException;
use App\Exceptions\Auth\TooManyLoginAttemptsException;
use App\Http\Controllers\Api\BaseApiController;
use App\Http\Resources\BusinessResource;
use App\Http\Resources\UserResource;
use App\Services\AuthService;
use Illuminate\Http\Request;

class LoginController extends BaseApiController
{
    public function __invoke(Request $request, AuthService $authService)
    {
        $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
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

        $user->load(['business.template', 'business.images']);

        $token = $user->createToken('lw-spa', ['*'], now()->addDays(90))->plainTextToken;

        return $this->success([
            'user' => new UserResource($user),
            'token' => $token,
            'business' => $user->business ? new BusinessResource($user->business) : null,
        ]);
    }
}
