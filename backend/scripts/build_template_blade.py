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
    "graphite-soft",
    "wild-pet",
]

PRO_HERO_3 = {"tavola-warm", "versa-studio", "mono-edito", "luxe-atelier", "graphite-soft", "wild-pet"}

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
        if "<body" in line and body_start is None:
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
    body = body.replace(
        'id="tplContactPhoneVal" data-phone-display></span>',
        'id="tplContactPhoneVal" data-phone-display>{{ $telefono }}</span>',
    )
    body = body.replace(
        'id="tplContactPhone" data-tel-link class="is-hidden"',
        'id="tplContactPhone" data-tel-link class="{{ ($telefono || $whatsapp) ? \'\' : \'is-hidden\' }}"',
    )
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


def apply_wild_hero_title(body: str, slug: str) -> str:
    if slug != "wild-pet":
        return body
    return re.sub(
        r'<h1 id="heroTitle" class="split">.*?</h1>',
        '<h1 id="heroTitle" class="split"><span class="w w-1">{{ $nombre ?: \'Tu\' }}</span> '
        '<span class="w w-2">mascota</span><br>'
        '<span class="w w-3">lo va</span> <span class="w w-4">a</span> '
        '<span class="w w-5">pasar</span> <span class="w w-6">genial.</span></h1>',
        body,
        count=1,
        flags=re.DOTALL,
    )


def apply_graphite_hero_title(body: str, slug: str) -> str:
    if slug != "graphite-soft":
        return body
    return re.sub(
        r'<h1 class="serif h-display" id="heroTitle">.*?</h1>',
        '<h1 class="serif h-display" id="heroTitle"><span class="word"><i>{{ $nombre ?: \'Tu boutique\' }}</i></span></h1>',
        body,
        count=1,
        flags=re.DOTALL,
    )


def apply_graphite_footer(body: str, slug: str) -> str:
    if slug != "graphite-soft":
        return body
    foot_brand = (
        "@php\n"
        "  $footParts = preg_split('/\\s+/', trim($nombre));\n"
        "@endphp\n"
        '      <div class="foot-brand" id="footBrand">@if(count($footParts) >= 2){{ $footParts[0] }}'
        '<br/><span class="accent">{{ implode(\' \', array_slice($footParts, 1)) }}</span>'
        "@else<span class=\"accent\">{{ $nombre ?: 'Tu boutique' }}</span>@endif</div>"
    )
    body = re.sub(
        r'<div class="foot-brand" id="footBrand">.*?</div>',
        lambda _m: foot_brand,
        body,
        count=1,
        flags=re.DOTALL,
    )
    body = body.replace('<p id="footTagline"></p>', '<p id="footTagline">{{ $tagline }}</p>')
    body = body.replace(
        '<span id="footBottomBrand">© 2026 · Tu boutique</span>',
        "<span id=\"footBottomBrand\">© {{ date('Y') }} · {{ $nombre }}</span>",
    )
    body = body.replace(
        '<a href="#servicios" id="footNavServicios" style="display:none"',
        '<a href="#servicios" id="footNavServicios"@if(count($services) === 0) style="display:none;"@endif',
    )
    body = body.replace(
        '<a href="#galeria" id="footNavGaleria" style="display:none"',
        '<a href="#galeria" id="footNavGaleria"@if(count($galeria ?? []) === 0) style="display:none;"@endif',
    )
    body = body.replace(
        '<a href="#opiniones" id="footNavOpiniones" style="display:none"',
        '<a href="#opiniones" id="footNavOpiniones"@if(!$google_business_url) style="display:none;"@endif',
    )
    body = body.replace(
        '<li id="footEmailRow" hidden>',
        '<li id="footEmailRow"@if(!$correo) hidden @endif>',
    )
    body = body.replace(
        '<a id="footEmailLink" href="mailto:">',
        '<a id="footEmailLink" href="mailto:{{ $correo }}">',
    )
    body = body.replace(
        '<span id="footEmailDisplay"></span>',
        '<span id="footEmailDisplay">{{ $correo }}</span>',
    )
    body = body.replace(
        '<li id="footAddressRow" hidden>',
        '<li id="footAddressRow"@if(!$direccion) hidden @endif>',
    )
    body = body.replace(
        '<a href="#" id="footAddressLink"',
        '<a href="{{ $google_maps_url ?: \'#\' }}" id="footAddressLink"@if($google_maps_url) target="_blank" rel="noopener noreferrer"@endif',
    )
    body = body.replace(
        '<span id="footAddressText"></span>',
        '<span id="footAddressText">{{ $direccion }}</span>',
    )
    return body


def apply_urban_like_transforms(body: str, slug: str = "") -> str:
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

    services_blade = SERVICES_GRAPHITE if slug == "graphite-soft" else SERVICES_URBAN
    if slug == "wild-pet":
        services_blade = SERVICES_WILD
    if 'id="tplServicesList"></div>' in body and "@foreach($services" not in body:
        body = re.sub(
            r'(<section id="servicios"[^>]*>.*?<div class="[^"]*" id="tplServicesList">)</div>',
            r"\1\n" + services_blade + "\n  </div>",
            body,
            count=1,
            flags=re.DOTALL,
        )

    if slug == "wild-pet":
        body = apply_wild_blade_transforms(body)

    return body


def apply_wild_footer(body: str) -> str:
    body = body.replace('<span id="footBrand">Tu negocio</span>', '<span id="footBrand">{{ $nombre }}</span>')
    body = re.sub(
        r'<p id="footTagline"[^>]*>.*?</p>',
        '<p id="footTagline" style="margin-top: 1rem; color: rgba(255,248,236,.75); max-width: 36ch;">{{ $tagline ?: $descripcion }}</p>',
        body,
        count=1,
        flags=re.DOTALL,
    )
    body = re.sub(
        r'<span id="footBottomBrand">© <span id="year"></span> · Todos los derechos reservados</span>',
        '<span id="footBottomBrand">© <span id="year"></span> · {{ $nombre }} · Todos los derechos reservados</span>',
        body,
        count=1,
    )
    foot_contact_old = """      <div>
        <h4>Contacto</h4>
        <ul>
          <li id="footPhoneRow" hidden><a href="tel:" data-tel-link><span data-phone-display></span></a></li>
          <li id="footEmailRow" hidden><a id="footEmailLink" href="#"><span id="footEmailDisplay"></span></a></li>
          <li id="footAddressRow" hidden><a href="#" id="footAddressLink"><span id="footAddressText"></span></a></li>
        </ul>
      </div>"""
    foot_contact_blade = """      <div>
        <h4>Contacto</h4>
        <ul>
          <li id="footPhoneRow" @if(empty($telefono) && empty($whatsapp)) hidden @endif><a href="{{ $whatsapp ? 'tel:+'.$whatsapp : 'tel:' }}" data-tel-link><span data-phone-display>{{ $telefono }}</span></a></li>
          <li id="footEmailRow" @if(empty($correo)) hidden @endif><a id="footEmailLink" href="{{ $correo ? 'mailto:'.$correo : '#' }}"><span id="footEmailDisplay">{{ $correo }}</span></a></li>
          <li id="footAddressRow" @if(empty($direccion) && empty($ciudad)) hidden @endif><a href="#" id="footAddressLink"><span id="footAddressText">@if($direccion && $ciudad){{ $direccion }} · {{ $ciudad }}@elseif($direccion){{ $direccion }}@else{{ $ciudad }}@endif</span></a></li>
        </ul>
      </div>"""
    if foot_contact_old in body:
        body = body.replace(foot_contact_old, foot_contact_blade)

    foot_social_old = """      <div>
        <h4>Síguenos</h4>
        <ul>
          <li id="footSocialInstagramRow" hidden><a href="#" id="tplSocialInstagram" target="_blank" rel="noopener noreferrer">Instagram</a></li>
          <li id="footSocialTiktokRow" hidden><a href="#" id="tplSocialTiktok" target="_blank" rel="noopener noreferrer">TikTok</a></li>
          <li id="footGbizRow" hidden><a href="#" id="footGbizLink" target="_blank" rel="noopener noreferrer">Google Business</a></li>
        </ul>
      </div>"""
    foot_social_blade = """      <div>
        <h4>Síguenos</h4>
        <ul>
          <li id="footSocialInstagramRow" @if(empty($instagram_url)) hidden @endif><a href="#" id="tplSocialInstagram" target="_blank" rel="noopener noreferrer">Instagram</a></li>
          <li id="footSocialTiktokRow" @if(empty($tiktok_url)) hidden @endif><a href="#" id="tplSocialTiktok" target="_blank" rel="noopener noreferrer">TikTok</a></li>
          <li id="footGbizRow" @if(empty($google_business_url)) hidden @endif><a href="{{ $google_business_url ?: '#' }}" id="footGbizLink" target="_blank" rel="noopener noreferrer">Google Business</a></li>
        </ul>
      </div>"""
    if foot_social_old in body:
        body = body.replace(foot_social_old, foot_social_blade)

    return body


def apply_wild_blade_transforms(body: str) -> str:
    if 'id="heroTagline">Tagline corto y divertido' in body:
        body = body.replace(
            "id=\"heroTagline\">Tagline corto y divertido que explique a quién cuidas y qué hace especial a tu negocio. Con energía y personalidad.",
            "id=\"heroTagline\">{{ $tagline }}",
        )
    if "id=\"aboutDescripcion\">Descripción cercana" in body:
        body = body.replace(
            "id=\"aboutDescripcion\">Descripción cercana del equipo: por qué empezasteis, qué os mueve, cómo trabajáis. Con personalidad y buen rollo.",
            "id=\"aboutDescripcion\">{{ $descripcion }}",
        )

    body = re.sub(
        r'<div class="gallery" data-stagger id="galleryLive"></div>',
        GALLERY_WILD,
        body,
        count=1,
    )

    body = re.sub(
        r'<div class="schedule sr" id="schedule"[^>]*></div>',
        SCHEDULE_WILD,
        body,
        count=1,
    )

    for var, slot, img in (
        ("portada", "hp1", "hp1Img"),
        ("portada_2", "hp2", "hp2Img"),
        ("portada_3", "hp3", "hp3Img"),
    ):
        pat = (
            rf'(<div class="hero-photo hp-{slot[-1]} sr" id="{slot}"[^>]*>)\s*'
            rf'<div class="photo-fallback" id="{img}"[^>]*>.*?</div>\s*</div>'
        )
        blade_var = "{{ $" + var + " }}"
        repl = (
            rf'\1<div class="photo-fallback" id="{img}" role="img" '
            + f"@if(${var}) style=\"background-image:url('{blade_var}')\" class=\"has-photo\" @endif></div></div>"
        )
        body = re.sub(pat, repl, body, count=1, flags=re.DOTALL)

    body = re.sub(
        r'<div class="about-photo sr" id="aboutPhotoWrap"([^>]*)>\s*'
        r'<div class="photo-fallback" id="aboutPhotoImg"[^>]*>.*?</div>\s*</div>',
        r'<div class="about-photo sr @if($foto_equipo) has-photo @endif" id="aboutPhotoWrap"\1>\n'
        r'        <div class="photo-fallback" id="aboutPhotoImg" role="img" aria-label="Foto del equipo"'
        + ' @if($foto_equipo) style="background-image:url(\'{{ $foto_equipo }}\')" class="has-photo" @endif>\n'
        r'          <svg viewBox="0 0 24 24" fill="currentColor"><circle cx="9" cy="9" r="3"/><circle cx="17" cy="11" r="2.4"/>'
        r'<path d="M3 20c0-3 3-5 6-5s6 2 6 5"/><path d="M14 20c0-2 2-4 4-4s3 1.5 3 3.5"/></svg>\n'
        r'        </div>\n      </div>',
        body,
        count=1,
        flags=re.DOTALL,
    )

    about_stats_html = """        <div class="about-stats num" data-stagger>
          <a class="about-stat" href="#" id="aboutStatWhatsapp" hidden>
            <div class="n num" id="aboutStatPhoneVal"></div>
            <div class="l">WhatsApp</div>
          </a>
          <a class="about-stat" href="#" id="aboutStatEmail" hidden>
            <div class="n" id="aboutStatEmailVal"></div>
            <div class="l">Correo</div>
          </a>
        </div>"""
    if about_stats_html in body:
        body = body.replace(about_stats_html, ABOUT_STATS_WILD)

    if '<div class="services-grid" data-stagger id="tplServicesList"></div>' in body:
        body = body.replace(
            '<div class="services-grid" data-stagger id="tplServicesList"></div>',
            '<div class="services-grid" data-stagger id="tplServicesList">\n' + SERVICES_WILD + "\n    </div>",
        )

    body = body.replace(
        'id="tplContactPhone" data-tel-link style="display:none"',
        'id="tplContactPhone" data-tel-link @if(empty($telefono) && empty($whatsapp)) style="display:none" @endif',
    )
    body = body.replace(
        'id="tplContactEmail" style="display:none"',
        'id="tplContactEmail" @if(empty($correo)) style="display:none" @endif',
    )
    body = body.replace(
        'id="tplContactAddress" style="display:none"',
        'id="tplContactAddress" @if(empty($direccion)) style="display:none" @endif',
    )
    body = body.replace(
        '<div class="value num" id="tplContactPhoneVal" data-phone-display></div>',
        '<div class="value num" id="tplContactPhoneVal" data-phone-display>{{ $telefono }}</div>',
    )
    body = body.replace(
        '<div class="value" id="tplContactEmailVal"></div>',
        '<div class="value" id="tplContactEmailVal">{{ $correo }}</div>',
    )
    body = body.replace(
        '<div class="value" id="tplContactAddressVal"></div>',
        '<div class="value" id="tplContactAddressVal">{{ $direccion }}</div>',
    )

    map_dirs_simple = """    <div class="map-directions" id="mapDirectionsRow">
      <a href="#" id="tplMapsExternalLink" class="btn btn-amar" target="_blank" rel="noopener noreferrer">Abrir en Google Maps →</a>
    </div>"""
    map_dirs_legacy = """    <div class="map-directions sr" id="mapDirectionsRow" hidden>
      <a href="{{ $google_maps_url ?: '#' }}" id="tplMapsExternalLink" class="btn btn-amar" target="_blank" rel="noopener noreferrer">Abrir en Google Maps →</a>
    </div>"""
    map_dirs_blade_simple = """    <div class="map-directions" id="mapDirectionsRow">
      <a href="{{ $google_maps_url ?: '#' }}" id="tplMapsExternalLink" class="btn btn-amar" target="_blank" rel="noopener noreferrer">Abrir en Google Maps →</a>
    </div>"""
    for old in (map_dirs_simple, map_dirs_legacy, map_dirs_blade_simple):
        if old in body:
            body = body.replace(old, MAP_DIRECTIONS_WILD.rstrip("\n"))
            break

    body = body.replace(
        'id="map" class="sr" style="--sr-rot:-1.5deg;" role="application" aria-label="Mapa de ubicación"',
        'id="map" role="application" aria-label="Mapa de ubicación"',
    )

    body = re.sub(
        r'<div class="final-cta-photo" id="finalCtaPhotoWrap">\s*'
        r'<div class="photo-fallback" id="finalCtaPhotoImg"[^>]*>.*?</div>\s*</div>',
        '<div class="final-cta-photo @if($foto_equipo) has-photo @endif" id="finalCtaPhotoWrap">\n'
        '        <div class="photo-fallback" id="finalCtaPhotoImg" role="img" aria-label="Foto del equipo"'
        + ' @if($foto_equipo) style="background-image:url(\'{{ $foto_equipo }}\')" class="has-photo" @endif>\n'
        '          <svg viewBox="0 0 24 24" fill="currentColor"><circle cx="9" cy="9" r="3"/><circle cx="17" cy="11" r="2.4"/>'
        '<path d="M3 20c0-3 3-5 6-5s6 2 6 5"/><path d="M14 20c0-2 2-4 4-4s3 1.5 3 3.5"/></svg>\n'
        '        </div>\n'
        '      </div>',
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

MAP_DIRECTIONS_WILD = """    <div class="map-directions" id="mapDirectionsRow">
      @php
        $wildMapsUrl = $google_maps_url ?? null;
        if (empty($wildMapsUrl) && is_numeric($map_lat) && is_numeric($map_lon)) {
          $wildMapsUrl = 'https://www.google.com/maps/dir/?api=1&destination=' . $map_lat . ',' . $map_lon;
        } elseif (empty($wildMapsUrl) && !empty($direccion)) {
          $wildMapsUrl = 'https://www.google.com/maps/search/?api=1&query=' . rawurlencode($direccion);
        } else {
          $wildMapsUrl = 'https://www.google.com/maps/dir/?api=1&destination=40.4168,-3.7038';
        }
      @endphp
      <a href="{{ $wildMapsUrl }}" id="tplMapsExternalLink" class="btn btn-amar" target="_blank" rel="noopener noreferrer">Abrir en Google Maps →</a>
    </div>
"""

ABOUT_STATS_WILD = """        <div class="about-stats num" data-stagger>
          <a class="about-stat" href="#" id="aboutStatWhatsapp" @if(empty($whatsapp) && empty($telefono)) hidden @endif>
            <div class="n num" id="aboutStatPhoneVal">{{ $whatsapp ?: $telefono }}</div>
            <div class="l">WhatsApp</div>
          </a>
          <a class="about-stat" href="@if($correo)mailto:{{ $correo }}@else#@endif" id="aboutStatEmail" @if(empty($correo)) hidden @endif>
            <div class="n" id="aboutStatEmailVal">{{ $correo }}</div>
            <div class="l">Correo</div>
          </a>
        </div>"""

SERVICES_WILD = """
@foreach($services as $service)
    <article class="service">
      <div class="service-icon" aria-hidden="true">🐾</div>
      <h3>{{ $service['name'] }}</h3>
      @if(!empty($service['description']))<p>{{ $service['description'] }}</p>@endif
      <div class="price">
        <small>Desde</small>
        <strong class="num">
        @if($service['price'] !== null)
        {{ number_format($service['price'], 2, ',', '.') }} €
        @else
        Consultar
        @endif
        </strong>
      </div>
    </article>
@endforeach"""

SCHEDULE_WILD = """<div class="schedule sr" id="schedule" style="--sr-rot:-1deg;" aria-label="Horario semanal">
@php
  $scheduleDays = [
    ['mon', 'Lunes'],
    ['tue', 'Martes'],
    ['wed', 'Miércoles'],
    ['thu', 'Jueves'],
    ['fri', 'Viernes'],
    ['sat', 'Sábado'],
    ['sun', 'Domingo'],
  ];
  $todayIdx = ((int) now()->dayOfWeek + 6) % 7;
@endphp
@foreach($scheduleDays as $i => [$key, $full])
@php
  $row = is_array($horario) ? ($horario[$key] ?? null) : null;
  $closed = !$row || !empty($row['closed']);
  $open = !$closed && !empty($row['open']);
@endphp
        <div class="schedule-row{{ $i === $todayIdx ? ' is-today' : '' }}{{ $closed ? ' is-closed' : '' }}">
          <span class="day">{{ $full }}</span>
          <span class="hours num">@if($open){{ $row['open'] }} – {{ $row['close'] }}@else Cerrado @endif</span>
        </div>
@endforeach
      </div>"""

GALLERY_WILD = """    <div class="gallery" data-stagger id="galleryLive">
@php
  $wildDemoGallery = [
    'https://images.unsplash.com/photo-1450778869180-41d0601e046e?auto=format&fit=crop&w=900&q=75',
    'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=900&q=75',
    'https://images.unsplash.com/photo-1561037404-61cd46aa615b?auto=format&fit=crop&w=900&q=75',
    'https://images.unsplash.com/photo-1573865526739-10659fec78a5?auto=format&fit=crop&w=700&q=75',
    'https://images.unsplash.com/photo-1546527868-ccb7ee7dfa6a?auto=format&fit=crop&w=700&q=75',
    'https://images.unsplash.com/photo-1518791841217-8f162f1e1131?auto=format&fit=crop&w=700&q=75',
    'https://images.unsplash.com/photo-1526336024174-e58f5cdd8e13?auto=format&fit=crop&w=700&q=75',
  ];
@endphp
@forelse(($galeria ?? []) as $imgUrl)
    <div class="g-item has-photo"><img class="g-photo" src="{{ $imgUrl }}" alt="" loading="lazy" decoding="async"></div>
@empty
@foreach($wildDemoGallery as $imgUrl)
    <div class="g-item has-photo"><img class="g-photo" src="{{ $imgUrl }}" alt="" loading="lazy" decoding="async"></div>
@endforeach
@endforelse
    </div>"""

SERVICES_GRAPHITE = """
@foreach($services as $service)
    <div class="svc-row in">
      <span class="n">{{ sprintf('%02d', $loop->iteration) }}</span>
      <span class="t serif">{{ $service['name'] }}</span>
      <span class="d">{{ $service['description'] ?? '' }}</span>
      <span class="p">
        @if($service['price'] !== null)
        {{ number_format($service['price'], 2, ',', '.') }} €
        @else
        Consultar
        @endif
      </span>
    </div>
@endforeach"""


def patch_scripts(scripts: str, slug: str) -> str:
    contact_path = FRONT_TPL / "lw-contact-links.js"
    contact_tag = re.compile(r'<script src="/templates/lw-contact-links\.js\?v=\d+"></script>\s*\n')
    contact_match = contact_tag.search(scripts)
    if contact_match and contact_path.exists():
        contact_inline = "<script>\n" + contact_path.read_text(encoding="utf-8") + "\n</script>\n"
        scripts = scripts[: contact_match.start()] + contact_inline + scripts[contact_match.end() :]
    else:
        scripts = scripts.replace('<script src="/templates/lw-contact-links.js?v=2"></script>\n', "")
        scripts = scripts.replace('<script src="/templates/lw-contact-links.js?v=3"></script>\n', "")
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
    # Scripts van dentro de @verbatim: no escapar @ (leaflet@@ rompe la URL en el navegador).
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


WILD_APPLY_BOOT = """    if (typeof applyLivePreviewData === 'function') {
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
        ciudad: @json($ciudad),
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

WILD_SCHEDULE_BOOT = """    if (typeof syncWildScheduleFromPreview === 'function') syncWildScheduleFromPreview(@json($horario));
    if (typeof renderWildSchedule === 'function') renderWildSchedule();
"""

WILD_MAP_BOOT = """    if (typeof updateWildPreviewMap === 'function') {
      updateWildPreviewMap(@json(is_numeric($map_lat) ? $map_lat : null), @json(is_numeric($map_lon) ? $map_lon : null), @json($nombre));
    }
"""


def detect_boot_script(scripts: str, slug: str) -> str:
    if slug == "wild-pet":
        return f"""
<script>
(function bootWildPetTenantPage() {{
  function run() {{
{WILD_APPLY_BOOT}{WILD_SCHEDULE_BOOT}{WILD_MAP_BOOT}    if (typeof window.tvAnimationsRefresh === 'function') {{
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
      else if (typeof updateGraphitePreviewMap === 'function') updateGraphitePreviewMap(window.__lwLat, window.__lwLon);
      else if (typeof updateWildPreviewMap === 'function') updateWildPreviewMap(window.__lwLat, window.__lwLon, @json($nombre));
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
    head_links = head_links.replace(
        "https://unpkg.com/leaflet@1.9.4/",
        "https://unpkg.com/leaflet@' + '1.9.4/",
    )

    if slug == "wild-pet":
        body_main = apply_wild_footer(body_main)
    body_main = apply_common_body(body_main, slug)
    if slug == "wild-pet":
        body_main = body_main.replace(
            'href="#" href="{{ $instagram_url }}"',
            'href="{{ $instagram_url ?: \'#\' }}"',
        )
        body_main = body_main.replace(
            'href="#" href="{{ $tiktok_url }}"',
            'href="{{ $tiktok_url ?: \'#\' }}"',
        )
    body_main = apply_graphite_hero_title(body_main, slug)
    body_main = apply_wild_hero_title(body_main, slug)
    body_main = apply_graphite_footer(body_main, slug)
    if slug not in {"versa-studio", "mono-edito", "luxe-atelier"}:
        body_main = apply_urban_like_transforms(body_main, slug)

    inicial_php = ""
    if "{{ $inicial }}" in body_main or "navBrandInitial" in body_main:
        inicial_php = """@php
  $inicial = $nombre !== '' ? mb_strtoupper(mb_substr($nombre, 0, 1)) : '';
@endphp
"""

    scripts_part, boot_script = patch_scripts(scripts_part, slug)

    if slug == "wild-pet":
        onez_path = FRONT_TPL / "wild-pet-onez.js"
        if onez_path.exists():
            onez_inline = onez_path.read_text(encoding="utf-8")
            onez_tag = re.search(
                r'<script src="/templates/wild-pet-onez\.js\?v=\d+"></script>\s*\n',
                scripts_part,
            )
            if onez_tag:
                scripts_part = (
                    scripts_part[: onez_tag.start()]
                    + "<script>\n"
                    + onez_inline
                    + "\n</script>\n"
                    + scripts_part[onez_tag.end() :]
                )

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
