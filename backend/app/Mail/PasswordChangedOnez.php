<?php

namespace App\Mail;

use DateTimeInterface;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class PasswordChangedOnez extends Mailable
{
    use Queueable, SerializesModels;

    public string $forgotPasswordUrl;

    public string $supportUrl;

    public function __construct(
        public string $name,
        public string $email,
        public string $requestIp,
        public DateTimeInterface $changedAt,
    ) {
        $frontend = rtrim((string) config('app.frontend_url'), '/');
        $this->forgotPasswordUrl = $frontend.'/forgot-password';
        $this->supportUrl = $frontend.'/soporte';
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Tu contraseña de ONEZ se ha cambiado',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.password-changed',
            with: [
                'name' => $this->name,
                'email' => $this->email,
                'requestIp' => $this->requestIp ?: 'No disponible',
                'fecha' => $this->changedAt->format('d/m/Y'),
                'hora' => $this->changedAt->format('H:i').' UTC',
                'forgotPasswordUrl' => $this->forgotPasswordUrl,
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
