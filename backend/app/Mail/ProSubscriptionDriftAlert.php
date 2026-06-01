<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/**
 * Mailable encolable con resumen de drift Pro.
 *
 * [ESCALA] El array `$drifts` está pre-truncado por el comando (típicamente 200 max).
 * El total real está en `$totalDrifts`. Esto evita que la cola serialice payloads
 * de varios MB cuando hay miles de drifts a la vez (caso de webhook caído).
 */
class ProSubscriptionDriftAlert extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    /**
     * @param  array<int, array<string, mixed>>  $drifts  Lista ya truncada
     * @param  int  $totalDrifts  Total real (puede ser > count($drifts))
     */
    public function __construct(
        public array $drifts,
        public int $totalDrifts,
        public int $auditedPro,
        public int $auditedFreeWithStripe,
        public int $compAccounts,
        public int $resolvedNow,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "[ONEZ] Auditoría Pro: {$this->totalDrifts} alertas de drift",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.pro-subscription-drift-alert',
            with: [
                'drifts' => $this->drifts,
                'totalDrifts' => $this->totalDrifts,
                'remainingDrifts' => max(0, $this->totalDrifts - count($this->drifts)),
                'auditedPro' => $this->auditedPro,
                'auditedFreeWithStripe' => $this->auditedFreeWithStripe,
                'compAccounts' => $this->compAccounts,
                'resolvedNow' => $this->resolvedNow,
                'generatedAt' => now()->toDateTimeString(),
            ],
        );
    }

    /** @return array<int, mixed> */
    public function attachments(): array
    {
        return [];
    }
}
