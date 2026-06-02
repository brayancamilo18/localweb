{{-- Bloques extra «Sobre nosotros» — solo wild-pet --}}
@if(!empty($about_sections))
<div class="container">
<div id="aboutExtraBlocks" class="wild-about-extras">
@foreach($about_sections as $i => $section)
@php
  $mainTextFirst = false;
  $textFirst = ($i + ($mainTextFirst ? 1 : 0)) % 2 === 0;
@endphp
@php $mod = $textFirst ? 'wild-about-extra--text-first' : 'wild-about-extra--photo-first'; $bn = str_pad((string) ($i + 3), 2, '0', STR_PAD_LEFT); $photoRot = $textFirst ? '-12deg' : '10deg'; @endphp
  <article class="wild-about-extra about-grid about {{ $mod }}">
    <div class="about-photo sr wild-about-extra__photo{{ !empty($section['image_url']) ? ' has-photo' : '' }}" style="--sr-rot:{{ $photoRot }};">
      <div class="photo-fallback{{ !empty($section['image_url']) ? ' has-photo' : '' }}"@if(!empty($section['image_url'])) style="background-image:url('{{ $section['image_url'] }}')"@endif role="img" aria-hidden="true">
        @if(empty($section['image_url']))
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="9" cy="9" r="3"/><circle cx="17" cy="11" r="2.4"/><path d="M3 20c0-3 3-5 6-5s6 2 6 5"/><path d="M14 20c0-2 2-4 4-4s3 1.5 3 3.5"/></svg>
        @endif
      </div>
    </div>
    <div class="wild-about-extra__body">
      <span class="eyebrow sr">Bloque {{ $bn }}</span>
      @if(!empty($section['title']))<h3 class="sr" style="--sr-rot:-2deg;">{{ $section['title'] }}</h3>@endif
      @if(!empty($section['description']))<p class="sr">{{ $section['description'] }}</p>@endif
    </div>
  </article>
@endforeach
</div>
</div>
@else
<div class="container"><div id="aboutExtraBlocks" class="wild-about-extras"></div></div>
@endif
