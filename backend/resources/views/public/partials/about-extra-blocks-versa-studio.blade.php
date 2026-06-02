{{-- Bloques extra «Sobre nosotros» — solo versa-studio --}}
@if(!empty($about_sections))
<div id="aboutExtraBlocks" class="versa-about-extras">
@foreach($about_sections as $i => $section)
@php
  $mainTextFirst = false;
  $textFirst = ($i + ($mainTextFirst ? 1 : 0)) % 2 === 0;
@endphp
@php $mod = $textFirst ? 'versa-about-extra--text-first' : 'versa-about-extra--photo-first'; $bn = str_pad((string) ($i + 3), 2, '0', STR_PAD_LEFT); @endphp
  <article class="versa-about-extra about-grid {{ $mod }}">
    <div class="about-img-wrap slide-up">
      <div class="about-img versa-about-extra__img{{ !empty($section['image_url']) ? ' has-photo' : '' }}"@if(!empty($section['image_url'])) style="background-image:url('{{ $section['image_url'] }}')"@endif></div>
      <div class="about-img-tag"><span class="dot"></span>Bloque {{ $bn }}</div>
    </div>
    <div class="about-text slide-up" data-d="1">
      <span class="eyebrow">Capítulo {{ $bn }}</span>
      @if(!empty($section['title']))<h3 class="display">{{ $section['title'] }}</h3>@endif
      @if(!empty($section['description']))<p>{{ $section['description'] }}</p>@endif
    </div>
  </article>
@endforeach
</div>
@else
<div id="aboutExtraBlocks" class="versa-about-extras"></div>
@endif
