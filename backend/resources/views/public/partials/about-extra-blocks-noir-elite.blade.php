{{-- Bloques extra «Sobre nosotros» — solo noir-elite (principal: texto izq · foto der) --}}
@if(!empty($about_sections))
<div id="aboutExtraBlocks" class="noir-about-extras" data-main-text-first="1">
@foreach($about_sections as $i => $section)
@php
  $mainTextFirst = true;
  $textFirst = ($i + ($mainTextFirst ? 1 : 0)) % 2 === 0;
  $mod = $textFirst ? 'noir-about-extra--text-first' : 'noir-about-extra--photo-first';
  $blockNum = str_pad((string) ($i + 3), 2, '0', STR_PAD_LEFT);
@endphp
  <article class="noir-about-extra about-grid {{ $mod }}">
    <div class="about-text noir-about-extra__text">
      <span class="eyebrow reveal-up">— Bloque {{ $blockNum }}</span>
      <div class="h-line short reveal-up delay-1"></div>
      @if(!empty($section['title']))<h3 class="noir-about-extra__title reveal-up delay-2">{{ $section['title'] }}</h3>@endif
      @if(!empty($section['description']))<p class="noir-about-extra__desc reveal-up delay-2">{{ $section['description'] }}</p>@endif
    </div>
    <div
      class="about-photo noir-about-extra__photo reveal-up delay-2{{ !empty($section['image_url']) ? ' has-photo' : '' }}"
      @if(!empty($section['image_url'])) style="background-image:url('{{ $section['image_url'] }}')"@endif
    ></div>
  </article>
@endforeach
</div>
@else
<div id="aboutExtraBlocks" class="noir-about-extras" data-main-text-first="1"></div>
@endif
