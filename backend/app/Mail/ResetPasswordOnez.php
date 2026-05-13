<?php

namespace App\Mail;

use DateTimeInterface;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/**
 * Mailable HTML del correo de recuperación de contraseña (paleta ONEZ verde savia).
 *
 * Incluye los metadatos de seguridad de la solicitud (fecha, hora UTC, IP,
 * navegador, ciudad) para que el destinatario pueda detectar un acceso
 * sospechoso de un vistazo. El render concreto vive en
 * `resources/views/emails/reset-password.blade.php`.
 */
class ResetPasswordOnez extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public string $supportUrl;

    public string $privacyUrl;

    public string $termsUrl;

    public function __construct(
        public string $name,
        public string $email,
        public string $resetUrl,
        public int $expireMinutes,
        public string $requestIp,
        public string $requestUserAgent,
        public DateTimeInterface $requestedAt,
    ) {
        $frontend = rtrim((string) config('app.frontend_url'), '/');
        $this->supportUrl = $frontend.'/soporte';
        $this->privacyUrl = $frontend.'/privacidad';
        $this->termsUrl = $frontend.'/terminos';
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Restablece tu contraseña en ONEZ',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.reset-password',
            with: [
                'name' => $this->name,
                'email' => $this->email,
                'resetUrl' => $this->resetUrl,
                'expireMinutes' => $this->expireMinutes,
                'requestIp' => $this->requestIp ?: 'No disponible',
                'fecha' => $this->requestedAt->format('d/m/Y'),
                'hora' => $this->requestedAt->format('H:i').' UTC',
                'navegador' => $this->parseBrowser($this->requestUserAgent),
                'ciudad' => 'No disponible',
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

    /**
     * Heurística mínima para identificar el navegador a partir del User-Agent.
     *
     * Orden de detección importa: `Edg` antes que `Chrome`/`Safari` (Edge se
     * anuncia como Chrome+Safari), `Chrome` antes que `Safari` (Chrome incluye
     * "Safari" en su UA), `Firefox` aparte.
     */
    private function parseBrowser(string $userAgent): string
    {
        if ($userAgent === '') {
            return 'Navegador desconocido';
        }

        if (str_contains($userAgent, 'Edg')) {
            return 'Edge';
        }

        if (str_contains($userAgent, 'Firefox')) {
            return 'Firefox';
        }

        if (str_contains($userAgent, 'Chrome')) {
            return 'Chrome';
        }

        if (str_contains($userAgent, 'Safari')) {
            return 'Safari';
        }

        return 'Navegador desconocido';
    }
}
