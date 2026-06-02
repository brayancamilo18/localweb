{{-- Bloques extra «Sobre nosotros» — solo mono-edito --}}
@if(!empty($about_sections))
<div id="aboutExtraBlocks" class="mono-about-extras" data-main-text-first="1">
@foreach($about_sections as $i => $section)
@php
  $mainTextFirst = true;
  $textFirst = ($i + ($mainTextFirst ? 1 : 0)) % 2 === 0;
@endphp
@php $mod = $textFirst ? 'mono-about-extra--text-first' : 'mono-about-extra--photo-first'; $bn = str_pad((string) ($i + 3), 2, '0', STR_PAD_LEFT); @endphp
  <article class="mono-about-extra about-grid {{ $mod }}">
    <div class="slide-up">
      <span class="eyebrow">Bloque {{ $bn }}</span>
      @if(!empty($section['title']))<h3 class="serif">{{ $section['title'] }}</h3>@endif
      @if(!empty($section['description']))<p class="about-lede" style="margin-top:1.2rem">{{ $section['description'] }}</p>@endif
    </div>
    <div class="about-side slide-up" data-d="1">
      <div class="about-photo mono-about-extra__photo{{ !empty($section['image_url']) ? ' has-photo' : '' }}"@if(!empty($section['image_url'])) style="background-image:url('{{ $section['image_url'] }}')"@endif></div>
      <div class="about-cap"><span>Equipo</span><strong>Bloque {{ $bn }}</strong></div>
    </div>
  </article>
@endforeach
</div>
@else
<div id="aboutExtraBlocks" class="mono-about-extras" data-main-text-first="1"></div>
@endif
