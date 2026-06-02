{{-- Bloques extra «Sobre nosotros» — solo luxe-atelier --}}
@if(!empty($about_sections))
<div id="aboutExtraBlocks" class="luxe-about-extras">
@foreach($about_sections as $i => $section)
@php
  $mainTextFirst = false;
  $textFirst = ($i + ($mainTextFirst ? 1 : 0)) % 2 === 0;
@endphp
@php $mod = $textFirst ? 'luxe-about-extra--text-first' : 'luxe-about-extra--photo-first'; $bn = str_pad((string) ($i + 3), 2, '0', STR_PAD_LEFT); @endphp
  <article class="luxe-about-extra about-mosaic {{ $mod }}">
    <div class="about-photos slide-up">
      <div class="aphoto a1 luxe-about-extra__photo{{ !empty($section['image_url']) ? ' has-photo' : '' }}"@if(!empty($section['image_url'])) style="background-image:url('{{ $section['image_url'] }}')"@endif></div>
    </div>
    <div class="about-text slide-up" data-d="1">
      <span class="eyebrow">Capítulo {{ $bn }}</span>
      @if(!empty($section['title']))<h3 class="serif">{{ $section['title'] }}</h3>@endif
      @if(!empty($section['description']))<p>{{ $section['description'] }}</p>@endif
    </div>
  </article>
@endforeach
</div>
@else
<div id="aboutExtraBlocks" class="luxe-about-extras"></div>
@endif
