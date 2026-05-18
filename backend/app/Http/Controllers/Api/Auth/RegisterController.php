<?php

namespace App\Http\Controllers\Api\Auth;

use App\Http\Controllers\Api\BaseApiController;
use App\Http\Resources\UserResource;
use App\Models\Referral;
use App\Models\User;
use Illuminate\Database\QueryException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class RegisterController extends BaseApiController
{
    public function __invoke(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
            'referral_code' => ['nullable', 'string', 'max:16'],
        ]);

        // El modelo aplica el cast 'hashed' a password: no usar Hash::make aquí (evita doble hash).
        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => $data['password'],
        ]);

        $this->linkReferral($user, $data['referral_code'] ?? null);

        $user->sendEmailVerificationNotification();

        // Sanctum SPA: arrancamos sesión vía guard `web`. Regeneramos el ID de sesión
        // tras crear la cuenta (defensa contra session-fixation).
        Auth::guard('web')->login($user);
        $request->session()->regenerate();

        return $this->success([
            'user' => new UserResource($user),
            'business' => null,
        ], 'Usuario registrado', 201);
    }

    private function linkReferral(User $newUser, ?string $code): void
    {
        $code = is_string($code) ? trim($code) : null;

        if ($code === null || $code === '') {
            return;
        }

        $referrer = User::query()->where('referral_code', strtolower($code))->first();

        if ($referrer === null) {
            Log::info('Referral code unknown, ignored', ['referral_code' => $code]);

            return;
        }

        if ($referrer->id === $newUser->id) {
            return;
        }

        if (strcasecmp($referrer->email, $newUser->email) === 0) {
            return;
        }

        $taken = $referrer->referralsAsReferrer()
            ->whereIn('status', [Referral::STATUS_PAID, Referral::STATUS_REWARDED])
            ->count();

        if ($taken >= config('referrals.max_referrals')) {
            Log::info('Referrer reached max referrals', [
                'referrer_user_id' => $referrer->id,
                'taken' => $taken,
            ]);

            return;
        }

        try {
            Referral::create([
                'referrer_user_id' => $referrer->id,
                'referred_user_id' => $newUser->id,
                'referred_email' => $newUser->email,
                'status' => Referral::STATUS_REGISTERED,
            ]);
        } catch (QueryException $e) {
            Log::warning('Referral link collision on register', [
                'new_user_id' => $newUser->id,
                'referrer_user_id' => $referrer->id,
                'message' => $e->getMessage(),
            ]);
        }
    }
}
