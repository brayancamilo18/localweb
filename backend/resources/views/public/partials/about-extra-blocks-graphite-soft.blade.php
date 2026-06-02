{{-- Bloques extra «Sobre nosotros» — solo graphite-soft --}}
@if(!empty($about_sections))
<div id="aboutExtraBlocks" class="graphite-about-extras" data-main-text-first="1">
@foreach($about_sections as $i => $section)
@php
  $mainTextFirst = true;
  $textFirst = ($i + ($mainTextFirst ? 1 : 0)) % 2 === 0;
@endphp
@php $mod = $textFirst ? 'graphite-about-extra--text-first' : 'graphite-about-extra--photo-first'; $bn = str_pad((string) ($i + 3), 2, '0', STR_PAD_LEFT); @endphp
  <article class="graphite-about-extra about-grid {{ $mod }}">
    <div class="about-text">
      <span class="sec-num">N° {{ $bn }} — Extra</span>
      @if(!empty($section['title']))<h3 class="serif h-section" style="margin-top:14px">{{ $section['title'] }}</h3>@endif
      @if(!empty($section['description']))<p class="lede" style="margin-top:24px">{{ $section['description'] }}</p>@endif
    </div>
    <div class="about-photos">
      <div class="about-photo reveal-img{{ !empty($section['image_url']) ? ' has-photo in' : '' }}">
        <div class="img"@if(!empty($section['image_url'])) style="background-image:url('{{ $section['image_url'] }}')"@endif></div>
        <cap>Equipo</cap>
      </div>
    </div>
  </article>
@endforeach
</div>
@else
<div id="aboutExtraBlocks" class="graphite-about-extras" data-main-text-first="1"></div>
@endif
