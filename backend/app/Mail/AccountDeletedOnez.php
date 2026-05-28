<?php

namespace App\Mail;

use DateTimeInterface;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class AccountDeletedOnez extends Mailable
{
    use Queueable, SerializesModels;

    public string $supportUrl;

    public function __construct(
        public string $name,
        public string $requestIp,
        public DateTimeInterface $deletedAt,
    ) {
        $this->supportUrl = rtrim((string) config('app.frontend_url'), '/').'/soporte';
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Tu cuenta ONEZ ha sido eliminada',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.account-deleted',
            with: [
                'name' => $this->name,
                'requestIp' => $this->requestIp ?: 'No disponible',
                'fecha' => $this->deletedAt->format('d/m/Y'),
                'hora' => $this->deletedAt->format('H:i').' UTC',
                'supportUrl' => $this->supportUrl,
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
