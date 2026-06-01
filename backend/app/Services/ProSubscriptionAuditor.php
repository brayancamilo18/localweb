<?php

namespace App\Services;

use App\Enums\Plan;
use App\Models\Business;
use App\Models\ProDriftAlert;
use App\Models\User;
use Carbon\CarbonImmutable;

/**
 * Cruza el plan local (`business.plan`) con el estado de la suscripción Stripe
 * (vía Cashier `$user->subscribed('default')`) y registra discrepancias en
 * `pro_drift_alerts`. NO altera el estado del negocio: sólo observa.
 *
 * Diseñado para escalar a cientos de miles de usuarios:
 *  - chunkById(500) → 500 negocios por query en vez de iterar uno a uno.
 *  - Eager load `owner.subscriptions` → `subscribed()` consulta la colección en
 *    memoria, NO dispara query por usuario (evita N+1 catastrófico a escala).
 *  - Sólo escribe (INSERT/UPDATE en pro_drift_alerts) cuando hay drift; las cuentas
 *    correctas no generan I/O adicional.
 *
 * Tipos de drift:
 *  - `pro_without_subscription`: plan=pro, owner tiene stripe_id, no subscribed
 *  - `pending_stale`: plan=pending hace > pendingStaleDays sin suscripción activa
 *  - `free_with_subscription`: plan=free, owner subscribed (cliente paga sin Pro)
 *  - `no_owner`: business sin User dueño (caso patológico)
 *
 * Idempotencia: si ya existe una alerta abierta para el mismo (business_id,
 * drift_type), se actualiza `detected_at` y `notes` en vez de crear una nueva.
 * Cuando una condición de drift previamente detectada se resuelve, las alertas
 * abiertas correspondientes se cierran (`resolved_at = now()`).
 */
class ProSubscriptionAuditor
{
    /** Tamaño de lote para chunkById. 500 es el punto dulce entre memoria y queries. */
    private const CHUNK_SIZE = 500;

    /** @var array<int, list<string>> */
    private array $openDriftTypesByBusiness = [];

    private bool $openAlertsLoaded = false;

    public function __construct(
        private readonly int $pendingStaleDays = 7,
    ) {}

    /**
     * @return array{
     *     drifts: array<int, array<string, mixed>>,
     *     audited_pro: int,
     *     audited_free_with_stripe: int,
     *     comp_accounts: int,
     *     resolved_now: int
     * }
     */
    public function audit(): array
    {
        $this->ensureOpenAlertsLoaded();

        $report = [
            'drifts' => [],
            'audited_pro' => 0,
            'audited_free_with_stripe' => 0,
            'comp_accounts' => 0,
            'resolved_now' => 0,
        ];

        // 1) Negocios Pro o Pending: ¿tienen suscripción activa?
        // [ESCALA] with('owner.subscriptions') eager-carga TODAS las suscripciones
        // del lote en 2 queries (1 negocios + 1 suscripciones por lote), en vez de
        // disparar una query nueva en cada llamada a $owner->subscribed('default').
        Business::query()
            ->whereIn('plan', [Plan::Pro->value, Plan::Pending->value])
            ->with(['owner.subscriptions'])
            ->chunkById(self::CHUNK_SIZE, function ($chunk) use (&$report) {
                foreach ($chunk as $business) {
                    $report['audited_pro']++;
                    $this->auditProOrPending($business, $report);
                }
            });

        // 2) Negocios Free con stripe_id: ¿están pagando sin Pro?
        Business::query()
            ->where('plan', Plan::Free->value)
            ->with(['owner.subscriptions'])
            ->chunkById(self::CHUNK_SIZE, function ($chunk) use (&$report) {
                foreach ($chunk as $business) {
                    $owner = $business->owner;
                    if ($owner === null || $owner->stripe_id === null) {
                        continue;
                    }
                    $report['audited_free_with_stripe']++;
                    $this->auditFreeWithStripe($business, $owner, $report);
                }
            });

        return $report;
    }

    private function ensureOpenAlertsLoaded(): void
    {
        if ($this->openAlertsLoaded) {
            return;
        }

        foreach (ProDriftAlert::query()->open()->get(['business_id', 'drift_type']) as $alert) {
            $this->openDriftTypesByBusiness[$alert->business_id][] = $alert->drift_type;
        }

        $this->openAlertsLoaded = true;
    }

    private function auditProOrPending(Business $business, array &$report): void
    {
        $owner = $business->owner;

        if ($owner === null) {
            $this->record($business, null, 'no_owner', 'Pro/Pending sin User dueño', null, $report);

            return;
        }

        if ($owner->stripe_id === null) {
            // Comp account: intencional, sin Stripe. Resolver alertas previas.
            $report['comp_accounts']++;
            $report['resolved_now'] += $this->resolveAny($business, [
                'pro_without_subscription', 'pending_stale', 'no_owner',
            ]);

            return;
        }

        if ($business->plan === Plan::Pending) {
            $activated = $business->plan_activated_at;
            $ageDays = $activated
                ? CarbonImmutable::parse($activated)->diffInDays(now())
                : 0;

            if ($ageDays > $this->pendingStaleDays && ! $owner->subscribed('default')) {
                $this->record(
                    $business,
                    $owner,
                    'pending_stale',
                    "Pending hace {$ageDays} días sin suscripción activa (checkout abandonado).",
                    $this->subscriptionStatus($owner),
                    $report,
                );

                return;
            }

            $report['resolved_now'] += $this->resolveAny($business, [
                'pro_without_subscription', 'pending_stale',
            ]);

            return;
        }

        // Plan Pro
        if (! $owner->subscribed('default')) {
            $this->record(
                $business,
                $owner,
                'pro_without_subscription',
                'Plan Pro pero suscripción Stripe no activa.',
                $this->subscriptionStatus($owner),
                $report,
            );

            return;
        }

        $report['resolved_now'] += $this->resolveAny($business, [
            'pro_without_subscription', 'pending_stale', 'no_owner',
        ]);
    }

    private function auditFreeWithStripe(Business $business, User $owner, array &$report): void
    {
        if ($owner->subscribed('default')) {
            $this->record(
                $business,
                $owner,
                'free_with_subscription',
                'Plan Free pero tiene suscripción Stripe activa (paga sin recibir Pro).',
                $this->subscriptionStatus($owner),
                $report,
            );

            return;
        }

        $report['resolved_now'] += $this->resolveAny($business, ['free_with_subscription']);
    }

    private function subscriptionStatus(User $owner): ?string
    {
        // [ESCALA] subscription() lee la colección eager-loaded; sin nueva query.
        $sub = $owner->subscription('default');

        return $sub?->stripe_status;
    }

    /**
     * Crea o refresca una alerta abierta para (business, drift_type).
     */
    private function record(
        Business $business,
        ?User $owner,
        string $type,
        string $note,
        ?string $stripeStatus,
        array &$report,
    ): void {
        $existing = ProDriftAlert::query()
            ->where('business_id', $business->id)
            ->where('drift_type', $type)
            ->whereNull('resolved_at')
            ->first();

        $planValue = $business->plan instanceof Plan ? $business->plan->value : (string) $business->plan;

        $payload = [
            'user_id' => $owner?->id,
            'stripe_customer_id' => $owner?->stripe_id,
            'plan_value' => $planValue,
            'subscription_status' => $stripeStatus,
            'plan_activated_at' => $business->plan_activated_at,
            'detected_at' => now(),
            'notes' => $note,
        ];

        if ($existing) {
            $existing->update($payload);
        } else {
            ProDriftAlert::create(array_merge($payload, [
                'business_id' => $business->id,
                'drift_type' => $type,
            ]));
            $this->openDriftTypesByBusiness[$business->id][] = $type;
        }

        $report['drifts'][] = [
            'business_id' => $business->id,
            'business_name' => $business->name,
            'subdomain' => $business->subdomain,
            'user_email' => $owner?->email,
            'drift_type' => $type,
            'plan_value' => $planValue,
            'subscription_status' => $stripeStatus,
            'note' => $note,
        ];
    }

    /**
     * Cierra alertas abiertas para los tipos dados. Devuelve cuántas se cerraron.
     */
    private function resolveAny(Business $business, array $driftTypes): int
    {
        $open = $this->openDriftTypesByBusiness[$business->id] ?? [];
        $toClose = array_values(array_intersect($driftTypes, $open));

        if ($toClose === []) {
            return 0;
        }

        $count = ProDriftAlert::query()
            ->where('business_id', $business->id)
            ->whereIn('drift_type', $toClose)
            ->whereNull('resolved_at')
            ->update(['resolved_at' => now()]);

        $remaining = array_values(array_diff($open, $toClose));
        if ($remaining === []) {
            unset($this->openDriftTypesByBusiness[$business->id]);
        } else {
            $this->openDriftTypesByBusiness[$business->id] = $remaining;
        }

        return $count;
    }
}
