<?php

namespace App\Support;

final class ParseUserAgent
{
    /**
     * Etiqueta legible para UI (p. ej. "Chrome · macOS").
     */
    public static function label(?string $userAgent): string
    {
        if ($userAgent === null || $userAgent === '') {
            return 'Dispositivo desconocido';
        }

        $browser = 'Navegador';
        if (str_contains($userAgent, 'Firefox')) {
            $browser = 'Firefox';
        } elseif (str_contains($userAgent, 'Edg/')) {
            $browser = 'Edge';
        } elseif (str_contains($userAgent, 'Chrome')) {
            $browser = 'Chrome';
        } elseif (str_contains($userAgent, 'Safari')) {
            $browser = 'Safari';
        }

        $os = 'SO desconocido';
        if (str_contains($userAgent, 'Windows')) {
            $os = 'Windows';
        } elseif (str_contains($userAgent, 'Mac OS X') || str_contains($userAgent, 'Macintosh')) {
            $os = 'macOS';
        } elseif (str_contains($userAgent, 'Android')) {
            $os = 'Android';
        } elseif (str_contains($userAgent, 'iPhone') || str_contains($userAgent, 'iPad')) {
            $os = 'iOS';
        } elseif (str_contains($userAgent, 'Linux')) {
            $os = 'Linux';
        }

        return "{$browser} · {$os}";
    }
}
