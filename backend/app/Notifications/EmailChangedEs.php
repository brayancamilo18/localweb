<?php

namespace App\Notifications;

use App\Mail\EmailChangedOnez;
use DateTimeInterface;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class EmailChangedEs extends Notification
{
    use Queueable;

    public function __construct(
        public string $accountName,
        public string $previousEmail,
        public string $newEmailMasked,
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

    public function toMail(object $notifiable): EmailChangedOnez
    {
        return (new EmailChangedOnez(
            name: $this->accountName,
            previousEmail: $this->previousEmail,
            newEmailMasked: $this->newEmailMasked,
            requestIp: $this->requestIp,
            changedAt: $this->changedAt,
        ))->to($notifiable->routeNotificationFor('mail'));
    }
}
