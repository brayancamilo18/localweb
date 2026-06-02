#!/usr/bin/env python3
"""Build template-specific about-extra partials + inject CSS into blades."""
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
PARTIALS = ROOT / "backend/resources/views/public/partials"
BLADE = ROOT / "backend/resources/views/public/templates"
HTML = ROOT / "front/public/templates"

# slug -> main_text_first (principal texto izq / foto der)
MAIN_TEXT_FIRST = {
    "graphite-soft": True,
    "mono-edito": True,
    "tech-sleek": True,
}

# Clase del contenedor #aboutExtraBlocks (debe coincidir con CSS en cada blade)
WRAPPER_CLASS = {
    "coastal-calm": "coastal-about-extras",
    "tavola-warm": "tavola-about-extras",
    "mono-edito": "mono-about-extras",
    "graphite-soft": "graphite-about-extras",
    "wild-pet": "wild-about-extras",
    "kairos-bold": "kairos-about-extras",
    "versa-studio": "versa-about-extras",
    "luxe-atelier": "luxe-about-extras",
    "tech-sleek": "sleek-about-extras",
    "trust-clinic": "trust-about-extras",
    "craft-pro": "craft-about-extras",
}

CSS_LINK = '<link rel="stylesheet" href="/templates/lw-about-extras.css?v=2">\n'
JS_LINK = '<script src="/templates/lw-about-extras.js?v=2"></script>'

PARTIALS_CONTENT: dict[str, str] = {}

def alt_php(main_tf: bool) -> str:
    m = "true" if main_tf else "false"
    return f"""@php
  $mainTextFirst = {m};
  $textFirst = ($i + ($mainTextFirst ? 1 : 0)) % 2 === 0;
@endphp"""


def wrap_empty(slug: str, inner: str, attrs: str = "") -> str:
    wc = WRAPPER_CLASS.get(slug, f"{slug}-about-extras")
    return (
        f"{{{{-- Bloques extra «Sobre nosotros» — solo {slug} --}}}}\n"
        f"@if(!empty($about_sections))\n"
        f'<div id="aboutExtraBlocks" class="{wc}"{attrs}>\n'
        f"@foreach($about_sections as $i => $section)\n"
        f"{inner}\n"
        f"@endforeach\n"
        f"</div>\n"
        f"@else\n"
        f'<div id="aboutExtraBlocks" class="{wc}"{attrs}></div>\n'
        f"@endif\n"
    )


# --- coastal-calm ---
PARTIALS_CONTENT["coastal-calm"] = wrap_empty(
    "coastal-calm",
    alt_php(False)
    + """
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
  </article>""",
)

# --- tavola-warm ---
PARTIALS_CONTENT["tavola-warm"] = wrap_empty(
    "tavola-warm",
    alt_php(False)
    + """
@php $mod = $textFirst ? 'tavola-about-extra--text-first' : 'tavola-about-extra--photo-first'; $bn = str_pad((string) ($i + 3), 2, '0', STR_PAD_LEFT); @endphp
  <article class="tavola-about-extra story-grid {{ $mod }}">
    <div class="story-img tavola-about-extra__photo{{ !empty($section['image_url']) ? ' has-photo' : '' }}"@if(!empty($section['image_url'])) style="background-image:url('{{ $section['image_url'] }}')"@endif></div>
    <div class="story-content">
      <div class="ornament">capítulo {{ $bn }}</div>
      @if(!empty($section['title']))<h3 class="display">{{ $section['title'] }}</h3>@endif
      @if(!empty($section['description']))<p>{{ $section['description'] }}</p>@endif
    </div>
  </article>""",
)

# --- mono-edito ---
PARTIALS_CONTENT["mono-edito"] = wrap_empty(
    "mono-edito",
    alt_php(True)
    + """
@php $mod = $textFirst ? 'mono-about-extra--text-first' : 'mono-about-extra--photo-first'; $bn = str_pad((string) ($i + 3), 2, '0', STR_PAD_LEFT); @endphp
  <article class="mono-about-extra about-grid {{ $mod }}">
    <div class="slide-up">
      <span class="eyebrow">Bloque {{ $bn }}</span>
      @if(!empty($section['title']))<h3 class="serif">{{ $section['title'] }}</h3>@endif
      @if(!empty($section['description']))<p class="about-lede" style="margin-top:1.2rem">{{ $section['description'] }}</p>@endif
    </div>
    <div class="about-side slide-up" data-d="1">
      <div class="about-photo mono-about-extra__photo{{ !empty($section['image_url']) ? ' has-photo' : '' }}"@if(!empty($section['image_url'])) style="background-image:url('{{ $section['image_url'] }}')"@endif></div>
      <div class="about-cap"><span>Equipo</span><strong>Bloque {{ $bn }}</strong></div>
    </div>
  </article>""",
    ' data-main-text-first="1"',
)

# --- graphite-soft ---
PARTIALS_CONTENT["graphite-soft"] = wrap_empty(
    "graphite-soft",
    alt_php(True)
    + """
@php $mod = $textFirst ? 'graphite-about-extra--text-first' : 'graphite-about-extra--photo-first'; $bn = str_pad((string) ($i + 3), 2, '0', STR_PAD_LEFT); @endphp
  <article class="graphite-about-extra about-grid {{ $mod }}">
    <div class="about-text">
      <span class="sec-num">N° {{ $bn }} — Extra</span>
      @if(!empty($section['title']))<h3 class="serif h-section" style="margin-top:14px">{{ $section['title'] }}</h3>@endif
      @if(!empty($section['description']))<p class="lede" style="margin-top:24px">{{ $section['description'] }}</p>@endif
    </div>
    <div class="about-photos">
      <div class="about-photo reveal-img{{ !empty($section['image_url']) ? ' has-photo in' : '' }}">
        <div class="img"@if(!empty($section['image_url'])) style="background-image:url('{{ $section['image_url'] }}')"@endif></div>
        <cap>Equipo</cap>
      </div>
    </div>
  </article>""",
    ' data-main-text-first="1"',
)

# --- wild-pet ---
PARTIALS_CONTENT["wild-pet"] = (
    "{{-- Bloques extra «Sobre nosotros» — solo wild-pet --}}\n"
    "@if(!empty($about_sections))\n"
    '<div class="container">\n'
    '<div id="aboutExtraBlocks" class="wild-about-extras">\n'
    "@foreach($about_sections as $i => $section)\n"
    + alt_php(False)
    + """
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
  </article>"""
    + "\n@endforeach\n</div>\n</div>\n@else\n"
    '<div class="container"><div id="aboutExtraBlocks" class="wild-about-extras"></div></div>\n'
    "@endif\n"
)

# --- kairos-bold ---
PARTIALS_CONTENT["kairos-bold"] = (
    "{{-- Bloques extra «Sobre nosotros» — solo kairos-bold --}}\n"
    "@if(!empty($about_sections))\n"
    '<div class="container">\n'
    '<div id="aboutExtraBlocks" class="kairos-about-extras">\n'
    "@foreach($about_sections as $i => $section)\n"
    + alt_php(False)
    + """
@php $mod = $textFirst ? 'kairos-about-extra--text-first' : 'kairos-about-extra--photo-first'; $bn = str_pad((string) ($i + 3), 2, '0', STR_PAD_LEFT); @endphp
  <article class="kairos-about-extra about-grid {{ $mod }}">
    <figure class="about-photo kairos-about-extra__photo{{ !empty($section['image_url']) ? ' has-photo' : '' }}">
      @if(!empty($section['image_url']))
      <img src="{{ $section['image_url'] }}" alt="" loading="lazy" decoding="async"/>
      @else
      <div class="ph o" aria-hidden="true"><span class="ph-label">FOTO · {{ $bn }}</span></div>
      @endif
    </figure>
    <div class="about-body">
      <span class="cap reveal">★ Bloque {{ $bn }}</span>
      @if(!empty($section['title']))<h3 class="reveal">{{ $section['title'] }}</h3>@endif
      @if(!empty($section['description']))<p class="lede reveal">{{ $section['description'] }}</p>@endif
    </div>
  </article>"""
    + "\n@endforeach\n</div>\n</div>\n@else\n"
    '<div class="container"><div id="aboutExtraBlocks" class="kairos-about-extras"></div></div>\n'
    "@endif\n"
)

# --- versa-studio ---
PARTIALS_CONTENT["versa-studio"] = wrap_empty(
    "versa-studio",
    alt_php(False)
    + """
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
  </article>""",
)

# --- luxe-atelier ---
PARTIALS_CONTENT["luxe-atelier"] = wrap_empty(
    "luxe-atelier",
    alt_php(False)
    + """
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
  </article>""",
)

# --- tech-sleek ---
PARTIALS_CONTENT["tech-sleek"] = wrap_empty(
    "tech-sleek",
    alt_php(True)
    + """
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
  </article>""",
    ' data-main-text-first="1"',
)

# --- trust-clinic ---
PARTIALS_CONTENT["trust-clinic"] = wrap_empty(
    "trust-clinic",
    alt_php(False)
    + """
@php $mod = $textFirst ? 'trust-about-extra--text-first' : 'trust-about-extra--photo-first'; $bn = str_pad((string) ($i + 3), 2, '0', STR_PAD_LEFT); @endphp
  <article class="trust-about-extra trust-grid {{ $mod }}">
    <div class="trust-img trust-about-extra__photo{{ !empty($section['image_url']) ? ' has-photo' : '' }}"@if(!empty($section['image_url'])) style="background-image:url('{{ $section['image_url'] }}')"@endif></div>
    <div class="trust-content">
      <span class="eyebrow"><span class="rule"></span>Bloque {{ $bn }}</span>
      @if(!empty($section['title']))<h3 class="serif">{{ $section['title'] }}</h3>@endif
      @if(!empty($section['description']))<p>{{ $section['description'] }}</p>@endif
    </div>
  </article>""",
)

# --- craft-pro (from existing branch) ---
PARTIALS_CONTENT["craft-pro"] = wrap_empty(
    "craft-pro",
    alt_php(False)
    + """
@php
  $mod = $textFirst ? 'craft-about-extra--text-first' : 'craft-about-extra--photo-first';
  $blockNum = str_pad((string) ($i + 3), 2, '0', STR_PAD_LEFT);
@endphp
  <article class="craft-about-extra {{ $mod }}">
    <div class="craft-about-extra__copy">
      <span class="eyebrow craft-about-extra__kicker">Bloque {{ $blockNum }}</span>
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
  </article>""",
)

CSS_BLOCKS: dict[str, str] = {
    "coastal-calm": """
  /* ─── ABOUT EXTRAS (coastal-calm) ─── */
  .coastal-about-extras{display:flex;flex-direction:column;gap:96px;margin-top:96px;padding-top:72px;border-top:1px solid rgba(42,42,38,.08);max-width:1254px;margin-left:auto;margin-right:auto}
  .coastal-about-extra.about-inner{max-width:100%}
  .coastal-about-extra--text-first .about-text{order:1}
  .coastal-about-extra--text-first .about-photo-wrap{order:2}
  .coastal-about-extra--photo-first .about-photo-wrap{order:1}
  .coastal-about-extra--photo-first .about-text{order:2}
  .coastal-about-extra .about-text h3{font-family:"DM Serif Display",serif;font-size:clamp(40px,4.5vw,54px);margin:20px 0 28px;letter-spacing:-.01em}
  @media (max-width:768px){.coastal-about-extra.about-inner{grid-template-columns:1fr;gap:48px}.coastal-about-extra .about-photo-wrap{order:-1!important}}
""",
    "tavola-warm": """
  /* ─── ABOUT EXTRAS (tavola-warm) ─── */
  .tavola-about-extras{display:flex;flex-direction:column;gap:80px;margin-top:80px;padding-top:64px;border-top:1px solid rgba(245,235,218,.12);max-width:1254px;margin-left:auto;margin-right:auto;padding-left:46px;padding-right:46px;box-sizing:border-box;width:100%}
  .tavola-about-extra.story-grid{position:relative}
  .tavola-about-extra--text-first .tavola-about-extra__photo{order:2}
  .tavola-about-extra--text-first .story-content{order:1}
  .tavola-about-extra--photo-first .tavola-about-extra__photo{order:1}
  .tavola-about-extra--photo-first .story-content{order:2}
  .tavola-about-extra .story-content h3{font-family:"DM Serif Display",serif;font-size:clamp(40px,4.5vw,54px);font-weight:400;line-height:1.05;color:var(--cream);margin:14px 0 28px}
  .tavola-about-extra .story-content p{font-size:17px;line-height:1.75;color:rgba(245,235,218,.82);font-style:italic;max-width:520px}
  @media (max-width:980px){.tavola-about-extra .tavola-about-extra__photo{order:-1!important;max-width:480px;margin:0 auto;width:100%}}
""",
    "mono-edito": """
  /* ─── ABOUT EXTRAS (mono-edito) ─── */
  .mono-about-extras{display:flex;flex-direction:column;gap:96px;margin-top:96px;padding-top:64px;border-top:1px solid var(--ink);max-width:1320px;margin-left:auto;margin-right:auto;padding-left:54px;padding-right:54px;box-sizing:border-box}
  .mono-about-extra.about-grid{align-items:start}
  .mono-about-extra--text-first > :first-child{order:1}
  .mono-about-extra--text-first > :last-child{order:2}
  .mono-about-extra--photo-first > :first-child{order:2}
  .mono-about-extra--photo-first > :last-child{order:1}
  .mono-about-extra h3{font-family:"Playfair Display",serif;font-size:clamp(36px,4.5vw,56px);font-weight:500;line-height:.96;letter-spacing:-.02em;margin:24px 0 28px}
  @media (max-width:768px){.mono-about-extras{padding:0 20px}.mono-about-extra.about-grid{grid-template-columns:1fr;gap:48px}.mono-about-extra .about-side{order:-1!important}}
""",
    "graphite-soft": """
  /* ABOUT EXTRAS (graphite-soft) */
  .graphite-about-extras{display:flex;flex-direction:column;gap:64px;margin-top:64px;padding-top:48px;border-top:1px solid var(--line);max-width:1320px;margin-left:auto;margin-right:auto;padding-left:54px;padding-right:54px;box-sizing:border-box}
  .graphite-about-extra.about-grid{align-items:start}
  .graphite-about-extra--text-first .about-text{order:1}
  .graphite-about-extra--text-first .about-photos{order:2}
  .graphite-about-extra--photo-first .about-photos{order:1}
  .graphite-about-extra--photo-first .about-text{order:2}
  .graphite-about-extra .about-text h3{margin-bottom:24px}
  @media (max-width:880px){.graphite-about-extras{padding:0 20px}.graphite-about-extra.about-grid{grid-template-columns:1fr}.graphite-about-extra .about-photos{order:-1!important}}
""",
    "wild-pet": """
  /* ABOUT EXTRAS (wild-pet) */
  .wild-about-extras{display:flex;flex-direction:column;gap:clamp(2rem,5vw,4rem);margin-top:clamp(2rem,5vw,4rem);padding-top:clamp(1.5rem,4vw,2.5rem);border-top:3px solid var(--ink)}
  .wild-about-extra.about-grid{align-items:center}
  .wild-about-extra--text-first .wild-about-extra__body{order:1}
  .wild-about-extra--text-first .wild-about-extra__photo{order:2}
  .wild-about-extra--photo-first .wild-about-extra__photo{order:1}
  .wild-about-extra--photo-first .wild-about-extra__body{order:2}
  .wild-about-extra .wild-about-extra__body h3{font-family:var(--display);font-weight:800;font-size:clamp(1.5rem,4vw,2.2rem);margin-top:.5rem;line-height:1.05}
  .wild-about-extra .wild-about-extra__body p{font-size:1.1rem;margin-top:1.2rem;opacity:.8;max-width:56ch}
  .wild-about-extra .wild-about-extra__photo{max-width:100%}
  @media (max-width:768px){.wild-about-extra.about-grid{grid-template-columns:1fr}.wild-about-extra .wild-about-extra__photo{order:-1!important;max-width:320px;margin-inline:auto}}
""",
    "kairos-bold": """
  /* ABOUT EXTRAS (kairos-bold) */
  .kairos-about-extras{display:flex;flex-direction:column;gap:clamp(2rem,5vw,4rem);margin-top:clamp(2rem,5vw,4rem);padding-top:clamp(1.5rem,4vw,2rem)}
  .kairos-about-extra--text-first .kairos-about-extra__photo{order:2}
  .kairos-about-extra--text-first .about-body{order:1}
  .kairos-about-extra--photo-first .kairos-about-extra__photo{order:1}
  .kairos-about-extra--photo-first .about-body{order:2}
  .kairos-about-extra .about-body h3{font-size:clamp(2rem,4vw,3rem);margin-top:1rem}
  .kairos-about-extras .reveal{opacity:1;transform:none}
  @media (max-width:768px){.kairos-about-extra.about-grid{grid-template-columns:1fr}.kairos-about-extra .kairos-about-extra__photo{order:-1!important;max-width:440px;margin:0 auto}}
""",
    "versa-studio": """
  /* ABOUT EXTRAS (versa-studio) */
  .versa-about-extras{display:flex;flex-direction:column;gap:80px;margin-top:80px;padding-top:56px;border-top:1px solid var(--line-2);max-width:1280px;margin-left:auto;margin-right:auto;padding:0 46px;box-sizing:border-box}
  .versa-about-extra--text-first .about-text{order:1}
  .versa-about-extra--text-first .about-img-wrap{order:2}
  .versa-about-extra--photo-first .about-img-wrap{order:1}
  .versa-about-extra--photo-first .about-text{order:2}
  .versa-about-extra .about-text h3{font-family:"Bricolage Grotesque";font-size:clamp(40px,4.5vw,54px);font-weight:600;line-height:1;letter-spacing:-.03em;margin:18px 0 28px}
  @media (max-width:768px){.versa-about-extras{padding:0 20px}.versa-about-extra.about-grid{grid-template-columns:1fr;gap:48px}.versa-about-extra .about-img-wrap{order:-1!important}}
""",
    "luxe-atelier": """
  /* ABOUT EXTRAS (luxe-atelier) */
  .luxe-about-extras{display:flex;flex-direction:column;gap:80px;margin-top:80px;padding-top:56px;border-top:1px solid var(--line-2);max-width:1280px;margin-left:auto;margin-right:auto;padding:0 54px;box-sizing:border-box}
  .luxe-about-extra.about-mosaic{max-width:100%}
  .luxe-about-extra--text-first .about-photos{order:2}
  .luxe-about-extra--text-first .about-text{order:1}
  .luxe-about-extra--photo-first .about-photos{order:1}
  .luxe-about-extra--photo-first .about-text{order:2}
  .luxe-about-extra .about-text h3{font-family:"Cormorant Garamond",serif;font-size:clamp(44px,4.5vw,60px);font-weight:400;line-height:1.04;margin:24px 0 32px}
  @media (max-width:768px){.luxe-about-extras{padding:0 20px}.luxe-about-extra.about-mosaic{grid-template-columns:1fr;gap:48px}.luxe-about-extra .about-photos{order:-1!important;max-width:520px;margin:0 auto}}
""",
    "tech-sleek": """
  /* ABOUT EXTRAS (tech-sleek) */
  .sleek-about-extras{display:flex;flex-direction:column;gap:64px;margin-top:64px;padding-top:48px;border-top:1px solid var(--line-2);max-width:1280px;margin-left:auto;margin-right:auto;padding:0 clamp(20px,4vw,46px);box-sizing:border-box}
  .sleek-about-extra.about-inner{align-items:center}
  .sleek-about-extra--text-first .about-text{order:1}
  .sleek-about-extra--text-first .about-photo-col{order:2}
  .sleek-about-extra--photo-first .about-photo-col{order:1}
  .sleek-about-extra--photo-first .about-text{order:2}
  .sleek-about-extra .about-text h3{font-size:clamp(36px,3.5vw,46px);font-weight:600;letter-spacing:-.025em;line-height:1.1;margin:0}
  .sleek-about-extra .about-text h3 span{background:linear-gradient(135deg,var(--cyan),var(--violet));-webkit-background-clip:text;background-clip:text;color:transparent}
  @media (max-width:768px){.sleek-about-extra.about-inner{grid-template-columns:1fr;gap:40px}.sleek-about-extra .about-photo-col{order:-1!important}}
""",
    "trust-clinic": """
  /* ABOUT EXTRAS (trust-clinic) */
  .trust-about-extras{display:flex;flex-direction:column;gap:80px;margin-top:64px;padding-top:48px;border-top:1px solid var(--line)}
  .trust-about-extra--text-first .trust-about-extra__photo{order:2}
  .trust-about-extra--text-first .trust-content{order:1}
  .trust-about-extra--photo-first .trust-about-extra__photo{order:1}
  .trust-about-extra--photo-first .trust-content{order:2}
  .trust-about-extra .trust-content h3{font-family:"Source Serif 4",serif;font-size:clamp(36px,3.5vw,46px);font-weight:500;line-height:1.1;letter-spacing:-0.02em;margin:18px 0 28px}
  @media (max-width:900px){.trust-about-extra.trust-grid{grid-template-columns:1fr;gap:40px}.trust-about-extra .trust-about-extra__photo{order:-1!important}}
""",
}


def inject_css(blade_path: Path, slug: str) -> None:
    css = CSS_BLOCKS.get(slug)
    if not css:
        return
    text = blade_path.read_text()
    marker = f"/* ─── ABOUT EXTRAS ({slug}) ─── */"
    alt_marker = f"/* ABOUT EXTRAS ({slug}) */"
    if marker in text or alt_marker in text:
        # replace existing block
        pat = re.compile(
            rf"/\* ─── ABOUT EXTRAS \({re.escape(slug)}\) ─── \*/.*?(?=\n  /\* ───|\n  /\* ABOUT|\n  /\* =====|\n  \.offerings|\n  \.gallery|\n  section\.|\n  @media)",
            re.DOTALL,
        )
        if pat.search(text):
            text = pat.sub(css.strip() + "\n", text)
        else:
            pat2 = re.compile(
                rf"/\* ABOUT EXTRAS \({re.escape(slug)}\) \*/.*?(?=\n  /\*|\n  \.)",
                re.DOTALL,
            )
            if pat2.search(text):
                text = pat2.sub(css.strip() + "\n", text)
    else:
        # insert after main about block - find first gallery/services comment after about
        insert_after = [
            "  /* ─── GALLERY",
            "  /* ─── ROOMS",
            "  /* ─── GALERIA",
            "  /* ─── GALLERY ·",
            "  /* ─── GALLERY (",
            "  /* Gallery",
            "  /* ===== GALERIA",
            "  /* ─── HOURS",
            "  /* ─── HORARIO",
            "  .gallery{",
            "  .offerings{",
        ]
        inserted = False
        for ins in insert_after:
            if ins in text:
                text = text.replace(ins, css + ins, 1)
                inserted = True
                break
        if not inserted:
            fallbacks = {
                "graphite-soft": ("/* Gallery — al bajar", css + "\n\n"),
                "tech-sleek": ("/* GALLERY */", css + "\n"),
            }
            fb = fallbacks.get(slug)
            if fb and fb[0] in text:
                text = text.replace(fb[0], fb[1] + fb[0], 1)
                inserted = True
        if not inserted:
            text = text.replace("  .about p{", css + "  .about p{", 1)
    blade_path.write_text(text)


def patch_html_about_extras(html_path: Path, slug: str) -> None:
    if slug not in WRAPPER_CLASS:
        return
    text = html_path.read_text()
    wc = WRAPPER_CLASS[slug]
    mtf = MAIN_TEXT_FIRST.get(slug, False)
    attrs = ' data-main-text-first="1"' if mtf else ""
    text = re.sub(
        r'<div id="aboutExtraBlocks" class="[^"]*"(?:\s+data-main-text-first="1")?\s*></div>',
        f'<div id="aboutExtraBlocks" class="{wc}"{attrs}></div>',
        text,
        count=1,
    )
    css = CSS_BLOCKS.get(slug, "").strip()
    marker = f"ABOUT EXTRAS ({slug})"
    alt_marker = f"─── ABOUT EXTRAS ({slug})"
    if css and marker not in text and alt_marker not in text:
        for ins in (
            "  /* ─── GALLERY",
            "  /* ─── ROOMS",
            "  /* ─── GALERIA",
            "  /* ===== GALERIA ===== */",
            "  /* ─── HOURS",
            "  /* Gallery",
            "/* GALLERY */",
            "  .gallery-section{",
            "  .offerings{",
        ):
            if ins in text:
                text = text.replace(ins, css + "\n" + ins, 1)
                break
    text = strip_lw_css(text)
    html_path.write_text(text)


def strip_lw_css(text: str) -> str:
    return text.replace(CSS_LINK, "")


def main() -> None:
    for slug, content in PARTIALS_CONTENT.items():
        (PARTIALS / f"about-extra-blocks-{slug}.blade.php").write_text(content)
        print("partial", slug)

    for slug in PARTIALS_CONTENT:
        blade = BLADE / f"{slug}.blade.php"
        if blade.exists():
            inject_css(blade, slug)
            text = blade.read_text()
            if CSS_LINK in text and slug in CSS_BLOCKS:
                blade.write_text(strip_lw_css(text))
            print("blade", slug)

    for slug in PARTIALS_CONTENT:
        html = HTML / f"{slug}.html"
        if html.exists():
            patch_html_about_extras(html, slug)
            print("html patched", slug)

    print("done")


if __name__ == "__main__":
    main()
