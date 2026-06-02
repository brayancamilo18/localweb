{{-- Bloques extra «Sobre nosotros» — solo trust-clinic --}}
@if(!empty($about_sections))
<div id="aboutExtraBlocks" class="trust-about-extras">
@foreach($about_sections as $i => $section)
@php
  $mainTextFirst = false;
  $textFirst = ($i + ($mainTextFirst ? 1 : 0)) % 2 === 0;
@endphp
@php $mod = $textFirst ? 'trust-about-extra--text-first' : 'trust-about-extra--photo-first'; $bn = str_pad((string) ($i + 3), 2, '0', STR_PAD_LEFT); @endphp
  <article class="trust-about-extra trust-grid {{ $mod }}">
    <div class="trust-img trust-about-extra__photo{{ !empty($section['image_url']) ? ' has-photo' : '' }}"@if(!empty($section['image_url'])) style="background-image:url('{{ $section['image_url'] }}')"@endif></div>
    <div class="trust-content">
      <span class="eyebrow"><span class="rule"></span>Bloque {{ $bn }}</span>
      @if(!empty($section['title']))<h3 class="serif">{{ $section['title'] }}</h3>@endif
      @if(!empty($section['description']))<p>{{ $section['description'] }}</p>@endif
    </div>
  </article>
@endforeach
</div>
@else
<div id="aboutExtraBlocks" class="trust-about-extras"></div>
@endif
