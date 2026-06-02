{{-- Bloques extra «Sobre nosotros» — solo la-republica-vintage --}}
@if(!empty($about_sections))
<div id="aboutExtraBlocks" class="rep-about-extras">
@foreach($about_sections as $i => $section)
@php
  $mainTextFirst = false;
  $textFirst = ($i + ($mainTextFirst ? 1 : 0)) % 2 === 0;
  $gridMod = $textFirst ? 'about-grid--text-first' : 'about-grid--photo-first';
  $chapter = str_pad((string) ($i + 2), 2, '0', STR_PAD_LEFT);
@endphp
  <article class="about-grid {{ $gridMod }} about-extra rep-about-extra">
    <figure class="about-figure reveal">
      <div class="vphoto{{ !empty($section['image_url']) ? ' has-photo' : '' }}">
        <div class="ph" role="img" aria-hidden="true">
          <span class="ph-orn">✦</span>
          <span class="ph-label">FOTO · {{ $chapter }}</span>
        </div>
        @if(!empty($section['image_url']))
        <img class="rep-photo" src="{{ $section['image_url'] }}" alt="" loading="lazy" decoding="async"/>
        @endif
      </div>
    </figure>
    <div class="about-body">
      <span class="eyebrow flank reveal">— Capítulo {{ $chapter }} —</span>
      @if(!empty($section['title']))<h3 class="reveal">{{ $section['title'] }}</h3>@endif
      @if(!empty($section['description']))<p class="lede reveal">{{ $section['description'] }}</p>@endif
    </div>
  </article>
@endforeach
</div>
@else
<div id="aboutExtraBlocks" class="rep-about-extras"></div>
@endif
