{{-- Bloques extra «Sobre nosotros» — solo bloom-studio (principal: foto izq · texto der) --}}
@if(!empty($about_sections))
<div id="aboutExtraBlocks" class="bloom-about-extras">
@foreach($about_sections as $i => $section)
@php
  $mainTextFirst = false;
  $textFirst = ($i + ($mainTextFirst ? 1 : 0)) % 2 === 0;
  $mod = $textFirst ? 'bloom-about-extra--text-first' : 'bloom-about-extra--photo-first';
  $blockNum = str_pad((string) ($i + 3), 2, '0', STR_PAD_LEFT);
@endphp
  <article class="bloom-about-extra {{ $mod }}">
    <div class="bloom-about-extra__copy r-right d-1">
      <span class="eyebrow-coral bloom-about-extra__kicker">Bloque {{ $blockNum }}</span>
      @if(!empty($section['title']))<h3 class="bloom-about-extra__title">{{ $section['title'] }}</h3>@endif
      @if(!empty($section['description']))<p class="bloom-about-extra__desc">{{ $section['description'] }}</p>@endif
    </div>
    <div class="bloom-about-extra__photo r-left">
      <div class="bloom-about-extra__img{{ !empty($section['image_url']) ? ' has-photo' : '' }}">
        @if(!empty($section['image_url']))
        <img src="{{ $section['image_url'] }}" alt="" loading="lazy" decoding="async"/>
        @endif
      </div>
    </div>
  </article>
@endforeach
</div>
@else
<div id="aboutExtraBlocks" class="bloom-about-extras"></div>
@endif
