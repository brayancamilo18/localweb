<!doctype html>
<html lang="{{ $locale ?? 'es' }}">
<head>
@include('public.partials.head-seo')
@stack('head-extras')
@include('public.partials.responsive-safety')
</head>
<body>
@include('public.partials.tenant-leaflet-bridge')
@yield('content')
@stack('body-end')
</body>
</html>
