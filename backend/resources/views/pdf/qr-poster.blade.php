@php
    // ─── Tamaños derivados del tamaño de página ──────────────────
    $isA5 = $size === 'a5';
    $isSq = $size === 'square';

    $headerPad     = $isA5 ? '20px 28px' : '28px 40px';
    $logoMaxH      = $isA5 ? '56px' : '80px';
    $logoMaxW      = $isA5 ? '180px' : '260px';
    $logoMb        = $isA5 ? '8px' : '12px';
    $nameSize      = $isA5 ? '26px' : '44px';
    $nameSizeLogo  = $isA5 ? '22px' : '32px';
    $taglineSize   = $isA5 ? '13px' : '16px';
    $taglineMt     = $isA5 ? '6px' : '10px';
    $decoH         = $isA5 ? '4px' : '6px';
    $msgMt         = $isA5 ? '24px' : '40px';
    $msgMb         = $isA5 ? '12px' : '18px';
    $msgSize       = $isA5 ? '26px' : '34px';
    $qrBorder      = $isA5 ? '3px' : '4px';
    $qrPad         = $isA5 ? '20px' : '28px';
    $qrDim         = $isA5 ? '260px' : ($isSq ? '320px' : '380px');
    $urlMt         = $isA5 ? '20px' : '28px';
    $urlSize       = $isA5 ? '14px' : '18px';
    $urlPad        = $isA5 ? '8px 16px' : '10px 20px';
    $urlHintSize   = $isA5 ? '11px' : '13px';
    $urlHintMt     = $isA5 ? '8px' : '10px';
    $footerMt      = $isA5 ? '20px' : '32px';
    $footerPb      = $isA5 ? '20px' : '28px';
    $footerSize    = $isA5 ? '10px' : '11px';

    $sheetWidth = $isA5 ? '559px' : '794px';

    // Pre-build all inline style strings so the HTML below has zero Blade
    // interpolation inside style="" attributes — keeps IDE CSS linters happy.
    $headerStyle    = "background:{$color};padding:{$headerPad};";
    $logoWrapStyle  = "margin-bottom:{$logoMb};";
    $logoImgStyle   = "max-height:{$logoMaxH};max-width:{$logoMaxW};";
    $nameStyle      = "font-size:{$nameSize};";
    $nameLogoStyle  = "font-size:{$nameSizeLogo};";
    $taglineStyle   = "font-size:{$taglineSize};margin-top:{$taglineMt};";
    $decoStyle      = "height:{$decoH};background:{$softTint};";
    $msgBlockStyle  = "margin-top:{$msgMt};margin-bottom:{$msgMb};";
    $msgTextStyle   = "font-size:{$msgSize};color:{$color};";
    $qrBoxStyle     = "border:{$qrBorder} solid {$color};padding:{$qrPad};";
    $qrImgStyle     = "width:{$qrDim};height:{$qrDim};";
    $urlBlockStyle  = "margin-top:{$urlMt};";
    $urlPillStyle   = "font-size:{$urlSize};background:{$softTint};padding:{$urlPad};border:1px solid {$borderTint};";
    $urlHintStyle   = "font-size:{$urlHintSize};margin-top:{$urlHintMt};";
    $footerStyle    = "margin-top:{$footerMt};padding-bottom:{$footerPb};font-size:{$footerSize};";
@endphp
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    {!! '<style>
        @page { margin: 0; }
        * { box-sizing: border-box; }
        body {
            margin: 0; padding: 0;
            font-family: Helvetica, Arial, sans-serif;
            color: #111111;
            background: #ffffff;
        }
        .sheet { position: relative; background: #ffffff; overflow: hidden; }
        .header { width: 100%; color: #ffffff; text-align: center; }
        .header-name { font-weight: 700; line-height: 1.1; letter-spacing: -0.01em; }
        .header-tagline { font-weight: 400; opacity: 0.92; line-height: 1.3; }
        .deco-bar { width: 100%; }
        .message-block { text-align: center; padding: 0 40px; }
        .message-text {
            display: inline-block; font-weight: 700;
            letter-spacing: -0.01em; line-height: 1.1;
        }
        .qr-table { width: 100%; border-collapse: collapse; }
        .qr-cell { text-align: center; vertical-align: middle; }
        .qr-box { display: inline-block; background: #ffffff; }
        .qr-box img { display: block; }
        .url-block { text-align: center; padding: 0 40px; }
        .url-pill {
            display: inline-block; font-weight: 600; color: #222222;
            letter-spacing: 0.02em;
        }
        .url-hint { color: #666666; }
        .footer { text-align: center; color: #999999; letter-spacing: 0.05em; }
        .footer strong { font-weight: 700; color: #666666; }
    </style>' !!}
</head>
<body>
<div class="sheet" style="width: {{ $sheetWidth }};">

    {{-- HEADER --}}
    <div class="header" {!! "style=\"{$headerStyle}\"" !!}>
        @if($includeLogo && $logoUrl)
            <div {!! "style=\"{$logoWrapStyle}\"" !!}>
                <img src="{{ $logoUrl }}" alt="{{ $businessName }}" {!! "style=\"{$logoImgStyle}\"" !!}>
            </div>
            <div class="header-name" {!! "style=\"{$nameLogoStyle}\"" !!}>{{ $businessName }}</div>
        @else
            <div class="header-name" {!! "style=\"{$nameStyle}\"" !!}>{{ $businessName }}</div>
        @endif

        @if(!empty($tagline))
            <div class="header-tagline" {!! "style=\"{$taglineStyle}\"" !!}>{{ $tagline }}</div>
        @endif
    </div>

    {{-- BARRA DECORATIVA --}}
    <div class="deco-bar" {!! "style=\"{$decoStyle}\"" !!}></div>

    {{-- MENSAJE --}}
    <div class="message-block" {!! "style=\"{$msgBlockStyle}\"" !!}>
        <span class="message-text" {!! "style=\"{$msgTextStyle}\"" !!}>{{ $message }}</span>
    </div>

    {{-- QR --}}
    <table class="qr-table" cellpadding="0" cellspacing="0">
        <tbody>
            <tr>
                <td class="qr-cell">
                    <div class="qr-box" {!! "style=\"{$qrBoxStyle}\"" !!}>
                        <img src="{{ $qrDataUri }}" alt="QR {{ $businessName }}" {!! "style=\"{$qrImgStyle}\"" !!}>
                    </div>
                </td>
            </tr>
        </tbody>
    </table>

    {{-- URL --}}
    <div class="url-block" {!! "style=\"{$urlBlockStyle}\"" !!}>
        <div class="url-pill" {!! "style=\"{$urlPillStyle}\"" !!}>{{ preg_replace('#^https?://#', '', $publicUrl) }}</div>
        <div class="url-hint" {!! "style=\"{$urlHintStyle}\"" !!}>Apunta la cámara de tu móvil al código</div>
    </div>

    {{-- FOOTER --}}
    <div class="footer" {!! "style=\"{$footerStyle}\"" !!}>
        Hecho con <strong>LocalWeb</strong>
    </div>

</div>
</body>
</html>
