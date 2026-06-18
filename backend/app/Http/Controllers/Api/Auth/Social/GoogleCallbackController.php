<?php

namespace App\Http\Controllers\Api\Auth\Social;

use App\Models\User;
use App\Services\ProPlanReconciliationService;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Laravel\Socialite\Facades\Socialite;
use Laravel\Socialite\Two\AbstractProvider;

class GoogleCallbackController extends Controller
{
    public function __invoke(Request $request)
    {
        $frontend = rtrim((string) config('app.frontend_url'), '/');

        try {
            /** @var AbstractProvider $google */
            $google = Socialite::driver('google');
            $socialUser = $google->stateless()->user();
        } catch (\Throwable $e) {
            Log::warning('Google OAuth callback failed', [
                'message' => $e->getMessage(),
            ]);

            return redirect()->away($frontend.'/login?social_error=oauth_failed');
        }

        $email = $socialUser->getEmail();

        if ($email === null || trim($email) === '') {
            return redirect()->away($frontend.'/login?social_error=no_email');
        }

        $user = User::query()
            ->where('provider', 'google')
            ->where('provider_id', $socialUser->getId())
            ->first();

        if ($user === null) {
            $user = User::query()->where('email', $email)->first();

            if ($user !== null) {
                $updates = [
                    'provider' => 'google',
                    'provider_id' => $socialUser->getId(),
                    'avatar_url' => $socialUser->getAvatar(),
                ];

                if ($user->email_verified_at === null) {
                    $updates['email_verified_at'] = now();
                }

                $user->forceFill($updates)->save();
            } else {
                $user = User::create([
                    'name' => $socialUser->getName() ?: $socialUser->getNickname() ?: 'Usuario',
                    'email' => $email,
                    'password' => null,
                    'provider' => 'google',
                    'provider_id' => $socialUser->getId(),
                    'avatar_url' => $socialUser->getAvatar(),
                ]);
                $user->forceFill(['email_verified_at' => now()])->save();
            }
        }

        return redirect()->away($this->resolveRedirect($request, $user));
    }

    private function resolveRedirect(Request $request, User $user): string
    {
        Auth::guard('web')->login($user);
        $request->session()->regenerate();

        $frontend = rtrim((string) config('app.frontend_url'), '/');

        if ($user->is_admin) {
            return $frontend.'/admin';
        }

        if ($user->terms_accepted_at === null || $user->business_id === null) {
            return $frontend.'/register/social';
        }

        $user->loadMissing(['business', 'subscriptions']);
        app(ProPlanReconciliationService::class)->reconcile($user);
        $user->load('business');
        $business = $user->business;

        if ($business === null) {
            return $frontend.'/register/social';
        }

        if ($business->onboarding_completed_at !== null) {
            return $frontend.'/dashboard';
        }

        return $frontend.'/onboarding';
    }
}
