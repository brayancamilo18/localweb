<?php

namespace App\Services;

/**
 * Distancias perceptuales en espacio CIE L*a*b*.
 *
 * deltaE2000() usa ΔE76 (distancia euclídea en Lab). Para paletas de 6 tonos
 * muy separados los rankings coinciden con CIEDE2000; evita la complejidad de
 * la fórmula CIEDE2000 completa sin dependencias externas.
 */
class ColorDistance
{
    /**
     * @return array{0: int, 1: int, 2: int}
     */
    public function hexToRgb(string $hex): array
    {
        $hex = ltrim(strtolower($hex), '#');

        if (strlen($hex) !== 6 || ! ctype_xdigit($hex)) {
            throw new \InvalidArgumentException('Invalid hex color: '.$hex);
        }

        return [
            (int) hexdec(substr($hex, 0, 2)),
            (int) hexdec(substr($hex, 2, 2)),
            (int) hexdec(substr($hex, 4, 2)),
        ];
    }

    /**
     * @param  array{0: int, 1: int, 2: int}  $rgb
     * @return array{0: float, 1: float, 2: float}
     */
    public function rgbToXyz(array $rgb): array
    {
        $r = $this->srgbChannelToLinear($rgb[0]);
        $g = $this->srgbChannelToLinear($rgb[1]);
        $b = $this->srgbChannelToLinear($rgb[2]);

        return [
            ($r * 0.4124564 + $g * 0.3575761 + $b * 0.1804375) * 100.0,
            ($r * 0.2126729 + $g * 0.7151522 + $b * 0.0721750) * 100.0,
            ($r * 0.0193339 + $g * 0.1191920 + $b * 0.9503041) * 100.0,
        ];
    }

    /**
     * @param  array{0: float, 1: float, 2: float}  $xyz
     * @return array{0: float, 1: float, 2: float}
     */
    public function xyzToLab(array $xyz): array
    {
        $xn = 95.047;
        $yn = 100.000;
        $zn = 108.883;

        $fx = $this->labF($xyz[0] / $xn);
        $fy = $this->labF($xyz[1] / $yn);
        $fz = $this->labF($xyz[2] / $zn);

        return [
            (116.0 * $fy) - 16.0,
            500.0 * ($fx - $fy),
            200.0 * ($fy - $fz),
        ];
    }

    /**
     * @return array{0: float, 1: float, 2: float}
     */
    public function hexToLab(string $hex): array
    {
        return $this->xyzToLab($this->rgbToXyz($this->hexToRgb($hex)));
    }

    public function deltaE2000(string $hexA, string $hexB): float
    {
        $labA = $this->hexToLab($hexA);
        $labB = $this->hexToLab($hexB);

        return sqrt(
            ($labA[0] - $labB[0]) ** 2
            + ($labA[1] - $labB[1]) ** 2
            + ($labA[2] - $labB[2]) ** 2
        );
    }

    /**
     * @param  list<string>  $palette
     */
    public function closestInPalette(string $hex, array $palette): string
    {
        if ($palette === []) {
            return strtolower($hex);
        }

        $best = strtolower($palette[0]);
        $bestDistance = PHP_FLOAT_MAX;

        foreach ($palette as $candidate) {
            $distance = $this->deltaE2000($hex, $candidate);

            if ($distance < $bestDistance) {
                $bestDistance = $distance;
                $best = strtolower($candidate);
            }
        }

        return $best;
    }

    private function srgbChannelToLinear(int $channel): float
    {
        $c = $channel / 255.0;

        return $c <= 0.04045
            ? $c / 12.92
            : (($c + 0.055) / 1.055) ** 2.4;
    }

    private function labF(float $t): float
    {
        $delta = 6.0 / 29.0;

        return $t > $delta ** 3
            ? $t ** (1.0 / 3.0)
            : ($t / (3.0 * $delta ** 2)) + (4.0 / 29.0);
    }
}
