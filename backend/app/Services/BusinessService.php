<?php

namespace App\Services;

use App\Models\Business;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class BusinessService
{
    public function createFromOnboarding(User $owner, array $data, string $plan): Business
    {
        return DB::transaction(function () use ($owner, $data, $plan): Business {
            $businessData = $data;
            $businessData['plan'] = $plan;

            if ($plan === 'free') {
                $businessData['subdomain'] = $this->generateRandomSubdomain();
                $businessData['is_published'] = true;
            } elseif ($plan === 'pro' || $plan === 'pending') {
                // pending = Pro en checkout; mismo subdominio reservado que el elegido en onboarding
                $businessData['subdomain'] = strtolower((string) ($data['subdomain'] ?? ''));
                $businessData['is_published'] = false;
            } else {
                $businessData['subdomain'] = $this->generateRandomSubdomain();
                $businessData['is_published'] = false;
            }

            $business = Business::create($businessData);

            $owner->forceFill(['business_id' => $business->id])->save();

            return $business;
        });
    }

    public function update(Business $business, array $data): Business
    {
        $business->fill($data);
        $business->save();

        return $business->refresh();
    }

    /**
     * Marca el negocio como publicado (visible en su subdominio).
     *
     * Antes esto también seteaba `onboarding_completed_at`, pero eso provocaba que el
     * `OnboardingGuard` del frontend echara al usuario Pro fuera del wizard antes de
     * poder configurar los extras (paso 9: servicios + integraciones). Ahora ese
     * marcado se hace en `completeOnboarding()`, que step8 invoca solo para Free
     * (y el endpoint /onboarding/finalize para Pro/Pending tras step9).
     */
    public function publish(Business $business): void
    {
        $business->forceFill(['is_published' => true])->save();
    }

    /**
     * Marca el onboarding como terminado. Es lo que activa la entrada al dashboard
     * (`hasCompletedOnboarding` en el front, vía `business.onboarding_completed_at`).
     * Idempotente: si ya estaba marcado, no lo sobrescribe.
     */
    public function completeOnboarding(Business $business): void
    {
        if ($business->onboarding_completed_at !== null) {
            return;
        }
        $business->forceFill(['onboarding_completed_at' => now()])->save();
    }

    public function isSubdomainAvailable(string $subdomain, ?int $excludeId = null): bool
    {
        return $this->getSubdomainRejectionReason($subdomain, $excludeId) === null;
    }

    /**
     * Devuelve el motivo concreto por el que el subdominio NO está disponible
     * (uno de: reserved, too_short, too_long, invalid_format, taken) o `null`
     * si está libre y cumple las reglas.
     */
    public function getSubdomainRejectionReason(string $subdomain, ?int $excludeId = null): ?string
    {
        $normalized = strtolower(trim($subdomain));

        $min = (int) config('subdomains.min_length', 3);
        $max = (int) config('subdomains.max_length', 63);

        if (strlen($normalized) < $min) {
            return 'too_short';
        }
        if (strlen($normalized) > $max) {
            return 'too_long';
        }

        $pattern = (string) config('subdomains.pattern', '/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/');
        if (! preg_match($pattern, $normalized)) {
            return 'invalid_format';
        }

        $reserved = (array) config('subdomains.reserved', []);
        if (in_array($normalized, $reserved, true)) {
            return 'reserved';
        }

        $query = Business::query()->where('subdomain', $normalized);
        if ($excludeId !== null) {
            $query->whereKeyNot($excludeId);
        }

        if ($query->exists()) {
            return 'taken';
        }

        return null;
    }

    public function generateSubdomainSuggestion(string $businessName): string
    {
        $base = Str::slug($businessName);
        $base = str_replace('-', '', $base);
        $base = substr($base, 0, 10);
        $base = $base !== '' ? $base : 'localweb';

        $suggestion = strtolower($base . '-' . Str::lower(Str::random(4)));
        $suggestion = preg_replace('/[^a-z0-9-]/', '', $suggestion) ?: $this->generateRandomSubdomain();

        if (! $this->isSubdomainAvailable($suggestion)) {
            return $this->generateRandomSubdomain();
        }

        return $suggestion;
    }

    public function generateRandomSubdomain(): string
    {
        $alphabet = 'bcdfghjkmnpqrstvwxyz23456789';

        do {
            $partA = $this->randomFromAlphabet($alphabet, 3);
            $partB = $this->randomFromAlphabet($alphabet, 4);
            $partC = $this->randomFromAlphabet($alphabet, 4);
            $subdomain = "{$partA}-{$partB}-{$partC}";
        } while (! $this->isSubdomainAvailable($subdomain));

        return $subdomain;
    }

    private function randomFromAlphabet(string $alphabet, int $length): string
    {
        $result = '';
        $max = strlen($alphabet) - 1;

        for ($i = 0; $i < $length; $i++) {
            $result .= $alphabet[random_int(0, $max)];
        }

        return $result;
    }
}
