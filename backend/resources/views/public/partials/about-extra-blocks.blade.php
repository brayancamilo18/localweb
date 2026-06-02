{{-- Bloques extra «Sobre nosotros» (Pro). Requiere lw-about-extras.js; CSS según plantilla. --}}
@php
  $wrapClass = $wrapperClass ?? 'lw-about-extras-root';
  $mainTextFirst = (bool) ($mainTextFirst ?? false);
  $isUrban = $wrapClass === 'urban-about-extras';
  $isCraft = $wrapClass === 'craft-about-extras';
  $isBloom = $wrapClass === 'bloom-about-extras';
  $isNoir = $wrapClass === 'noir-about-extras';
@endphp
@if(!empty($about_sections))
<div id="aboutExtraBlocks" class="{{ $wrapClass }}"@if($mainTextFirst) data-main-text-first="1"@endif>
@foreach($about_sections as $i => $section)
@php
  /* Primer extra al lado opuesto del bloque principal; luego se alterna */
  $textFirst = ($i + ($mainTextFirst ? 1 : 0)) % 2 === 0;
  $mod = $textFirst
    ? ($isUrban ? 'urban-about-extra--text-first' : ($isCraft ? 'craft-about-extra--text-first' : ($isBloom ? 'bloom-about-extra--text-first' : ($isNoir ? 'noir-about-extra--text-first' : 'lw-about-extra--text-first'))))
    : ($isUrban ? 'urban-about-extra--photo-first' : ($isCraft ? 'craft-about-extra--photo-first' : ($isBloom ? 'bloom-about-extra--photo-first' : ($isNoir ? 'noir-about-extra--photo-first' : 'lw-about-extra--photo-first'))));
@endphp
  @if($isUrban)
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
  @elseif($isCraft)
  <article class="craft-about-extra {{ $mod }}">
    <div class="craft-about-extra__copy">
      <span class="eyebrow craft-about-extra__kicker">Bloque {{ str_pad((string) ($i + 3), 2, '0', STR_PAD_LEFT) }}</span>
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
  @elseif($isBloom)
  <article class="bloom-about-extra {{ $mod }}">
    <div class="bloom-about-extra__copy r-right d-1">
      <span class="eyebrow-coral bloom-about-extra__kicker">Bloque {{ str_pad((string) ($i + 3), 2, '0', STR_PAD_LEFT) }}</span>
      @if(!empty($section['title']))<h3 class="bloom-about-extra__title">{{ $section['title'] }}</h3>@endif
      @if(!empty($section['description']))<p class="bloom-about-extra__desc">{{ $section['description'] }}</p>@endif
    </div>
    <div class="bloom-about-extra__photo r-left">
      <div class="bloom-about-extra__img{{ !empty($section['image_url']) ? ' has-photo' : '' }}">
        @if(!empty($section['image_url']))
        <img src="{{ $section['image_url'] }}" alt="" loading="lazy" decoding="async"/>
        @endif
      </div>
    </div>
  </article>
  @elseif($isNoir)
  <article class="noir-about-extra about-grid {{ $mod }}">
    <div class="about-text noir-about-extra__text">
      <span class="eyebrow reveal-up">— Bloque {{ str_pad((string) ($i + 3), 2, '0', STR_PAD_LEFT) }}</span>
      <div class="h-line short reveal-up delay-1"></div>
      @if(!empty($section['title']))<h3 class="noir-about-extra__title reveal-up delay-2">{{ $section['title'] }}</h3>@endif
      @if(!empty($section['description']))<p class="noir-about-extra__desc reveal-up delay-2">{{ $section['description'] }}</p>@endif
    </div>
    <div
      class="about-photo noir-about-extra__photo reveal-up delay-2{{ !empty($section['image_url']) ? ' has-photo' : '' }}"
      @if(!empty($section['image_url'])) style="background-image:url('{{ $section['image_url'] }}')"@endif
    ></div>
  </article>
  @else
  <article class="lw-about-extra {{ $mod }}">
    <div class="lw-about-extra__body">
      <span class="lw-about-extra__kicker reveal">✦ Capítulo {{ $i + 2 }} ✦</span>
      @if(!empty($section['title']))<h3 class="lw-about-extra__title reveal">{{ $section['title'] }}</h3>@endif
      @if(!empty($section['description']))<p class="lw-about-extra__desc reveal">{{ $section['description'] }}</p>@endif
    </div>
    <figure class="lw-about-extra__figure reveal">
      <div class="lw-about-extra__photo{{ !empty($section['image_url']) ? ' has-photo' : '' }}">
        <div class="lw-about-extra__photo-ph" aria-hidden="true">Foto</div>
        @if(!empty($section['image_url']))
        <img src="{{ $section['image_url'] }}" alt="" loading="lazy" decoding="async"/>
        @endif
      </div>
    </figure>
  </article>
  @endif
@endforeach
</div>
@else
<div id="aboutExtraBlocks" class="{{ $wrapClass }}"@if($mainTextFirst) data-main-text-first="1"@endif></div>
@endif
