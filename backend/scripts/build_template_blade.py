#!/usr/bin/env python3
"""Convert front/public/templates/{slug}.html → Blade tenant templates."""
from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FRONT_TPL = ROOT.parent / "front/public/templates"
OUT_DIR = ROOT / "resources/views/public/templates"

SLUGS_ORDER = [
    "noir-elite",
    "bloom-studio",
    "coastal-calm",
    "craft-pro",
    "tavola-warm",
    "tech-sleek",
    "trust-clinic",
    "versa-studio",
    "mono-edito",
    "luxe-atelier",
]

PRO_HERO_3 = {"tavola-warm", "versa-studio", "mono-edito", "luxe-atelier"}

# Static HTML placeholders → TenantViewPayload keys (or Blade expressions).
PLACEHOLDER_MAP: dict[str, str] = {
    "nombre": "nombre",
    "tagline": "tagline",
    "telefono": "telefono",
    "whatsapp": "whatsapp",
    "descripcion": "descripcion",
    "descripcion_corta": "descripcion",
    "descripcion_larga": "descripcion",
    "direccion": "direccion",
    "direccion_corta": "direccion",
    "ciudad": "ciudad",
    "pais": "pais",
    "email": "correo",
    "correo": "correo",
    "año": "anio_fundacion",
    "ano": "anio_fundacion",
    "año_actual": "date('Y')",
    "lat": "map_lat",
    "lng": "map_lon",
    "vcard_url": "vcard_download_url",
    "url_google": "google_business_url",
    "portada": "portada",
    "portada_2": "portada_2",
    "portada_3": "portada_3",
    "foto_equipo": "foto_equipo",
    "fotos": "",  # handled specially → gallery JS
    "horario": "horario",
    "inicial": "inicial",  # set via @php in content when needed
}

TRACKING_SCRIPT = """<script>
window.__lwTrackUrl = '{{ $api_base_url }}/api/v1/public/{{ $subdomain }}/track';
function lwTrackClick(kind) {
  fetch(window.__lwTrackUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: kind })
  }).catch(function () {});
}
(function () {
  function bindTrack(el, kind) {
    if (!el || el.dataset.lwTrackBound === '1') return;
    el.dataset.lwTrackBound = '1';
    el.addEventListener('click', function () { lwTrackClick(kind); });
  }
  document.querySelectorAll('a[data-wa-link], a[href*="wa.me"]').forEach(function (el) {
    bindTrack(el, 'whatsapp_click');
  });
  document.querySelectorAll('[data-tel-link]').forEach(function (el) {
    bindTrack(el, 'phone_click');
  });
})();
</script>
"""

MAP_VARS = """<script>
  window.__lwLat = {{ is_numeric($map_lat) ? $map_lat : 'null' }};
  window.__lwLon = {{ is_numeric($map_lon) ? $map_lon : 'null' }};
</script>
"""


def placeholder_to_blade(key: str) -> str:
    m = re.fullmatch(r"servicio_(\d+)", key)
    if m:
        i = int(m.group(1)) - 1
        return f"{{{{ ($services[{i}]['name'] ?? '') }}}}"
    m = re.fullmatch(r"precio_(\d+)", key)
    if m:
        i = int(m.group(1)) - 1
        return (
            "@if(isset($services[%d]) && $services[%d]['price'] !== null)"
            "{{ number_format($services[%d]['price'], 2, ',', '.') }}"
            "@else@endif" % (i, i, i)
        )
    m = re.fullmatch(r"desc_servicio_(\d+)", key)
    if m:
        i = int(m.group(1)) - 1
        return f"{{{{ ($services[{i}]['description'] ?? '') }}}}"
    if key in PLACEHOLDER_MAP:
        mapped = PLACEHOLDER_MAP[key]
        if mapped == "":
            return "{{ '' }}"
        if mapped.startswith("date("):
            return f"{{{{ {mapped} }}}}"
        return f"{{{{ ${mapped} }}}}"

    return f"{{{{ ${key} ?? '' }}}}"


def convert_placeholders(text: str) -> str:
    return re.sub(
        r"\{\{([a-zA-Z0-9_áéíóúñ]+)\}\}",
        lambda m: placeholder_to_blade(m.group(1)),
        text,
    )


def extract_parts(html: str) -> tuple[str, str, str, str]:
    lines = html.splitlines(keepends=True)
    head_start = style_start = head_end = body_start = body_end = None
    for i, line in enumerate(lines):
        if "<head>" in line and head_start is None:
            head_start = i
        if line.strip() == "<style>" and style_start is None:
            style_start = i
        if "</head>" in line:
            head_end = i
        if "<body>" in line:
            body_start = i
        if "</body>" in line:
            body_end = i
    if None in (head_start, style_start, head_end, body_start):
        raise ValueError("Could not parse HTML structure")

    if body_end is None:
        for i, line in enumerate(lines):
            if "</html>" in line.lower():
                body_end = i
                break
        if body_end is None:
            body_end = len(lines)

    head_links = "".join(lines[head_start + 1 : style_start])
    head_links = re.sub(r"<meta charset[^>]*>\s*", "", head_links)
    head_links = re.sub(r"<title>[^<]*</title>\s*", "", head_links)
    head_links = re.sub(r'<meta name="viewport"[^>]*>\s*', "", head_links)
    inline_style = "".join(lines[style_start:head_end])

    body_block = "".join(lines[body_start + 1 : body_end])
    footer_end = body_block.rfind("</footer>")
    if footer_end == -1:
        raise ValueError("No </footer> found")
    footer_end += len("</footer>")
    body_main = body_block[:footer_end]
    scripts_part = body_block[footer_end:]
    return head_links, inline_style, body_main, scripts_part


def apply_common_body(body: str, slug: str) -> str:
    body = convert_placeholders(body)

    # wa.me should use whatsapp digits
    body = re.sub(
        r"https://wa\.me/\{\{\s*\$telefono\s*\}\}",
        "https://wa.me/{{ $whatsapp }}",
        body,
    )
    body = body.replace('href="https://wa.me/"', 'href="https://wa.me/{{ $whatsapp }}"')
    body = body.replace('href="tel:"', 'href="{{ $whatsapp ? \'tel:+\'.$whatsapp : \'tel:\' }}"')
    body = body.replace(
        "<span data-phone-display>+34 911 234 567</span>",
        "<span data-phone-display>{{ $telefono ?: '+34 911 234 567' }}</span>",
    )
    body = body.replace(
        "<span data-phone-display>Tu teléfono</span>",
        "<span data-phone-display>{{ $telefono ?: 'Tu teléfono' }}</span>",
    )
    body = body.replace('<span class="icon">@</span>', '<span class="icon">@@</span>')

    # Logo / nav brand (generic patterns)
    body = re.sub(
        r"<img id=\"navBrandLogo\"[^>]*/>",
        "@if($logo_url)\n      <img id=\"navBrandLogo\" class=\"nav-brand-img\" src=\"{{ $logo_url }}\" alt=\"{{ $nombre }}\" decoding=\"async\"/>\n      @else\n      <img id=\"navBrandLogo\" class=\"nav-brand-img\" alt=\"\" hidden style=\"display:none\"/>\n      @endif",
        body,
        count=1,
    )
    body = body.replace(">{{nombre}}<", ">{{ $nombre }}<")
    body = body.replace(">{{nombre}}", ">{{ $nombre }}")
    body = body.replace("{{nombre}}", "{{ $nombre }}")
    body = body.replace("{{tagline}}", "{{ $tagline }}")
    body = body.replace("{{descripcion}}", "{{ $descripcion }}")
    body = body.replace("{{telefono}}", "{{ $telefono }}")
    body = body.replace("{{direccion}}", "{{ $direccion }}")

    # Social
    body = body.replace(
        'id="tplSocialInstagram" target="_blank"',
        'href="{{ $instagram_url }}" id="tplSocialInstagram" target="_blank"',
    )
    body = body.replace(
        'id="tplSocialTiktok" target="_blank"',
        'href="{{ $tiktok_url }}" id="tplSocialTiktok" target="_blank"',
    )
    body = body.replace(
        'id="tplSocialFacebook" target="_blank"',
        'href="{{ $facebook_url }}" id="tplSocialFacebook" target="_blank"',
    )
    body = re.sub(r'href="#" id="tplSocial(Instagram|Tiktok|Facebook)" href=', r'id="tplSocial\1" href=', body)

    body = body.replace(
        '<a href="#" id="tplGbizLink"',
        '<a href="{{ $google_business_url ?: \'#\' }}" id="tplGbizLink"',
    )
    body = body.replace(
        '<a href="#" id="tplVcardLink"',
        '<a href="{{ $vcard_download_url ?: \'#\' }}" id="tplVcardLink"',
    )
    body = body.replace(
        '<a href="#" id="tplMapsExternalLink"',
        '<a href="{{ $google_maps_url ?: \'#\' }}" id="tplMapsExternalLink"',
    )
    body = body.replace(
        '<span id="tpl-platform-branding">',
        '<span id="tpl-platform-branding"@if($is_pro) style="display:none;"@endif>',
    )

    if slug in PRO_HERO_3:
        body = apply_pro_hero_three(body)

    return body


def apply_pro_hero_three(body: str) -> str:
    patterns = [
        (r'<img id="heroPhotoImg"[^>]*/>', "heroPhotoImg", "portada"),
        (r'<img id="heroPhotoImg2"[^>]*/>', "heroPhotoImg2", "portada_2"),
        (r'<img id="heroPhotoImg3"[^>]*/>', "heroPhotoImg3", "portada_3"),
        (r'<img id="heroTphoto2"[^>]*/>', "heroTphoto2", "portada_2"),
        (r'<img id="heroTphoto3"[^>]*/>', "heroTphoto3", "portada_3"),
    ]
    for pat, eid, var in patterns:
        repl = (
            f"@if(${var})\n      <img id=\"{eid}\" src=\"{{{{ ${var} }}}}\" alt=\"{{{{ $nombre }}}}\" decoding=\"async\"/>\n"
            f"      @else\n      <img id=\"{eid}\" src=\"\" alt=\"\" hidden style=\"display:none\"/>\n      @endif"
        )
        body = re.sub(pat, repl, body, count=1)
    return body


def apply_urban_like_transforms(body: str) -> str:
    """Transforms for JS-driven templates (urban-bold family)."""
    if 'id="heroTitle">Tu negocio' in body:
        body = body.replace('id="heroTitle">Tu negocio', 'id="heroTitle">{{ $nombre }}')
    if "id=\"heroTagline\">Tagline corto" in body:
        body = body.replace(
            "id=\"heroTagline\">Tagline corto que describe lo que hacéis.",
            "id=\"heroTagline\">{{ $tagline }}",
        )
    if 'id="navBrandName">Tu negocio' in body:
        body = body.replace('id="navBrandName">Tu negocio', 'id="navBrandName">{{ $nombre }}')

    body = re.sub(
        r'<div class="ticker" id="tplTicker"[^>]*>.*?</div>\s*\n',
        '<div class="ticker" id="tplTicker" style="display:none;">\n  <div class="ticker-track" id="tplTickerTrack"></div>\n</div>\n',
        body,
        count=1,
        flags=re.DOTALL,
    )

    schedule_blade = SCHEDULE_URBAN
    if '<div class="schedule" id="schedule"></div>' in body:
        body = body.replace('<div class="schedule" id="schedule"></div>', schedule_blade)

    gallery_blade = GALLERY_URBAN
    if '<div class="gallery" id="galleryLive"></div>' in body:
        body = body.replace('<div class="gallery" id="galleryLive"></div>', gallery_blade)
    if '<div class="gallery-grid" id="galleryLive"></div>' in body:
        body = body.replace('<div class="gallery-grid" id="galleryLive"></div>', GALLERY_GRID)

    services_blade = SERVICES_URBAN
    if 'id="tplServicesList"></div>' in body and "@foreach($services" not in body:
        body = re.sub(
            r'(<section id="servicios"[^>]*>.*?<div class="[^"]*" id="tplServicesList">)</div>',
            r"\1\n" + services_blade + "\n  </div>",
            body,
            count=1,
            flags=re.DOTALL,
        )

    return body


SCHEDULE_URBAN = """@php
  $scheduleDays = [
    ['mon', 'Lun', 'Lunes', 1],
    ['tue', 'Mar', 'Martes', 2],
    ['wed', 'Mié', 'Miércoles', 3],
    ['thu', 'Jue', 'Jueves', 4],
    ['fri', 'Vie', 'Viernes', 5],
    ['sat', 'Sáb', 'Sábado', 6],
    ['sun', 'Dom', 'Domingo', 0],
  ];
  $todayIdx = (int) now()->dayOfWeek;
@endphp
      <div class="schedule" id="schedule">
@foreach($scheduleDays as [$key, $short, $full, $idx])
@php
  $row = is_array($horario) ? ($horario[$key] ?? null) : null;
  $closed = !$row || !empty($row['closed']);
  $open = !$closed && !empty($row['open']);
  $isToday = $idx === $todayIdx;
@endphp
        <div class="schedule-row{{ $isToday ? ' today' : '' }}">
          <span class="day">{{ $short }}{{ $isToday ? ' · hoy' : '' }}</span>
          @if($open)
          <span>{{ $row['open'] }} → {{ $row['close'] }}</span>
          @else
          <span class="closed">cerrado</span>
          @endif
        </div>
@endforeach
      </div>"""

GALLERY_URBAN = """  <div class="gallery" id="galleryLive">
@forelse($galeria as $imgUrl)
@php
  $cls = '';
  if ($loop->count > 1 && $loop->first) { $cls = ' tall'; }
  elseif ($loop->count > 3 && $loop->iteration === 4) { $cls = ' wide'; }
@endphp
    <div class="gallery-item{{ $cls }}"><img src="{{ $imgUrl }}" alt=""/></div>
@empty
@endforelse
  </div>"""

GALLERY_GRID = """  <div class="gallery-grid" id="galleryLive">
@forelse($galeria as $imgUrl)
    <div class="gimg"><img src="{{ $imgUrl }}" alt=""/></div>
@empty
@endforelse
  </div>"""

SERVICES_URBAN = """
@foreach($services as $service)
    <div class="service">
      <h3>{{ $service['name'] }}</h3>
      @if($service['description'])<p>{{ $service['description'] }}</p>@endif
      <div class="service-price">
        @if($service['price'] !== null)
        {{ number_format($service['price'], 2, ",", ".") }} €
        @else
        Consultar
        @endif
      </div>
    </div>
@endforeach"""


def patch_scripts(scripts: str, slug: str) -> str:
    scripts = scripts.replace('<script src="/templates/lw-contact-links.js?v=2"></script>\n', "")
    scripts = re.sub(
        r"/\*\*\s*\n \* Mensajería SPA → template\..*?\}\)\(\);\s*\n",
        "",
        scripts,
        count=1,
        flags=re.DOTALL,
    )
    scripts = re.sub(
        r"/\*\*\s*\n \* Mensajería SPA → template\..*?initSecureMessageListener.*?\}\)\(\);\s*\n",
        "",
        scripts,
        count=1,
        flags=re.DOTALL,
    )
    scripts = re.sub(
        r"\(function initSecureMessageListener\(\) \{.*?\}\)\(\);\s*\n",
        "",
        scripts,
        count=1,
        flags=re.DOTALL,
    )
    scripts = scripts.replace("  document.title = name + ' — LocalWeb';\n\n", "")
    scripts = scripts.replace("  document.title = name + ' — ';\n\n", "")
    scripts = scripts.replace("leaflet@1.9.4", "leaflet@@1.9.4")
    scripts = convert_placeholders(scripts)

    # Inject map lat fallback in update*PreviewMap if present
    if "function updateBoldPreviewMap" in scripts or "function updatePreviewMap" in scripts:
        for fn in ("updateBoldPreviewMap", "updateNoirPreviewMap", "updateSleekPreviewMap"):
            if f"function {fn}" in scripts:
                scripts = scripts.replace(
                    f"function {fn}(lat, lon) {{",
                    f"function {fn}(lat, lon) {{\n  if (typeof lat !== 'number' || typeof lon !== 'number') {{\n    lat = window.__lwLat;\n    lon = window.__lwLon;\n  }}",
                    1,
                )

    boot = detect_boot_script(scripts, slug)
    return scripts, boot


def detect_boot_script(scripts: str, slug: str) -> str:
    ticker_call = ""
    if "updateBoldTicker" in scripts:
        ticker_call = """    if (typeof updateBoldTicker === 'function') updateBoldTicker({
      nombre: @json($nombre),
      tagline: @json($tagline),
      direccion: @json($direccion)
    });
"""
    elif "updateSleekTicker" in scripts:
        ticker_call = """    if (typeof updateSleekTicker === 'function') updateSleekTicker({
      nombre: @json($nombre),
      tagline: @json($tagline),
      direccion: @json($direccion)
    });
"""

    schedule_call = ""
    if "syncBoldScheduleFromPreview" in scripts:
        schedule_call = """    if (typeof syncBoldScheduleFromPreview === 'function') syncBoldScheduleFromPreview(@json($horario));
    if (typeof renderBoldSchedule === 'function') renderBoldSchedule();
"""
    elif "renderSchedule" in scripts and "function renderSchedule" in scripts:
        schedule_call = """    if (typeof syncNoirScheduleFromPreview === 'function') syncNoirScheduleFromPreview(@json($horario));
    else if (typeof syncBoldScheduleFromPreview === 'function') syncBoldScheduleFromPreview(@json($horario));
    if (typeof renderSchedule === 'function') renderSchedule();
"""

    map_call = """    if (typeof window.__lwLat === 'number' && typeof window.__lwLon === 'number') {
      if (typeof updateBoldPreviewMap === 'function') updateBoldPreviewMap(window.__lwLat, window.__lwLon);
      else if (typeof updateNoirPreviewMap === 'function') updateNoirPreviewMap(window.__lwLat, window.__lwLon);
      else if (typeof updateSleekPreviewMap === 'function') updateSleekPreviewMap(window.__lwLat, window.__lwLon);
      else if (typeof updateBloomPreviewMap === 'function') updateBloomPreviewMap(window.__lwLat, window.__lwLon);
    }
"""

    apply_call = ""
    if "function applyLivePreviewData" in scripts:
        apply_call = """    if (typeof applyLivePreviewData === 'function') {
      applyLivePreviewData({
        logo_url: @json($logo_url),
        nombre: @json($nombre),
        tagline: @json($tagline),
        telefono: @json($telefono),
        whatsapp: @json($whatsapp),
        portada: @json($portada),
        portada_2: @json($portada_2),
        portada_3: @json($portada_3),
        descripcion: @json($descripcion),
        foto_equipo: @json($foto_equipo),
        direccion: @json($direccion),
        correo: @json($correo),
        galeria: @json($galeria),
        horario: @json($horario),
        map_lat: @json($map_lat),
        map_lon: @json($map_lon),
        services: @json($services),
        google_maps_url: @json($google_maps_url),
        google_business_url: @json($google_business_url),
        booking_url: @json($booking_url),
        vcard_enabled: @json($vcard_enabled),
        is_pro: @json($is_pro),
        subdomain: @json($subdomain),
        api_base_url: @json($api_base_url),
        vcard_download_url: @json($vcard_download_url),
        instagram_url: @json($instagram_url),
        tiktok_url: @json($tiktok_url),
        facebook_url: @json($facebook_url)
      });
    }
"""

    boot_name = "".join(part.capitalize() for part in slug.split("-"))
    return f"""
<script>
(function boot{boot_name}TenantPage() {{
  function run() {{
{apply_call}{ticker_call}{schedule_call}{map_call}    if (typeof window.tvAnimationsRefresh === 'function') {{
      requestAnimationFrame(function () {{ window.tvAnimationsRefresh(); }});
    }}
  }}
  if (document.readyState === 'loading') {{
    document.addEventListener('DOMContentLoaded', run);
  }} else {{
    run();
  }}
}})();
</script>
"""


def convert_slug(slug: str) -> Path:
    src = FRONT_TPL / f"{slug}.html"
    if not src.exists():
        raise FileNotFoundError(src)
    html = src.read_text(encoding="utf-8")
    head_links, inline_style, body_main, scripts_part = extract_parts(html)

    inline_style = inline_style.replace("<style>\n", "@verbatim\n<style>\n", 1)
    inline_style = inline_style.replace("</style>\n", "</style>\n@endverbatim\n", 1)
    head_links = head_links.replace("leaflet@1.9.4", "leaflet@@1.9.4")

    body_main = apply_common_body(body_main, slug)
    if slug not in {"versa-studio", "mono-edito", "luxe-atelier"}:
        body_main = apply_urban_like_transforms(body_main)

    inicial_php = ""
    if "{{ $inicial }}" in body_main or "navBrandInitial" in body_main:
        inicial_php = """@php
  $inicial = $nombre !== '' ? mb_strtoupper(mb_substr($nombre, 0, 1)) : '';
@endphp
"""

    scripts_part, boot_script = patch_scripts(scripts_part, slug)

    out = f"""@extends('public.layouts.tenant')

@push('head-extras')
{head_links}{inline_style}
@endpush

@section('content')
{inicial_php}{body_main}
@endsection

@push('body-end')
{MAP_VARS}
{TRACKING_SCRIPT}

@verbatim
{scripts_part}
@endverbatim
{boot_script}
@endpush
"""
    out_path = OUT_DIR / f"{slug}.blade.php"
    out_path.write_text(out, encoding="utf-8")
    return out_path


def main(argv: list[str]) -> int:
    targets = argv[1:] if len(argv) > 1 else SLUGS_ORDER
    for slug in targets:
        path = convert_slug(slug)
        print(f"OK {slug} -> {path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
