{{-- Bloques extra «Sobre nosotros» — solo craft-pro --}}
@if(!empty($about_sections))
<div id="aboutExtraBlocks" class="craft-about-extras">
@foreach($about_sections as $i => $section)
@php
  $mainTextFirst = false;
  $textFirst = ($i + ($mainTextFirst ? 1 : 0)) % 2 === 0;
@endphp
@php
  $mod = $textFirst ? 'craft-about-extra--text-first' : 'craft-about-extra--photo-first';
  $blockNum = str_pad((string) ($i + 3), 2, '0', STR_PAD_LEFT);
@endphp
  <article class="craft-about-extra {{ $mod }}">
    <div class="craft-about-extra__copy">
      <span class="eyebrow craft-about-extra__kicker">Bloque {{ $blockNum }}</span>
      @if(!empty($section['title']))<h3 class="cond craft-about-extra__title">{{ $section['title'] }}</h3>@endif
      @if(!empty($section['description']))<p class="craft-about-extra__desc">{{ $section['description'] }}</p>@endif
    </div>
    <figure class="craft-about-extra__figure">
      <div class="craft-about-extra__img{{ !empty($section['image_url']) ? ' has-photo' : '' }}">
        <div class="craft-about-extra__ph" aria-hidden="true">Foto</div>
        @if(!empty($section['image_url']))
        <img src="{{ $section['image_url'] }}" alt="" loading="lazy" decoding="async"/>
        @endif
      </div>
    </figure>
  </article>
@endforeach
</div>
@else
<div id="aboutExtraBlocks" class="craft-about-extras"></div>
@endif
