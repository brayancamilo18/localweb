<?php

namespace App\Services;

use App\Models\Template;

/**
 * Validación de contraste WCAG entre un color de marca propuesto y los
 * colores (fondo + tinta) de la plantilla actual. Umbrales:
 *   - text / text_on_dark : contrast(color, bg)  >= 4.5
 *   - bg                  : contrast(ink, color) >= 4.5
 *   - mixed               : ambos >= 3.0
 *
 * Si la plantilla no tiene metadatos en config('branding.templates'), se
 * considera no validable y se rechaza el color custom (devolvemos un fail
 * informativo para que el front pueda explicarlo). Plantillas listadas en
 * unsupported_templates se gestionan ANTES de llegar aquí, en el controller.
 */
class TemplateContrast
{
    private const THRESHOLD_STRICT = 4.5;

    private const THRESHOLD_MIXED = 3.0;

    /**
     * @return array{ok: bool, reason?: string, vs_bg?: float, vs_ink?: float, usage?: string, bg?: string, ink?: string}
     */
    public function check(string $hex, ?Template $template): array
    {
        if (! preg_match('/^#[0-9a-fA-F]{6}$/', $hex)) {
            return ['ok' => false, 'reason' => 'invalid_hex'];
        }
        if ($template === null) {
            return ['ok' => false, 'reason' => 'no_template'];
        }

        $meta = config('branding.templates.'.$template->slug);
        if (! is_array($meta) || ! isset($meta['usage'], $meta['bg'], $meta['ink'])) {
            return ['ok' => false, 'reason' => 'no_metadata'];
        }

        $hex = strtolower($hex);
        $bg = strtolower((string) $meta['bg']);
        $ink = strtolower((string) $meta['ink']);
        $usage = (string) $meta['usage'];

        $vsBg = $this->contrast($hex, $bg);
        $vsInk = $this->contrast($ink, $hex);

        $ok = match ($usage) {
            'text', 'text_on_dark' => $vsBg >= self::THRESHOLD_STRICT,
            'bg' => $vsInk >= self::THRESHOLD_STRICT,
            'mixed' => $vsBg >= self::THRESHOLD_MIXED && $vsInk >= self::THRESHOLD_MIXED,
            default => false,
        };

        return [
            'ok' => $ok,
            'reason' => $ok ? null : 'low_contrast',
            'vs_bg' => round($vsBg, 2),
            'vs_ink' => round($vsInk, 2),
            'usage' => $usage,
            'bg' => $bg,
            'ink' => $ink,
        ];
    }

    public function contrast(string $hexA, string $hexB): float
    {
        $la = $this->relativeLuminance($hexA);
        $lb = $this->relativeLuminance($hexB);
        $light = max($la, $lb);
        $dark = min($la, $lb);

        return ($light + 0.05) / ($dark + 0.05);
    }

    private function relativeLuminance(string $hex): float
    {
        $hex = ltrim($hex, '#');
        $r = $this->channel((int) hexdec(substr($hex, 0, 2)));
        $g = $this->channel((int) hexdec(substr($hex, 2, 2)));
        $b = $this->channel((int) hexdec(substr($hex, 4, 2)));

        return 0.2126 * $r + 0.7152 * $g + 0.0722 * $b;
    }

    private function channel(int $byte): float
    {
        $c = $byte / 255.0;

        return $c <= 0.03928 ? $c / 12.92 : (($c + 0.055) / 1.055) ** 2.4;
    }
}
