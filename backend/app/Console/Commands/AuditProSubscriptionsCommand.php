<?php

namespace App\Console\Commands;

use App\Mail\ProSubscriptionDriftAlert;
use App\Models\ProDriftAlert;
use App\Services\ProSubscriptionAuditor;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class AuditProSubscriptionsCommand extends Command
{
    protected $signature = 'app:audit-pro-subscriptions
                            {--no-mail : No enviar email aunque haya drifts}
                            {--prune-resolved-days=0 : Borra alertas resueltas hace más de N días (0 = no podar)}';

    protected $description = 'Audita drift entre business.plan y la suscripción Stripe vía Cashier. Persiste alertas en pro_drift_alerts y envía email resumen.';

    public function handle(): int
    {
        $auditor = new ProSubscriptionAuditor(
            pendingStaleDays: (int) config('pro_subscriptions.audit.pending_stale_days', 7),
        );

        $report = $auditor->audit();

        Log::info('Pro subscription audit completed', [
            'drifts' => count($report['drifts']),
            'audited_pro' => $report['audited_pro'],
            'audited_free_with_stripe' => $report['audited_free_with_stripe'],
            'comp_accounts' => $report['comp_accounts'],
            'resolved_now' => $report['resolved_now'],
        ]);

        $this->info(sprintf(
            'Drifts: %d · Pro/Pending: %d · Free+Stripe: %d · Comp: %d · Resueltos: %d',
            count($report['drifts']),
            $report['audited_pro'],
            $report['audited_free_with_stripe'],
            $report['comp_accounts'],
            $report['resolved_now'],
        ));

        // [ESCALA] Poda opcional de alertas resueltas viejas. Default off (0).
        // Tras la auditoría para no eliminar alertas que acabamos de cerrar.
        $pruneDays = (int) $this->option('prune-resolved-days');
        if ($pruneDays > 0) {
            $pruned = ProDriftAlert::query()
                ->whereNotNull('resolved_at')
                ->where('resolved_at', '<', now()->subDays($pruneDays))
                ->delete();
            Log::info('Pro drift alerts pruned', ['count' => $pruned, 'older_than_days' => $pruneDays]);
            $this->info("Podadas {$pruned} alertas resueltas hace > {$pruneDays} días.");
        }

        if ($this->option('no-mail')) {
            return self::SUCCESS;
        }

        $alertEmail = (string) config('pro_subscriptions.audit.alert_email', '');
        if ($alertEmail === '') {
            Log::info('Pro audit: PRO_AUDIT_ALERT_EMAIL no configurado, omitiendo email');

            return self::SUCCESS;
        }

        $totalDrifts = count($report['drifts']);
        if ($totalDrifts === 0) {
            // Sin drifts: silencio. Evita ruido de "all good" diario.
            return self::SUCCESS;
        }

        // [ESCALA] Truncar antes de pasar al Mailable para que el payload encolado
        // nunca explote. El email indica cuántas alertas hay y dónde consultarlas.
        $maxDisplayed = (int) config('pro_subscriptions.audit.email_max_displayed', 200);
        $displayed = array_slice($report['drifts'], 0, $maxDisplayed);

        Mail::to($alertEmail)->queue(new ProSubscriptionDriftAlert(
            drifts: $displayed,
            totalDrifts: $totalDrifts,
            auditedPro: $report['audited_pro'],
            auditedFreeWithStripe: $report['audited_free_with_stripe'],
            compAccounts: $report['comp_accounts'],
            resolvedNow: $report['resolved_now'],
        ));

        return self::SUCCESS;
    }
}
