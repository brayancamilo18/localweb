<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/**
 * Mailable HTML del correo de verificación de cuenta (paleta ONEZ verde savia).
 *
 * Sustituye al MailMessage de Laravel para que el contenido siga la identidad
 * visual de ONEZ (#0F6E56 sobre neutrales cálidos). El render concreto vive en
 * `resources/views/emails/verify-email.blade.php`.
 */
class VerifyEmailOnez extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public string $supportUrl;

    public string $privacyUrl;

    public string $termsUrl;

    public function __construct(
        public string $name,
        public string $email,
        public string $verificationUrl,
        public int $expireMinutes,
    ) {
        $frontend = rtrim((string) config('app.frontend_url'), '/');
        $this->supportUrl = $frontend.'/soporte';
        $this->privacyUrl = $frontend.'/privacidad';
        $this->termsUrl = $frontend.'/terminos';
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Confirma tu correo en ONEZ',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.verify-email',
            with: [
                'name' => $this->name,
                'email' => $this->email,
                'verificationUrl' => $this->verificationUrl,
                'expireMinutes' => $this->expireMinutes,
                'supportUrl' => $this->supportUrl,
                'privacyUrl' => $this->privacyUrl,
                'termsUrl' => $this->termsUrl,
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
