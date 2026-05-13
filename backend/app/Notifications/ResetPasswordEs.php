<?php

namespace App\Notifications;

use Illuminate\Auth\Notifications\ResetPassword;

class ResetPasswordEs extends ResetPassword
{
    /**
     * Construye el correo de recuperación de contraseña en castellano.
     *
     * El enlace apunta al SPA (BrowserRouter) — NO a una ruta de Laravel —,
     * porque la pantalla de reset vive en el frontend. El backend solo
     * recibe el POST a `/api/v1/auth/reset-password` cuando el usuario envía
     * el formulario.
     *
     * Devuelve un Mailable HTML (`App\Mail\ResetPasswordOnez`) en lugar del
     * MailMessage Markdown por defecto para mantener la identidad visual ONEZ
     * y enriquecer el correo con metadatos de seguridad (IP, navegador, hora).
     *
     * @param  mixed  $notifiable
     */
    public function toMail($notifiable)
    {
        $frontend = rtrim((string) config('app.frontend_url'), '/');
        $url = $frontend.'/reset-password?token='.$this->token.'&email='.urlencode($notifiable->getEmailForPasswordReset());

        $minutes = (int) config('auth.passwords.users.expire', 60);

        $request = request();

        return (new \App\Mail\ResetPasswordOnez(
            name: $notifiable->name ?: '',
            email: $notifiable->getEmailForPasswordReset(),
            resetUrl: $url,
            expireMinutes: $minutes,
            requestIp: $request?->ip() ?? 'No disponible',
            requestUserAgent: $request?->userAgent() ?? '',
            requestedAt: now(),
        ))->to($notifiable->getEmailForPasswordReset());
    }
}
