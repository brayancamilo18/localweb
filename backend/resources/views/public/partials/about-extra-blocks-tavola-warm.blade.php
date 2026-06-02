{{-- Bloques extra «Sobre nosotros» — solo tavola-warm --}}
@if(!empty($about_sections))
<div id="aboutExtraBlocks" class="tavola-about-extras">
@foreach($about_sections as $i => $section)
@php
  $mainTextFirst = false;
  $textFirst = ($i + ($mainTextFirst ? 1 : 0)) % 2 === 0;
@endphp
@php $mod = $textFirst ? 'tavola-about-extra--text-first' : 'tavola-about-extra--photo-first'; $bn = str_pad((string) ($i + 3), 2, '0', STR_PAD_LEFT); @endphp
  <article class="tavola-about-extra story-grid {{ $mod }}">
    <div class="story-img tavola-about-extra__photo{{ !empty($section['image_url']) ? ' has-photo' : '' }}"@if(!empty($section['image_url'])) style="background-image:url('{{ $section['image_url'] }}')"@endif></div>
    <div class="story-content">
      <div class="ornament">capítulo {{ $bn }}</div>
      @if(!empty($section['title']))<h3 class="display">{{ $section['title'] }}</h3>@endif
      @if(!empty($section['description']))<p>{{ $section['description'] }}</p>@endif
    </div>
  </article>
@endforeach
</div>
@else
<div id="aboutExtraBlocks" class="tavola-about-extras"></div>
@endif
