<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/**
 * Aviso interno cuando un referidor alcanza el umbral de referidos pagadores
 * que requieren entrega manual de plantilla exclusiva.
 */
class ReferrerReachedTemplateGift extends Mailable
{
    use Queueable, SerializesModels;

    public string $adminBusinessUrl;

    public function __construct(
        public string $referrerName,
        public string $referrerEmail,
        public ?int $referrerBusinessId,
        public int $count,
    ) {
        $frontend = rtrim((string) config('app.frontend_url'), '/');
        $this->adminBusinessUrl = $referrerBusinessId
            ? $frontend.'/admin/businesses/'.$referrerBusinessId
            : $frontend.'/admin/businesses';
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "[ONEZ] {$this->referrerName} ha llegado a {$this->count} referidos pagadores",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.referrer-template-gift',
            with: [
                'referrerName' => $this->referrerName,
                'referrerEmail' => $this->referrerEmail,
                'referrerBusinessId' => $this->referrerBusinessId,
                'count' => $this->count,
                'adminBusinessUrl' => $this->adminBusinessUrl,
            ],
        );
    }

    /**
     * @return array<int, mixed>
     */
    public function attachments(): array
    {
        return [];
    }
}
