<?php

namespace App\Support;

final class MaskEmail
{
    /**
     * Enmascara la parte local del email (p. ej. juan@example.com → j***@example.com).
     */
    public static function partial(string $email): string
    {
        if (! str_contains($email, '@')) {
            return '***';
        }

        [$local, $domain] = explode('@', $email, 2);
        $first = mb_substr($local, 0, 1) ?: '*';

        return $first.'***@'.$domain;
    }
}
