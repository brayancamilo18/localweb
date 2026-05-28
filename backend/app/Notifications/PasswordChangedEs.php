<?php

namespace App\Notifications;

use App\Mail\PasswordChangedOnez;
use DateTimeInterface;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class PasswordChangedEs extends Notification
{
    use Queueable;

    public function __construct(
        public string $requestIp,
        public DateTimeInterface $changedAt,
    ) {}

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): PasswordChangedOnez
    {
        return (new PasswordChangedOnez(
            name: $notifiable->name ?: '',
            email: $notifiable->email,
            requestIp: $this->requestIp,
            changedAt: $this->changedAt,
        ))->to($notifiable->email);
    }
}
