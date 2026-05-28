<?php

namespace App\Notifications;

use App\Mail\AccountDeletedOnez;
use DateTimeInterface;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class AccountDeletedEs extends Notification
{
    use Queueable;

    public function __construct(
        public string $accountName,
        public string $requestIp,
        public DateTimeInterface $deletedAt,
    ) {}

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): AccountDeletedOnez
    {
        return (new AccountDeletedOnez(
            name: $this->accountName,
            requestIp: $this->requestIp,
            deletedAt: $this->deletedAt,
        ))->to($notifiable->routeNotificationFor('mail'));
    }
}
