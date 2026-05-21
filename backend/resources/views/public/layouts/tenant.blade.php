<!doctype html>
<html lang="{{ $locale ?? 'es' }}">
<head>
@include('public.partials.head-seo')
@stack('head-extras')
</head>
<body>
@include('public.partials.tenant-leaflet-bridge')
@yield('content')
@stack('body-end')
</body>
</html>
