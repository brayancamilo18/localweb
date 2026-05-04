<?php

namespace App\Services;

use App\Exceptions\Auth\InvalidCredentialsException;
use App\Exceptions\Auth\TooManyLoginAttemptsException;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;

class AuthService
{
    public function attemptLogin(string $email, string $password): User
    {
        if (! Auth::attempt(['email' => $email, 'password' => $password])) {
            throw new InvalidCredentialsException();
        }

        /** @var User $user */
        $user = Auth::user();

        return $user;
    }

    public function getRateLimitKey(Request $request): string
    {
        $email = strtolower((string) $request->input('email', ''));
        $ip = (string) $request->ip();

        return "login:{$ip}:{$email}";
    }

    public function checkRateLimit(string $key): void
    {
        $attempts = (int) Cache::get("{$key}:attempts", 0);
        $expiresAt = (int) Cache::get("{$key}:expires_at", 0);

        if ($attempts < 5) {
            return;
        }

        $secondsUntilRelease = max(0, $expiresAt - time());

        if ($secondsUntilRelease > 0) {
            throw new TooManyLoginAttemptsException($secondsUntilRelease);
        }

        $this->clearRateLimit($key);
    }

    public function incrementFailedAttempts(string $key): void
    {
        Cache::add("{$key}:attempts", 0, 60);
        Cache::increment("{$key}:attempts");
        Cache::put("{$key}:expires_at", time() + 60, 60);
    }

    public function clearRateLimit(string $key): void
    {
        Cache::forget("{$key}:attempts");
        Cache::forget("{$key}:expires_at");
    }
}
