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

    public function publish(Business $business): void
    {
        $business->forceFill([
            'is_published' => true,
            'onboarding_completed_at' => $business->onboarding_completed_at ?? now(),
        ])->save();
    }

    public function isSubdomainAvailable(string $subdomain, ?int $excludeId = null): bool
    {
        $query = Business::query()->where('subdomain', strtolower($subdomain));

        if ($excludeId !== null) {
            $query->whereKeyNot($excludeId);
        }

        return ! $query->exists();
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
