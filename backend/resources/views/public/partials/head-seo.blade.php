{{-- ═══════════════════════════════════════════════════════════════════
     SEO HEAD PARTIAL
     Variables esperadas:
       $business  — App\Models\Business
       $seo       — array construido por SeoMetaBuilder::build()
     ═══════════════════════════════════════════════════════════════════ --}}

<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">

{{-- ─── TITLE & DESCRIPTION ─────────────────────────────────────────── --}}
<title>{{ $seo['title'] }}</title>
<meta name="description" content="{{ $seo['description'] }}">
<meta name="robots" content="{{ $seo['robots'] }}">

{{-- ─── CANONICAL ────────────────────────────────────────────────────── --}}
<link rel="canonical" href="{{ $seo['canonical'] }}">

{{-- ─── FAVICON ──────────────────────────────────────────────────────── --}}
{{-- Fase 2: favicon dinámico por cliente Pro. Por ahora favicon de plataforma. --}}
@if($seo['favicon_url'])
    <link rel="icon" type="{{ $seo['favicon_type'] ?? 'image/png' }}" href="{{ $seo['favicon_url'] }}">
    <link rel="apple-touch-icon" href="{{ $seo['favicon_url'] }}">
@else
    {{-- El navegador pedirá /favicon.ico al servidor; nginx lo sirve desde el SPA build --}}
@endif

{{-- ─── OPEN GRAPH ───────────────────────────────────────────────────── --}}
<meta property="og:type" content="{{ $seo['og_type'] }}">
<meta property="og:site_name" content="{{ $seo['og_site_name'] }}">
<meta property="og:title" content="{{ $seo['og_title'] }}">
<meta property="og:description" content="{{ $seo['og_description'] }}">
<meta property="og:url" content="{{ $seo['og_url'] }}">
<meta property="og:image" content="{{ $seo['og_image'] }}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:locale" content="es_ES">

{{-- ─── TWITTER CARD ─────────────────────────────────────────────────── --}}
<meta name="twitter:card" content="{{ $seo['twitter_card'] }}">
<meta name="twitter:title" content="{{ $seo['twitter_title'] }}">
<meta name="twitter:description" content="{{ $seo['twitter_description'] }}">
<meta name="twitter:image" content="{{ $seo['twitter_image'] }}">

{{-- ─── HREFLANG ─────────────────────────────────────────────────────── --}}
<link rel="alternate" hreflang="{{ $seo['hreflang'] }}" href="{{ $seo['canonical'] }}">
<link rel="alternate" hreflang="x-default" href="{{ $seo['canonical'] }}">

{{-- ─── JSON-LD ───────────────────────────────────────────────────────── --}}
@include('public.partials.json-ld')
