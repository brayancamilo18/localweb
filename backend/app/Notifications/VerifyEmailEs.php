<?php

namespace App\Notifications;

use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Notifications\Messages\MailMessage;

class VerifyEmailEs extends VerifyEmail
{
    /**
     * Construye el correo de verificación en castellano.
     *
     * @param  mixed  $notifiable
     */
    public function toMail($notifiable): MailMessage
    {
        $url = $this->verificationUrl($notifiable);
        $minutes = (int) config('auth.verification.expire', 60);

        return (new MailMessage)
            ->subject('Confirma tu correo en LocalWeb')
            ->greeting('Hola '.($notifiable->name ?: '').',')
            ->line('Gracias por crear una cuenta en LocalWeb. Para empezar a configurar tu página, confirma que este correo es tuyo.')
            ->action('Confirmar mi correo', $url)
            ->line('Este enlace caduca en '.$minutes.' minutos. Si no responde, puedes pedir uno nuevo desde la pantalla de "Verifica tu correo" en la app.')
            ->line('Si no fuiste tú quien se registró, ignora este mensaje y la cuenta no se activará.')
            ->salutation('— El equipo de LocalWeb');
    }
}
