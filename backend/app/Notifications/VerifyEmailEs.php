<?php

namespace App\Notifications;

use Illuminate\Auth\Notifications\VerifyEmail;

class VerifyEmailEs extends VerifyEmail
{
    /**
     * Construye el correo de verificación en castellano.
     *
     * Devuelve un Mailable HTML (`App\Mail\VerifyEmailOnez`) en lugar del
     * MailMessage Markdown por defecto para mantener la identidad visual ONEZ.
     *
     * @param  mixed  $notifiable
     */
    public function toMail($notifiable)
    {
        $url = $this->verificationUrl($notifiable);
        $minutes = (int) config('auth.verification.expire', 60);

        return (new \App\Mail\VerifyEmailOnez(
            name: $notifiable->name ?: '',
            email: $notifiable->getEmailForVerification(),
            verificationUrl: $url,
            expireMinutes: $minutes,
        ))->to($notifiable->getEmailForVerification());
    }
}
