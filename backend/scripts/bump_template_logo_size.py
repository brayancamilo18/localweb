#!/usr/bin/env python3
"""Amplía el logo en barra de plantillas públicas (CSS base + escala por defecto)."""
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DIRS = [
    ROOT / "resources/views/public/templates",
    ROOT.parent / "front/public/templates",
]

CSS_REPLACEMENTS = [
    ("32px", "46px"),
    ("34px", "48px"),
    ("36px", "50px"),
    ("38px", "52px"),
    ("40px", "54px"),
    ("160px", "230px"),
    ("168px", "240px"),
    ("180px", "260px"),
    ("200px", "280px"),
    ("height:28px", "height:44px"),
    ("max-width:140px", "max-width:220px"),
]

JS_PATTERNS = [
    (
        re.compile(
            r"var lsc\w? = \(raw && typeof raw\.logo_scale === 'number' && isFinite\(raw\.logo_scale\)\) \? raw\.logo_scale : 1;"
        ),
        "var lsc = (raw && typeof raw.logo_scale === 'number' && isFinite(raw.logo_scale)) ? raw.logo_scale : (logoUrl ? 1.35 : 1);",
    ),
    (
        re.compile(
            r"var lsc = typeof raw\.logo_scale === 'number' && isFinite\(raw\.logo_scale\) \? raw\.logo_scale : 1;"
        ),
        "var lsc = typeof raw.logo_scale === 'number' && isFinite(raw.logo_scale) ? raw.logo_scale : (logoUrl ? 1.35 : 1);",
    ),
    (
        re.compile(
            r"var lscB = typeof raw\?\.logo_scale === 'number' && isFinite\(raw\.logo_scale\) \? raw\.logo_scale : 1;"
        ),
        "var lscB = typeof raw?.logo_scale === 'number' && isFinite(raw.logo_scale) ? raw.logo_scale : (logoUrl ? 1.35 : 1);",
    ),
    (
        re.compile(
            r"var lsc = typeof raw\?\.logo_scale === 'number' && isFinite\(raw\.logo_scale\) \? raw\.logo_scale : 1;"
        ),
        "var lsc = typeof raw?.logo_scale === 'number' && isFinite(raw.logo_scale) ? raw.logo_scale : (logoUrl ? 1.35 : 1);",
    ),
]


def patch_file(path: Path) -> bool:
    text = path.read_text(encoding="utf-8")
    original = text

    for old, new in CSS_REPLACEMENTS:
        text = text.replace(old, new)

    for pattern, repl in JS_PATTERNS:
        text = pattern.sub(repl, text)

    if '<nav class="nav">' in text and '@if($logo_url) style="--lw-logo-scale:' not in text:
        text = text.replace(
            '<nav class="nav">',
            '<nav class="nav"@if($logo_url) style="--lw-logo-scale: {{ $logo_scale ?? 1.35 }}"@endif>',
        )

    if "logo_url: @json($logo_url)," in text and "logo_scale: @json($logo_scale" not in text:
        text = text.replace(
            "logo_url: @json($logo_url),",
            "logo_url: @json($logo_url),\n        logo_scale: @json($logo_scale ?? null),",
        )

    if text == original:
        return False
    path.write_text(text, encoding="utf-8")
    return True


def main() -> None:
    changed = 0
    for directory in DIRS:
        if not directory.is_dir():
            continue
        for path in sorted(directory.glob("*")):
            if path.suffix not in {".php", ".html"}:
                continue
            if patch_file(path):
                print(f"patched {path.relative_to(ROOT.parent)}")
                changed += 1
    print(f"done: {changed} files")


if __name__ == "__main__":
    main()
