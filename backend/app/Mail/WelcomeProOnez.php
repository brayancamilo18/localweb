<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/**
 * Mailable HTML del correo de bienvenida tras activar el plan Pro.
 *
 * Se dispara desde `App\Listeners\StripeEventListener::handleCheckoutCompleted`
 * en cuanto Stripe confirma el pago. Trae el resumen del plan, próximos pasos
 * y un recibo opcional con los datos de la primera factura.
 *
 * Todos los campos `paymentMethodBrand`, `last4`, `invoiceNumber` e
 * `invoiceUrl` son opcionales: la vista oculta cada fila si vienen vacíos para
 * que el correo se vea bien aunque Stripe aún no haya emitido la factura.
 */
class WelcomeProOnez extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public string $supportUrl;

    public string $privacyUrl;

    public string $termsUrl;

    public function __construct(
        public string $name,
        public string $email,
        public string $businessName,
        public string $dashboardUrl,
        public string $billingUrl,
        public string $cycle = 'Mensual',
        public string $price = '8,99',
        public string $period = 'mes',
        public ?string $renewalDate = null,
        public ?string $paymentMethodBrand = null,
        public ?string $last4 = null,
        public ?string $invoiceNumber = null,
        public ?string $invoiceUrl = null,
    ) {
        $frontend = rtrim((string) config('app.frontend_url'), '/');
        $this->supportUrl = $frontend.'/soporte';
        $this->privacyUrl = $frontend.'/privacidad';
        $this->termsUrl = $frontend.'/terminos';
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: '¡Bienvenido a ONEZ Pro!',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.welcome-pro',
            with: [
                'name' => $this->name,
                'email' => $this->email,
                'businessName' => $this->businessName,
                'dashboardUrl' => $this->dashboardUrl,
                'billingUrl' => $this->billingUrl,
                'cycle' => $this->cycle,
                'price' => $this->price,
                'period' => $this->period,
                'renewalDate' => $this->renewalDate,
                'paymentMethodBrand' => $this->paymentMethodBrand,
                'last4' => $this->last4,
                'invoiceNumber' => $this->invoiceNumber,
                'invoiceUrl' => $this->invoiceUrl,
                'supportEmail' => $this->resolveSupportEmail(),
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
     * Email de soporte que se muestra como mailto en el bloque "Equipo · Onboarding".
     *
     * Por defecto reutilizamos `MAIL_FROM_ADDRESS` (que en Hostinger debe ser
     * el buzón autenticado) para que las respuestas no caigan en un buzón
     * inexistente. Si no hay valor configurado, hacemos fallback al dominio
     * del frontend.
     */
    private function resolveSupportEmail(): string
    {
        $from = (string) config('mail.from.address');
        if ($from !== '') {
            return $from;
        }

        return 'soporte@onez.es';
    }
}
