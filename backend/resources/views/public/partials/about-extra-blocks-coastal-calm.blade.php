{{-- Bloques extra «Sobre nosotros» — solo coastal-calm --}}
@if(!empty($about_sections))
<div id="aboutExtraBlocks" class="coastal-about-extras">
@foreach($about_sections as $i => $section)
@php
  $mainTextFirst = false;
  $textFirst = ($i + ($mainTextFirst ? 1 : 0)) % 2 === 0;
@endphp
@php $mod = $textFirst ? 'coastal-about-extra--text-first' : 'coastal-about-extra--photo-first'; $bn = str_pad((string) ($i + 3), 2, '0', STR_PAD_LEFT); @endphp
  <article class="coastal-about-extra about-inner {{ $mod }}">
    <div class="about-photo-wrap slide-up">
      <div class="about-photo-main coastal-about-extra__photo{{ !empty($section['image_url']) ? ' has-photo' : '' }}"@if(!empty($section['image_url'])) style="background-image:url('{{ $section['image_url'] }}')"@endif role="img" aria-label=""></div>
    </div>
    <div class="about-text slide-up" data-d="1">
      <span class="eyebrow">Bloque {{ $bn }}</span>
      @if(!empty($section['title']))<h3 class="serif">{{ $section['title'] }}</h3>@endif
      @if(!empty($section['description']))<p>{{ $section['description'] }}</p>@endif
    </div>
  </article>
@endforeach
</div>
@else
<div id="aboutExtraBlocks" class="coastal-about-extras"></div>
@endif
