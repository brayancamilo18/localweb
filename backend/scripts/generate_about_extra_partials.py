#!/usr/bin/env python3
"""Generate per-template about-extra-blocks partials and update blade/html includes."""
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
PARTIALS = ROOT / "backend/resources/views/public/partials"
BLADE_DIR = ROOT / "backend/resources/views/public/templates"
HTML_DIR = ROOT / "front/public/templates"

# main_text_first: bloque principal con texto a la izquierda / foto a la derecha
TEMPLATES: dict[str, dict] = {
    "coastal-calm": {"main_text_first": False, "kind": "lw"},
    "luxe-atelier": {"main_text_first": False, "kind": "lw"},
    "trust-clinic": {"main_text_first": False, "kind": "lw"},
    "graphite-soft": {"main_text_first": True, "kind": "lw"},
    "wild-pet": {"main_text_first": False, "kind": "lw"},
    "kairos-bold": {"main_text_first": False, "kind": "lw"},
    "tech-sleek": {"main_text_first": True, "kind": "lw"},
    "tavola-warm": {"main_text_first": False, "kind": "lw"},
    "versa-studio": {"main_text_first": False, "kind": "lw"},
    "mono-edito": {"main_text_first": True, "kind": "lw"},
    "craft-pro": {"main_text_first": False, "kind": "craft"},
}

DONE = {
    "la-republica-vintage",
    "urban-bold",
    "noir-elite",
    "bloom-studio",
}


def lw_partial(slug: str, main_text_first: bool) -> str:
    mtf_php = "true" if main_text_first else "false"
    wrap_attrs = ' data-main-text-first="1"' if main_text_first else ""
    return (
        "{{-- Bloques extra «Sobre nosotros» — solo "
        + slug
        + " --}}\n"
        + "@php\n  $mainTextFirst = "
        + mtf_php
        + ";\n@endphp\n"
        + "@if(!empty($about_sections))\n"
        + '<div id="aboutExtraBlocks" class="lw-about-extras-root"'
        + wrap_attrs
        + ">\n"
        + "@foreach($about_sections as $i => $section)\n"
        + "@php\n"
        + "  $textFirst = ($i + ($mainTextFirst ? 1 : 0)) % 2 === 0;\n"
        + "  $mod = $textFirst ? 'lw-about-extra--text-first' : 'lw-about-extra--photo-first';\n"
        + "@endphp\n"
        + '  <article class="lw-about-extra {{ $mod }}">\n'
        + '    <div class="lw-about-extra__body">\n'
        + '      <span class="lw-about-extra__kicker reveal">✦ Capítulo {{ $i + 2 }} ✦</span>\n'
        + "      @if(!empty($section['title']))<h3 class=\"lw-about-extra__title reveal\">{{ $section['title'] }}</h3>@endif\n"
        + "      @if(!empty($section['description']))<p class=\"lw-about-extra__desc reveal\">{{ $section['description'] }}</p>@endif\n"
        + "    </div>\n"
        + '    <figure class="lw-about-extra__figure reveal">\n'
        + "      <div class=\"lw-about-extra__photo{{ !empty($section['image_url']) ? ' has-photo' : '' }}\">\n"
        + '        <div class="lw-about-extra__photo-ph" aria-hidden="true">Foto</div>\n'
        + "        @if(!empty($section['image_url']))\n"
        + '        <img src="{{ $section[\'image_url\'] }}" alt="" loading="lazy" decoding="async"/>\n'
        + "        @endif\n"
        + "      </div>\n"
        + "    </figure>\n"
        + "  </article>\n"
        + "@endforeach\n"
        + "</div>\n"
        + "@else\n"
        + '<div id="aboutExtraBlocks" class="lw-about-extras-root"'
        + wrap_attrs
        + "></div>\n"
        + "@endif\n"
    )


def craft_partial(slug: str) -> str:
    return (
        "{{-- Bloques extra «Sobre nosotros» — solo "
        + slug
        + " --}}\n"
        + "@if(!empty($about_sections))\n"
        + '<div id="aboutExtraBlocks" class="craft-about-extras">\n'
        + "@foreach($about_sections as $i => $section)\n"
        + "@php\n"
        + "  $textFirst = $i % 2 === 0;\n"
        + "  $mod = $textFirst ? 'craft-about-extra--text-first' : 'craft-about-extra--photo-first';\n"
        + "  $blockNum = str_pad((string) ($i + 3), 2, '0', STR_PAD_LEFT);\n"
        + "@endphp\n"
        + '  <article class="craft-about-extra {{ $mod }}">\n'
        + '    <div class="craft-about-extra__copy">\n'
        + '      <span class="eyebrow craft-about-extra__kicker">Bloque {{ $blockNum }}</span>\n'
        + "      @if(!empty($section['title']))<h3 class=\"cond craft-about-extra__title\">{{ $section['title'] }}</h3>@endif\n"
        + "      @if(!empty($section['description']))<p class=\"craft-about-extra__desc\">{{ $section['description'] }}</p>@endif\n"
        + "    </div>\n"
        + '    <figure class="craft-about-extra__figure">\n'
        + "      <div class=\"craft-about-extra__img{{ !empty($section['image_url']) ? ' has-photo' : '' }}\">\n"
        + '        <div class="craft-about-extra__ph" aria-hidden="true">Foto</div>\n'
        + "        @if(!empty($section['image_url']))\n"
        + '        <img src="{{ $section[\'image_url\'] }}" alt="" loading="lazy" decoding="async"/>\n'
        + "        @endif\n"
        + "      </div>\n"
        + "    </figure>\n"
        + "  </article>\n"
        + "@endforeach\n"
        + "</div>\n"
        + "@else\n"
        + '<div id="aboutExtraBlocks" class="craft-about-extras"></div>\n'
        + "@endif\n"
    )


def generate_partial(slug: str, cfg: dict) -> str:
    if cfg["kind"] == "craft":
        return craft_partial(slug)
    return lw_partial(slug, cfg["main_text_first"])


INCLUDE_OLD_PATTERNS = [
    re.compile(
        r"@include\('public\.partials\.about-extra-blocks'[^)]*\)\s*\n?",
        re.MULTILINE,
    ),
    re.compile(
        r"@include\('public\.partials\.about-extra-blocks-[^']+'\)\s*\n?",
        re.MULTILINE,
    ),
]

INCLUDE_NEW = "@include('public.partials.about-extra-blocks-{slug}')\n"

CSS_LINK = '<link rel="stylesheet" href="/templates/lw-about-extras.css?v=2">\n'


def update_blade(slug: str) -> bool:
    path = BLADE_DIR / f"{slug}.blade.php"
    if not path.exists():
        return False
    text = path.read_text()
    changed = False
    new_inc = INCLUDE_NEW.format(slug=slug)
    for pat in INCLUDE_OLD_PATTERNS:
        if pat.search(text) and slug not in DONE:
            text = pat.sub(new_inc, text, count=1)
            changed = True
            break
    if cfg := TEMPLATES.get(slug):
        if cfg["kind"] == "craft" and CSS_LINK in text:
            text = text.replace(CSS_LINK, "")
            changed = True
    if changed:
        path.write_text(text)
    return changed


def update_html(slug: str) -> bool:
    path = HTML_DIR / f"{slug}.html"
    if not path.exists():
        return False
    text = path.read_text()
    changed = False
    if CSS_LINK in text:
        text = text.replace(CSS_LINK, "")
        changed = True
    cfg = TEMPLATES.get(slug)
    if cfg and cfg["main_text_first"]:
        old = '<div id="aboutExtraBlocks" class="lw-about-extras-root"></div>'
        new = '<div id="aboutExtraBlocks" class="lw-about-extras-root" data-main-text-first="1"></div>'
        if old in text:
            text = text.replace(old, new)
            changed = True
    if cfg and cfg["kind"] == "craft":
        old = '<div id="aboutExtraBlocks" class="craft-about-extras"></div>'
        if old not in text and 'id="aboutExtraBlocks"' in text:
            pass
    if changed:
        path.write_text(text)
    return changed


def main() -> None:
    for slug, cfg in TEMPLATES.items():
        partial_path = PARTIALS / f"about-extra-blocks-{slug}.blade.php"
        partial_path.write_text(generate_partial(slug, cfg))
        print(f"Wrote {partial_path.name}")
        if update_blade(slug):
            print(f"  Updated blade {slug}")
        if update_html(slug):
            print(f"  Updated html {slug}")

    # consult-prime: html only
    cp = HTML_DIR / "consult-prime.html"
    if cp.exists():
        text = cp.read_text()
        if CSS_LINK in text:
            cp.write_text(text.replace(CSS_LINK, ""))
            print("Updated consult-prime.html (removed generic css)")


if __name__ == "__main__":
    main()
