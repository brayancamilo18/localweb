<!doctype html>
<html lang="{{ $locale ?? 'es' }}">
<head>
@include('public.partials.head-seo')
@stack('head-extras')
@include('public.partials.responsive-safety')
<link rel="stylesheet" href="/templates/lw-events.css?v=7">
</head>
<body>
@include('public.partials.tenant-leaflet-bridge')
@yield('content')
@stack('body-end')
@php
    $lwEventsPayload = [
        'events' => $events ?? [],
        'events_enabled' => (bool) ($events_enabled ?? false),
        'is_pro' => (bool) ($is_pro ?? false),
        'brand_color' => $brand_color ?? null,
        'template_slug' => $template_slug ?? null,
    ];
@endphp
<script id="lw-events-data" type="application/json">@json($lwEventsPayload)</script>
<script src="/templates/lw-events.js?v=7"></script>
</body>
</html>
