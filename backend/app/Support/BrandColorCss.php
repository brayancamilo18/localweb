<?php

namespace App\Support;

/**
 * Variables CSS derivadas del color de marca (hover, soft, etc.).
 * Mantener alineado con front/src/lib/brandColorDerivatives.ts y public/templates/brand-apply.js.
 */
final class BrandColorCss
{
    /** @var array<string, list<string>> */
    private const SYNC_VARS = [
        'coral' => ['coral', 'peach', 'blush'],
        'terracotta' => ['terracotta', 'terracotta-soft'],
        'orange' => ['orange', 'orange-2', 'orange-soft'],
        'accent' => ['accent', 'accent-soft', 'accent-2'],
        'champagne' => ['champagne', 'champagne-2', 'champagne-soft'],
        'gold' => ['gold', 'gold-soft', 'gold-line'],
        'wine' => ['wine', 'wine-2'],
        'cyan' => ['cyan', 'cyan-soft'],
        'lime' => ['lime'],
        'warm' => ['warm', 'warm-soft'],
    ];

    /**
     * @return array<string, string> mapa nombre → valor (sin --)
     */
    public static function propertiesFor(string $mainVar, string $hex): array
    {
        if (! preg_match('/^#[0-9a-fA-F]{6}$/', $hex)) {
            return [];
        }

        $hex = strtolower($hex);
        $names = self::SYNC_VARS[$mainVar] ?? [$mainVar];
        $out = [];

        foreach ($names as $name) {
            $out[$name] = self::valueForSyncedVar($name, $hex);
        }

        if (in_array($mainVar, $names, true)) {
            $out[$mainVar.'-hover'] = self::hoverBrandHex($hex);
            $out[$mainVar.'-on'] = self::contrastTextOn($hex);
        }

        return $out;
    }

    public static function rootStyleBlock(string $mainVar, string $hex): string
    {
        $props = self::propertiesFor($mainVar, $hex);
        if ($props === []) {
            return '';
        }

        $decl = implode(';', array_map(
            static fn (string $k, string $v): string => '--'.$k.': '.$v,
            array_keys($props),
            array_values($props),
        ));

        return '<style>:root{ '.$decl.'; }</style>';
    }

    private static function valueForSyncedVar(string $name, string $hex): string
    {
        if (str_ends_with($name, '-soft')) {
            if ($name === 'terracotta-soft') {
                return self::mixHex($hex, '#ffffff', 0.55);
            }
            if ($name === 'orange-soft' || $name === 'champagne-soft') {
                return self::mixHex($hex, '#ffffff', 0.88);
            }

            return self::rgbaFromHex($hex, 0.16);
        }
        if (str_ends_with($name, '-line')) {
            return self::rgbaFromHex($hex, 0.3);
        }
        if (str_ends_with($name, '-2')) {
            return self::relativeLuminance($hex) > 0.45
                ? self::mixHex($hex, '#000000', 0.14)
                : self::mixHex($hex, '#ffffff', 0.18);
        }
        if ($name === 'peach') {
            return self::mixHex($hex, '#ffffff', 0.35);
        }
        if ($name === 'blush') {
            return self::mixHex($hex, '#ffffff', 0.75);
        }

        return $hex;
    }

    private static function contrastTextOn(string $hex): string
    {
        return self::relativeLuminance($hex) > 0.4 ? '#000000' : '#ffffff';
    }

    private static function hoverBrandHex(string $hex): string
    {
        $hex = strtolower($hex);
        $hover = self::relativeLuminance($hex) > 0.45
            ? self::mixHex($hex, '#000000', 0.28)
            : self::mixHex($hex, '#ffffff', 0.22);

        if ($hover === $hex) {
            $hover = self::relativeLuminance($hex) > 0.45
                ? self::mixHex($hex, '#000000', 0.4)
                : self::mixHex($hex, '#ffffff', 0.35);
        }

        return $hover;
    }

    private static function relativeLuminance(string $hex): float
    {
        $rgb = self::hexToRgb($hex);
        if ($rgb === null) {
            return 0.0;
        }

        $channels = [];
        foreach (['r', 'g', 'b'] as $key) {
            $s = $rgb[$key] / 255;
            $channels[] = $s <= 0.03928 ? $s / 12.92 : (($s + 0.055) / 1.055) ** 2.4;
        }

        return 0.2126 * $channels[0] + 0.7152 * $channels[1] + 0.0722 * $channels[2];
    }

    private static function hexToRgb(string $hex): ?array
    {
        $h = ltrim($hex, '#');
        if (strlen($h) !== 6 || ! ctype_xdigit($h)) {
            return null;
        }

        return [
            'r' => hexdec(substr($h, 0, 2)),
            'g' => hexdec(substr($h, 2, 2)),
            'b' => hexdec(substr($h, 4, 2)),
        ];
    }

    private static function mixHex(string $hex, string $target, float $amount): string
    {
        $a = self::hexToRgb($hex);
        $b = self::hexToRgb($target);
        if ($a === null || $b === null) {
            return strtolower($hex);
        }

        $t = max(0, min(1, $amount));
        $r = (int) round($a['r'] + ($b['r'] - $a['r']) * $t);
        $g = (int) round($a['g'] + ($b['g'] - $a['g']) * $t);
        $bl = (int) round($a['b'] + ($b['b'] - $a['b']) * $t);

        return sprintf('#%02x%02x%02x', $r, $g, $bl);
    }

    private static function rgbaFromHex(string $hex, float $alpha): string
    {
        $rgb = self::hexToRgb($hex);
        if ($rgb === null) {
            return $hex;
        }

        return sprintf('rgba(%d,%d,%d,%s)', $rgb['r'], $rgb['g'], $rgb['b'], rtrim(rtrim(sprintf('%.2f', $alpha), '0'), '.'));
    }
}
