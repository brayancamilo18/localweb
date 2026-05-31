<?php

namespace App\Http\Controllers\Api\Auth\Social;

use App\Http\Controllers\Api\BaseApiController;
use App\Http\Resources\BusinessResource;
use App\Http\Resources\UserResource;
use App\Models\Referral;
use App\Models\User;
use App\Services\BusinessSectorService;
use App\Services\BusinessService;
use Illuminate\Database\QueryException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class CompleteRegistrationController extends BaseApiController
{
    public function __invoke(
        Request $request,
        BusinessService $businessService,
        BusinessSectorService $sectors,
    ) {
        $user = $request->user();

        if ($user->business_id !== null && $user->terms_accepted_at !== null) {
            return $this->error('El registro social ya está completado.', [], 409);
        }

        $data = $request->validate([
            'business_name' => ['required', 'string', 'max:80'],
            'sector' => ['required', 'string'],
            'city' => ['required', 'string', 'max:120'],
            'country' => ['required', 'string', 'max:120'],
            'country_code' => ['required', 'string', 'size:2', 'regex:/^[A-Za-z]{2}$/'],
            'accept_terms' => ['required', 'accepted'],
            'marketing_consent' => ['sometimes', 'boolean'],
            'referral_code' => ['nullable', 'string', 'max:16'],
        ], [
            'business_name.required' => 'Indica el nombre de tu negocio.',
            'sector.required' => 'Selecciona el sector de tu negocio.',
            'city.required' => 'Indica la ciudad.',
            'country.required' => 'Indica el país.',
            'country_code.required' => 'Indica el código de país.',
            'country_code.size' => 'El código de país debe tener 2 letras.',
            'country_code.regex' => 'El código de país debe tener 2 letras (por ejemplo, ES).',
            'accept_terms.required' => 'Debes aceptar las condiciones para continuar.',
            'accept_terms.accepted' => 'Debes aceptar las condiciones para continuar.',
        ]);

        if (! $sectors->exists($data['sector'])) {
            return $this->error('El sector seleccionado no es válido.', ['sector' => ['El sector seleccionado no es válido.']], 422);
        }

        if ($user->business_id !== null) {
            return $this->error('El registro social ya está completado.', [], 409);
        }

        $business = $businessService->createAtRegistration($user, [
            'business_name' => trim($data['business_name']),
            'sector' => $data['sector'],
            'city' => trim($data['city']),
            'country' => trim($data['country']),
            'country_code' => strtoupper($data['country_code']),
        ]);

        $acceptedAt = now();
        $user->forceFill([
            'terms_accepted_at' => $acceptedAt,
            'terms_version' => (string) config('legal.terms_version'),
            'privacy_policy_version' => (string) config('legal.privacy_version'),
            'marketing_consent_at' => ! empty($data['marketing_consent']) ? $acceptedAt : null,
        ])->save();

        $this->linkReferral($user, $data['referral_code'] ?? null);

        return $this->success([
            'user' => new UserResource($user->fresh()->load('business')),
            'business' => new BusinessResource($business),
        ], 'Registro completado', 201);
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
