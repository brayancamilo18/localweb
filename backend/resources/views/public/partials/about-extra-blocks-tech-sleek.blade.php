{{-- Bloques extra «Sobre nosotros» — solo tech-sleek --}}
@if(!empty($about_sections))
<div id="aboutExtraBlocks" class="sleek-about-extras" data-main-text-first="1">
@foreach($about_sections as $i => $section)
@php
  $mainTextFirst = true;
  $textFirst = ($i + ($mainTextFirst ? 1 : 0)) % 2 === 0;
@endphp
@php $mod = $textFirst ? 'sleek-about-extra--text-first' : 'sleek-about-extra--photo-first'; $bn = str_pad((string) ($i + 3), 2, '0', STR_PAD_LEFT); @endphp
  <article class="sleek-about-extra about-inner {{ $mod }}">
    <div class="about-text">
      <span class="eyebrow">Bloque {{ $bn }}</span>
      @if(!empty($section['title']))<h3><span>{{ $section['title'] }}</span></h3>@endif
      @if(!empty($section['description']))<p>{{ $section['description'] }}</p>@endif
    </div>
    <div class="about-photo-col">
      <div class="about-photo sleek-about-extra__photo{{ !empty($section['image_url']) ? '' : ' is-empty' }}">
        @if(!empty($section['image_url']))
        <img src="{{ $section['image_url'] }}" alt="" loading="lazy" decoding="async"/>
        @endif
        <div class="about-photo-accent"></div>
      </div>
    </div>
  </article>
@endforeach
</div>
@else
<div id="aboutExtraBlocks" class="sleek-about-extras" data-main-text-first="1"></div>
@endif
