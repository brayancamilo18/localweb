{{--
  Sobreescritura del color de marca del tenant: redefine la variable principal y
  derivadas (hover, soft, etc.) para que hovers y sombras sigan el color elegido.
--}}
@if(
    filled($brandColor)
    && filled($variableName)
    && preg_match('/^#[0-9a-fA-F]{6}$/', (string) $brandColor)
)
@php
    $mainVar = ltrim((string) $variableName, '-');
    $style = \App\Support\BrandColorCss::rootStyleBlock($mainVar, (string) $brandColor);
@endphp
{!! $style !!}
@endif
