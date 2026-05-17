@php
    /**
     * QR Poster PDF template (dompdf-compatible).
     *
     * Expected variables:
     *   $businessName  string
     *   $tagline       ?string
     *   $publicUrl     string
     *   $qrDataUri     string  (data:image/png;base64,...)
     *   $message       string
     *   $color         string  (#RRGGBB)
     *   $logoDataUri   ?string
     *   $size          string  'a4' | 'a5' | 'square'
     */

    // ---------- dimensions ----------
    $dims = [
        'a4'     => ['w' => 794,  'h' => 1123, 'scale' => 1.0],
        'a5'     => ['w' => 559,  'h' => 794,  'scale' => 0.7],
        'square' => ['w' => 794,  'h' => 794,  'scale' => 1.0],
    ];
    $d     = $dims[$size] ?? $dims['a4'];
    $scale = $d['scale'];
    $s     = fn($n) => (int) round($n * $scale);

    // ---------- tint helper ----------
    if (!function_exists('qr_poster_tint')) {
        function qr_poster_tint(string $hex, float $ratio): string {
            $h = ltrim($hex, '#');
            if (strlen($h) === 3) {
                $h = $h[0].$h[0].$h[1].$h[1].$h[2].$h[2];
            }
            if (!preg_match('/^[0-9a-fA-F]{6}$/', $h)) {
                $h = '0F6E56';
            }
            $r = hexdec(substr($h, 0, 2));
            $g = hexdec(substr($h, 2, 2));
            $b = hexdec(substr($h, 4, 2));
            $t = max(0.0, min(1.0, $ratio));
            $mix = fn($c) => (int) round($c + (255 - $c) * $t);
            return sprintf('#%02x%02x%02x', $mix($r), $mix($g), $mix($b));
        }
    }

    $accent       = $color;
    $bgSoft       = qr_poster_tint($color, 0.94);
    $divider      = qr_poster_tint($color, 0.82);
    $qrBorder     = qr_poster_tint($color, 0.70);
    $eyebrow      = qr_poster_tint($color, 0.40);
    $dotsColor    = qr_poster_tint($color, 0.60);
    $taglineColor = qr_poster_tint($color, 0.20);

    $nearBlack = '#0B1F1A';
    $muted     = '#888780';
    $white     = '#FFFFFF';

    $qrSize    = $size === 'square' ? $s(300) : $s(340);
    $nameSize  = $logoDataUri ? $s(28) : $s(38);
@endphp
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>QR Poster — {{ $businessName }}</title>
    <style>
        @page { margin: 0; }
        html, body {
            margin: 0;
            padding: 0;
            background: {{ $white }};
            font-family: 'Helvetica Neue', Arial, sans-serif;
            color: {{ $nearBlack }};
        }
        .poster {
            width: {{ $d['w'] }}px;
            height: {{ $d['h'] }}px;
            background: {{ $white }};
            position: relative;
        }
        .strip {
            width: 100%;
            height: {{ $s(4) }}px;
            background: {{ $accent }};
            font-size: 0;
            line-height: 0;
        }
        .header {
            text-align: center;
            padding: {{ $s(40) }}px {{ $s(48) }}px;
            background: {{ $white }};
        }
        .logo {
            display: block;
            margin: 0 auto {{ $s(16) }}px auto;
            max-height: {{ $s(64) }}px;
            max-width: {{ $s(220) }}px;
        }
        .business-name {
            font-size: {{ $nameSize }}px;
            font-weight: 800;
            color: {{ $nearBlack }};
            letter-spacing: -0.03em;
            line-height: 1.05;
        }
        .tagline {
            font-size: {{ $s(15) }}px;
            color: {{ $taglineColor }};
            font-weight: 500;
            margin-top: {{ $s(8) }}px;
            letter-spacing: 0.01em;
        }
        .divider {
            height: 1px;
            background: {{ $divider }};
            margin: 0 {{ $s(48) }}px;
            font-size: 0;
            line-height: 0;
        }
        .message-section {
            background: {{ $bgSoft }};
            padding: {{ $s(32) }}px {{ $s(48) }}px;
            text-align: center;
        }
        .eyebrow {
            font-size: {{ $s(10) }}px;
            font-weight: 600;
            letter-spacing: 0.12em;
            color: {{ $eyebrow }};
            text-transform: uppercase;
            margin-bottom: {{ $s(10) }}px;
        }
        .message {
            font-size: {{ $s(28) }}px;
            font-weight: 700;
            color: {{ $accent }};
            letter-spacing: -0.02em;
            line-height: 1.2;
        }
        .qr-table {
            width: 100%;
            border-collapse: collapse;
            background: {{ $white }};
        }
        .qr-cell {
            text-align: center;
            padding: {{ $s(36) }}px 0;
        }
        .qr-frame {
            display: inline-block;
            background: {{ $white }};
            border: {{ $s(2) }}px solid {{ $qrBorder }};
            padding: {{ $s(20) }}px;
            text-align: center;
        }
        .qr-tab {
            width: 100%;
            height: {{ $s(3) }}px;
            background: {{ $accent }};
            margin-bottom: {{ $s(12) }}px;
            font-size: 0;
            line-height: 0;
        }
        .qr-img {
            display: block;
            width: {{ $qrSize }}px;
            height: {{ $qrSize }}px;
        }
        .url-section {
            text-align: center;
            padding: {{ $s(20) }}px {{ $s(48) }}px 0 {{ $s(48) }}px;
            background: {{ $white }};
        }
        .url {
            font-size: {{ $s(17) }}px;
            font-weight: 700;
            color: {{ $nearBlack }};
            letter-spacing: 0.01em;
        }
        .dots {
            font-size: {{ $s(8) }}px;
            color: {{ $dotsColor }};
            letter-spacing: {{ $s(6) }}px;
            margin-top: {{ $s(8) }}px;
            line-height: 1;
        }
        .instruction {
            font-size: {{ $s(12) }}px;
            color: {{ $muted }};
            font-weight: 400;
            margin-top: {{ $s(8) }}px;
        }
        .spacer {
            height: {{ $s(20) }}px;
            font-size: 0;
            line-height: 0;
        }
        .footer {
            background: {{ $white }};
            padding: {{ $s(14) }}px 0;
            text-align: center;
        }
        .footer .brand {
            font-weight: 900;
            font-size: {{ $s(11) }}px;
            color: {{ $nearBlack }};
            letter-spacing: -0.02em;
        }
        .footer .sep,
        .footer .by {
            font-size: {{ $s(11) }}px;
            color: {{ $muted }};
            font-weight: 400;
        }
        .footer .gap {
            display: inline-block;
            width: {{ $s(6) }}px;
        }
    </style>
</head>
<body>
    <div class="poster">
        {{-- 1. Top accent strip --}}
        <div class="strip"></div>

        {{-- 2. Header --}}
        <div class="header">
            @if (!empty($logoDataUri))
                <img src="{{ $logoDataUri }}" alt="" class="logo">
            @endif
            <div class="business-name">{{ $businessName }}</div>
            @if (!empty($tagline))
                <div class="tagline">{{ $tagline }}</div>
            @endif
        </div>

        {{-- 3. Divider --}}
        <div class="divider"></div>

        {{-- 4. Message section --}}
        <div class="message-section">
            <div class="eyebrow">ESCANEA Y VISÍTANOS</div>
            <div class="message">{{ $message }}</div>
        </div>

        {{-- 5. QR section --}}
        <table class="qr-table" cellpadding="0" cellspacing="0">
            <tr>
                <td class="qr-cell">
                    <div class="qr-frame">
                        <div class="qr-tab"></div>
                        <img src="{{ $qrDataUri }}" alt="QR" class="qr-img">
                    </div>
                </td>
            </tr>
        </table>

        {{-- 6. URL section --}}
        <div class="url-section">
            <div class="url">{{ $publicUrl }}</div>
            <div class="dots">●●●</div>
            <div class="instruction">Apunta la cámara de tu móvil al código QR</div>
        </div>

        <div class="spacer"></div>

        {{-- 7. Bottom accent strip --}}
        <div class="strip"></div>

        {{-- 8. Footer --}}
        <div class="footer">
            <span class="brand">ONEZ</span><span class="gap"></span><span class="sep">·</span><span class="gap"></span><span class="by">Tu página profesional</span>
        </div>
    </div>
</body>
</html>
