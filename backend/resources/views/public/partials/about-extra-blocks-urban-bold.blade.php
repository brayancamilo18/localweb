{{-- Bloques extra «Sobre nosotros» — solo urban-bold --}}
@if(!empty($about_sections))
<div id="aboutExtraBlocks" class="urban-about-extras">
@foreach($about_sections as $i => $section)
@php
  $mainTextFirst = false;
  $textFirst = ($i + ($mainTextFirst ? 1 : 0)) % 2 === 0;
  $mod = $textFirst ? 'urban-about-extra--text-first' : 'urban-about-extra--photo-first';
@endphp
  <article class="urban-about-extra {{ $mod }}">
    <div class="urban-about-extra__copy">
      <span class="urban-about-extra__kicker">[ {{ str_pad((string) ($i + 3), 2, '0', STR_PAD_LEFT) }} / {{ str_pad((string) ($i + 1), 2, '0', STR_PAD_LEFT) }} ]</span>
      @if(!empty($section['title']))<h3 class="urban-about-extra__title display">{{ $section['title'] }}</h3>@endif
      @if(!empty($section['description']))<p class="urban-about-extra__desc">{{ $section['description'] }}</p>@endif
    </div>
    <div class="urban-about-extra__media">
      <div class="urban-about-extra__img{{ !empty($section['image_url']) ? ' has-photo' : '' }}">
        <div class="urban-about-extra__ph" aria-hidden="true">Foto</div>
        @if(!empty($section['image_url']))
        <img src="{{ $section['image_url'] }}" alt="" loading="lazy" decoding="async"/>
        @endif
      </div>
    </div>
  </article>
@endforeach
</div>
@else
<div id="aboutExtraBlocks" class="urban-about-extras"></div>
@endif
