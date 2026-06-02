{{-- Bloques extra «Sobre nosotros» — solo kairos-bold --}}
@if(!empty($about_sections))
<div class="container">
<div id="aboutExtraBlocks" class="kairos-about-extras">
@foreach($about_sections as $i => $section)
@php
  $mainTextFirst = false;
  $textFirst = ($i + ($mainTextFirst ? 1 : 0)) % 2 === 0;
@endphp
@php $mod = $textFirst ? 'kairos-about-extra--text-first' : 'kairos-about-extra--photo-first'; $bn = str_pad((string) ($i + 3), 2, '0', STR_PAD_LEFT); @endphp
  <article class="kairos-about-extra about-grid {{ $mod }}">
    <figure class="about-photo kairos-about-extra__photo{{ !empty($section['image_url']) ? ' has-photo' : '' }}">
      @if(!empty($section['image_url']))
      <img src="{{ $section['image_url'] }}" alt="" loading="lazy" decoding="async"/>
      @else
      <div class="ph o" aria-hidden="true"><span class="ph-label">FOTO · {{ $bn }}</span></div>
      @endif
    </figure>
    <div class="about-body">
      <span class="cap reveal">★ Bloque {{ $bn }}</span>
      @if(!empty($section['title']))<h3 class="reveal">{{ $section['title'] }}</h3>@endif
      @if(!empty($section['description']))<p class="lede reveal">{{ $section['description'] }}</p>@endif
    </div>
  </article>
@endforeach
</div>
</div>
@else
<div class="container"><div id="aboutExtraBlocks" class="kairos-about-extras"></div></div>
@endif
