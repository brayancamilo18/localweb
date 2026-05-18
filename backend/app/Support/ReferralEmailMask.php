<?php

namespace App\Support;

final class ReferralEmailMask
{
    public static function mask(?string $email): string
    {
        if ($email === null || $email === '' || ! str_contains($email, '@')) {
            return '—';
        }

        [$local, $domain] = explode('@', $email, 2);
        $visibleLength = strlen($local) >= 2 ? 2 : 1;
        $visible = substr($local, 0, $visibleLength);

        return $visible.'***@'.$domain;
    }
}
