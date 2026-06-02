#!/usr/bin/env python3
"""Inject shared about-extra blocks into all tenant templates (HTML + Blade)."""
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BLADE_DIR = ROOT / "resources/views/public/templates"
HTML_DIR = ROOT.parent / "front/public/templates"
PUBLIC_TPL = ROOT / "public/templates"

ASSETS_MARKER = "lw-about-extras.js"
ASSETS_SNIPPET = (
    '<link rel="stylesheet" href="/templates/lw-about-extras.css?v=2">\n'
    '<script src="/templates/lw-about-extras.js?v=2"></script>\n'
)
PARTIAL_BLADE = "    @include('public.partials.about-extra-blocks')\n"
CONTAINER_HTML = '    <div id="aboutExtraBlocks" class="lw-about-extras-root"></div>\n'
EMPTY_CONTAINER_RE = re.compile(
    r'\s*<div id="aboutExtraBlocks" class="lw-about-extras-root"></div>\s*',
    re.MULTILINE,
)

BOOT_FIELDS = """        about_title: @json($about_title),
        about_sections: @json($about_sections),
"""

ABOUT_TITLE_BLADE_REPLACEMENTS = [
    (r'id="aboutTitle">Tu negocio\.</h2>', 'id="aboutTitle">{{ filled($about_title) ? $about_title : \'Sobre nosotros.\' }}</h2>'),
    (r'id="aboutTitle">Tu negocio</h2>', 'id="aboutTitle">{{ filled($about_title) ? $about_title : \'Sobre nosotros.\' }}</h2>'),
    (
        r'id="aboutTitle" class="reveal">Gente con hambre de hacerlo rico</h2>',
        'id="aboutTitle" class="reveal">{{ filled($about_title) ? $about_title : \'Sobre nosotros.\' }}</h2>',
    ),
    (
        r'<span id="sleekAboutTitle">Tu negocio</span>',
        '<span id="sleekAboutTitle">{{ filled($about_title) ? $about_title : \'Sobre nosotros.\' }}</span>',
    ),
]

ABOUT_TITLE_JS_OLD = [
    "if (aboutTitle) aboutTitle.textContent = name + '.';",
    "if (aboutTitle) aboutTitle.textContent = name + '.'",
    "if (aboutTitle) aboutTitle.textContent = 'Gente con hambre de hacerlo rico';",
]
ABOUT_TITLE_JS_NEW = """if (aboutTitle) {
    var customAboutTitle = (raw && raw.about_title ? String(raw.about_title).trim() : '');
    if (raw && Object.prototype.hasOwnProperty.call(raw, 'about_title')) {
      aboutTitle.textContent = customAboutTitle || 'Sobre nosotros.';
    }
  }"""

SLEEK_JS_OLD = "if (aboutTitle) aboutTitle.textContent = name;"
SLEEK_JS_NEW = """if (aboutTitle) {
    var customAboutTitle = (raw && raw.about_title ? String(raw.about_title).trim() : '');
    if (raw && Object.prototype.hasOwnProperty.call(raw, 'about_title')) {
      aboutTitle.textContent = customAboutTitle || 'Sobre nosotros.';
    }
  }"""


def inject_assets(content: str) -> str:
    content = content.replace("lw-about-extras.css?v=1", "lw-about-extras.css?v=2")
    content = content.replace("lw-about-extras.js?v=1", "lw-about-extras.js?v=2")
    if ASSETS_MARKER in content:
        return content
    for anchor in (
        '<script src="/templates/lw-contact-links.js',
        '<script src="/templates/lw-landing-demo.js',
        "LW-CONTRACT-VERSION",
        "@push('body-end')",
        '<script>\n  window.__lwLat',
    ):
        if anchor in content:
            if anchor == "@push('body-end')":
                return content.replace(
                    "@push('body-end')",
                    "@push('body-end')\n" + ASSETS_SNIPPET,
                    1,
                )
            return content.replace(anchor, ASSETS_SNIPPET + anchor, 1)
    if "</body>" in content:
        return content.replace("</body>", ASSETS_SNIPPET + "</body>", 1)
    return content


def inject_partial_blade(content: str) -> str:
    if "about-extra-blocks" in content:
        return content
    if EMPTY_CONTAINER_RE.search(content):
        return EMPTY_CONTAINER_RE.sub("\n" + PARTIAL_BLADE, content, count=1)
    return inject_container_html(content.replace(CONTAINER_HTML, PARTIAL_BLADE))


def inject_container_html(content: str) -> str:
    if 'id="aboutExtraBlocks"' in content:
        return content
    about_section_re = re.compile(
        r'(<section[^>]*\bid=["\'](?:sobre-nosotros|nosotros|about)["\'][^>]*>)(.*?)(</section>)',
        re.DOTALL | re.IGNORECASE,
    )

    def repl(m: re.Match[str]) -> str:
        open_tag, body, close = m.group(1), m.group(2), m.group(3)
        if 'id="aboutExtraBlocks"' in body:
            return m.group(0)
        return open_tag + body + CONTAINER_HTML + close

    return about_section_re.sub(repl, content, count=1)


def inject_boot_fields(content: str) -> str:
    if "about_sections: @json" in content:
        return content
    pattern = re.compile(
        r"(descripcion:\s*@json\(\$descripcion\),?\s*\n)",
        re.MULTILINE,
    )
    if pattern.search(content):
        return pattern.sub(r"\1" + BOOT_FIELDS, content, count=1)
    pattern2 = re.compile(
        r"(foto_equipo:\s*@json\(\$foto_equipo\),?\s*\n)",
        re.MULTILINE,
    )
    if pattern2.search(content):
        return pattern2.sub(BOOT_FIELDS + r"\1", content, count=1)
    return content


def fix_about_title_blade(content: str) -> str:
    for old, new in ABOUT_TITLE_BLADE_REPLACEMENTS:
        content = content.replace(old, new)
    return content


def fix_about_title_js(content: str) -> str:
    for old in ABOUT_TITLE_JS_OLD:
        if old in content:
            content = content.replace(old, ABOUT_TITLE_JS_NEW)
    if SLEEK_JS_OLD in content:
        content = content.replace(SLEEK_JS_OLD, SLEEK_JS_NEW)
    return content


def patch_file(path: Path, is_blade: bool) -> bool:
    text = path.read_text(encoding="utf-8")
    original = text
    text = inject_assets(text)
    text = inject_partial_blade(text) if is_blade else inject_container_html(text)
    if is_blade:
        text = inject_boot_fields(text)
        text = fix_about_title_blade(text)
    text = fix_about_title_js(text)
    if text != original:
        path.write_text(text, encoding="utf-8")
        return True
    return False


def sync_public_assets() -> None:
    PUBLIC_TPL.mkdir(parents=True, exist_ok=True)
    for name in ("lw-about-extras.js", "lw-about-extras.css"):
        src = HTML_DIR / name
        if src.exists():
            (PUBLIC_TPL / name).write_text(src.read_text(encoding="utf-8"), encoding="utf-8")


def main() -> None:
    sync_public_assets()
    changed: list[str] = []
    skip_html = {"soft-organic.html", "handyman-pro.html"}
    for path in sorted(BLADE_DIR.glob("*.blade.php")):
        if patch_file(path, True):
            changed.append(str(path.relative_to(ROOT.parent)))
    for path in sorted(HTML_DIR.glob("*.html")):
        if path.name.startswith("lw-") or path.name in skip_html:
            continue
        if patch_file(path, False):
            changed.append(str(path.relative_to(ROOT.parent)))
    print("Patched", len(changed), "files:")
    for c in changed:
        print(" -", c)


if __name__ == "__main__":
    main()
