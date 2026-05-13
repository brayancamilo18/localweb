<?php

namespace App\Services;

use App\Models\Business;
use Endroid\QrCode\Builder\Builder;
use Endroid\QrCode\Color\Color;
use Endroid\QrCode\Encoding\Encoding;
use Endroid\QrCode\ErrorCorrectionLevel;
use Endroid\QrCode\RoundBlockSizeMode;
use Endroid\QrCode\Writer\PngWriter;
use Endroid\QrCode\Writer\Result\ResultInterface;

class QrCodeService
{
    /**
     * Devuelve el color hex efectivo para el QR de un Business.
     *
     * Prioridad:
     *  1. $override (si el usuario lo pasa explícitamente desde la UI)
     *  2. $business->template->primary_color (heredado del template)
     *  3. '#000000' como último fallback (no debería llegar nunca aquí en datos sanos)
     */
    public function colorForBusiness(Business $business, ?string $override = null): string
    {
        $candidate = $override
            ?? $business->template?->primary_color
            ?? '#000000';

        return $this->normalizeHex($candidate);
    }

    /**
     * Calcula un color de fondo legible para el QR. Por seguridad de escaneo SIEMPRE
     * devolvemos blanco — el QR debe tener mucho contraste para que las cámaras lo lean
     * de forma fiable, especialmente impreso en papel a baja resolución.
     */
    public function backgroundColorForBusiness(Business $business): string
    {
        return '#FFFFFF';
    }

    /**
     * Genera un PNG del QR.
     */
    public function pngBinary(
        string $data,
        int $sizePx = 800,
        string $colorHex = '#000000',
        string $bgHex = '#FFFFFF',
    ): ResultInterface {
        $builder = new Builder(
            writer: new PngWriter(),
            encoding: new Encoding('UTF-8'),
            errorCorrectionLevel: ErrorCorrectionLevel::High,
            size: $sizePx,
            margin: 16,
            roundBlockSizeMode: RoundBlockSizeMode::Margin,
            foregroundColor: $this->toRgb($colorHex),
            backgroundColor: $this->toRgb($bgHex),
        );

        return $builder->build(data: $data);
    }

    /** Devuelve el PNG como data URI base64, listo para embed en un img o Blade PDF. */
    public function pngDataUri(
        string $data,
        int $sizePx = 800,
        string $colorHex = '#000000',
        string $bgHex = '#FFFFFF',
    ): string {
        return $this->pngBinary($data, $sizePx, $colorHex, $bgHex)->getDataUri();
    }

    /** Normaliza un hex a #RRGGBB. Si el formato es inválido devuelve negro. */
    public function normalizeHex(?string $hex): string
    {
        if (! is_string($hex)) {
            return '#000000';
        }

        $hex = trim($hex);

        if (preg_match('/^#[0-9a-fA-F]{6}$/', $hex)) {
            return strtoupper($hex);
        }

        return '#000000';
    }

    private function toRgb(string $hex): Color
    {
        $hex = ltrim($this->normalizeHex($hex), '#');

        return new Color(
            (int) hexdec(substr($hex, 0, 2)),
            (int) hexdec(substr($hex, 2, 2)),
            (int) hexdec(substr($hex, 4, 2)),
        );
    }
}
