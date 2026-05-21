#!/usr/bin/env python3
"""One-off converter: urban-bold.html → urban-bold.blade.php"""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
src = ROOT.parent / "front/public/templates/urban-bold.html"
out_path = ROOT / "resources/views/public/templates/urban-bold.blade.php"

text = src.read_text(encoding="utf-8")
lines = text.splitlines(keepends=True)

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

head_links = "".join(lines[head_start + 1 : style_start])
head_links = re.sub(r"<meta charset[^>]*>\s*", "", head_links)
head_links = re.sub(r"<title>[^<]*</title>\s*", "", head_links)
head_links = re.sub(r'<meta name="viewport"[^>]*>\s*', "", head_links)
inline_style = "".join(lines[style_start:head_end])

body_block = "".join(lines[body_start + 1 : body_end])
footer_end = body_block.find("</footer>")
if footer_end == -1:
    raise SystemExit("footer not found")
footer_end += len("</footer>")
body_main = body_block[:footer_end]
scripts_part = body_block[footer_end:]

# Nav
body_main = body_main.replace(
    '<span id="navBrandName">Tu negocio</span>',
    '<span id="navBrandName">{{ $nombre }}</span>',
)
body_main = re.sub(
    r"<img id=\"navBrandLogo\"[^>]*/>",
    "@if($logo_url)\n      <img id=\"navBrandLogo\" class=\"nav-brand-img\" src=\"{{ $logo_url }}\" alt=\"{{ $nombre }} · logo\" width=\"180\" height=\"36\" decoding=\"async\"/>\n      @else\n      <img id=\"navBrandLogo\" class=\"nav-brand-img\" alt=\"\" width=\"180\" height=\"36\" decoding=\"async\" hidden style=\"display:none\"/>\n      @endif",
    body_main,
    count=1,
)
body_main = body_main.replace(
    '<a href="#" class="brand" id="navBrandWrap">',
    '<a href="#" class="brand @if($logo_url) brand-has-img @endif" id="navBrandWrap">',
)
if body_main.count("navBrandName") and "@if($logo_url)" in body_main:
    body_main = body_main.replace(
        '<span class="brand-mark" id="navBrandMark">★</span>',
        "@if(!$logo_url)\n      <span class=\"brand-mark\" id=\"navBrandMark\">★</span>\n      @endif",
    )
    body_main = body_main.replace(
        '<span id="navBrandName">{{ $nombre }}</span>',
        "@if(!$logo_url)\n      <span id=\"navBrandName\">{{ $nombre }}</span>\n      @endif",
    )

# Hero
body_main = body_main.replace("id=\"heroMetaBrand\">Tu negocio", "id=\"heroMetaBrand\">{{ $nombre }}")
body_main = body_main.replace("id=\"heroTitle\">Tu negocio", "id=\"heroTitle\">{{ $nombre }}")
body_main = body_main.replace(
    "id=\"heroTagline\">Tagline corto que describe lo que hacéis.",
    "id=\"heroTagline\">{{ $tagline }}",
)
body_main = re.sub(
    r"<img id=\"heroPhotoImg\"[^>]*/>",
    "@if($portada)\n      <img id=\"heroPhotoImg\" src=\"{{ $portada }}\" alt=\"{{ $nombre }}\" decoding=\"async\"/>\n      @else\n      <img id=\"heroPhotoImg\" src=\"\" alt=\"\" hidden style=\"display:none\"/>\n      @endif",
    body_main,
    count=1,
)

# Ticker — keep container; JS updateBoldTicker still works on load via init script
body_main = re.sub(
    r'<div class="ticker" id="tplTicker"[^>]*>.*?</div>\s*\n',
    '<div class="ticker" id="tplTicker" style="display:none;">\n  <div class="ticker-track" id="tplTickerTrack"></div>\n</div>\n',
    body_main,
    count=1,
    flags=re.DOTALL,
)

services_blade = """@if(count($services) > 0)
<section id="servicios">
  <div class="section-head">
    <div>
      <span class="section-num">[ 01 / Servicios ]</span>
      <h2 class="display section-title">Lo que<br/>hacemos.</h2>
    </div>
    <p class="section-sub">Carta de servicios y precios. Sin sorpresas.</p>
  </div>
  <div class="services" id="tplServicesList">
@foreach($services as $service)
    <div class="service">
      <div class="service-num">→ {{ str_pad((string) $loop->iteration, 2, '0', STR_PAD_LEFT) }}</div>
      <h3>{{ $service['name'] }}</h3>
      @if($service['description'])
      <p>{{ $service['description'] }}</p>
      @else
      <p>&nbsp;</p>
      @endif
      <div class="service-price">
        @if($service['price'] !== null)
        {{ number_format($service['price'], 2, ',', '.') }} €
        @else
        Consultar
        @endif
      </div>
    </div>
@endforeach
  </div>
</section>
@else
<section id="servicios" style="display:none;">
  <div class="section-head">
    <div>
      <span class="section-num">[ 01 / Servicios ]</span>
      <h2 class="display section-title">Lo que<br/>hacemos.</h2>
    </div>
    <p class="section-sub">Carta de servicios y precios. Sin sorpresas.</p>
  </div>
  <div class="services" id="tplServicesList"></div>
</section>
@endif
"""
body_main = re.sub(
    r"<!-- ═══════════════════ SERVICES.*?<section id=\"servicios\"[^>]*>.*?</section>\s*\n",
    "<!-- ═══════════════════ SERVICES (payload.services) ═══════════════════ -->\n" + services_blade + "\n",
    body_main,
    count=1,
    flags=re.DOTALL,
)

body_main = body_main.replace(
    'id="tplNavServicios" data-nav-link="servicios" style="display:none;"',
    'id="tplNavServicios" data-nav-link="servicios"@if(count($services) === 0) style="display:none;"@endif',
)
body_main = body_main.replace(
    'id="footNavServicios" style="display:none;"',
    'id="footNavServicios"@if(count($services) === 0) style="display:none;"@endif',
)

body_main = body_main.replace("id=\"aboutTitle\">Tu negocio.", "id=\"aboutTitle\">{{ $nombre }}.")
body_main = body_main.replace(
    "id=\"aboutDescripcion\">Descripción del negocio: quiénes sois, qué hacéis y por qué importa.",
    "id=\"aboutDescripcion\">{{ $descripcion }}",
)
body_main = re.sub(
    r"<img id=\"aboutPhotoImg\"[^>]*/>",
    "@if($foto_equipo)\n      <img id=\"aboutPhotoImg\" src=\"{{ $foto_equipo }}\" alt=\"{{ $nombre }}\" decoding=\"async\"/>\n      @else\n      <img id=\"aboutPhotoImg\" src=\"\" alt=\"\" hidden style=\"display:none\"/>\n      @endif",
    body_main,
    count=1,
)

gallery_blade = """  <div class="gallery" id="galleryLive">
@forelse($galeria as $imgUrl)
@php
  $cls = '';
  if ($loop->count > 1 && $loop->first) { $cls = ' tall'; }
  elseif ($loop->count > 3 && $loop->iteration === 4) { $cls = ' wide'; }
@endphp
    <div class="gallery-item{{ $cls }}"><img src="{{ $imgUrl }}" alt=""/></div>
@empty
    <div class="gallery-item tall"><img src="https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=600&q=70" alt=""/></div>
    <div class="gallery-item"><img src="https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&w=600&q=70" alt=""/></div>
    <div class="gallery-item"><img src="https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=600&q=70" alt=""/></div>
    <div class="gallery-item wide"><img src="https://images.unsplash.com/photo-1605497788044-5a32c7078486?auto=format&fit=crop&w=900&q=70" alt=""/></div>
    <div class="gallery-item"><img src="https://images.unsplash.com/photo-1492106087820-71f1a00d2b11?auto=format&fit=crop&w=600&q=70" alt=""/></div>
    <div class="gallery-item"><img src="https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?auto=format&fit=crop&w=600&q=70" alt=""/></div>
    <div class="gallery-item"><img src="https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?auto=format&fit=crop&w=600&q=70" alt=""/></div>
@endforelse
  </div>"""
body_main = body_main.replace('<div class="gallery" id="galleryLive"></div>', gallery_blade)

schedule_blade = """@php
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
        <div class="schedule-row@if($isToday) today@endif">
          <span class="day">{{ $short }}@if($isToday) · hoy@endif</span>
          @if($open)
          <span>{{ $row['open'] }} → {{ $row['close'] }}</span>
          @else
          <span class="closed">cerrado</span>
          @endif
        </div>
@endforeach
      </div>"""
body_main = body_main.replace('<div class="schedule" id="schedule"></div>', schedule_blade)

body_main = body_main.replace('href="https://wa.me/"', 'href="https://wa.me/{{ $whatsapp }}"')
body_main = body_main.replace('href="tel:"', 'href="tel:@if($whatsapp)+{{ $whatsapp }}@endif"')
body_main = body_main.replace(
    "<span data-phone-display>Tu teléfono</span>",
    "<span data-phone-display>{{ $telefono ?: 'Tu teléfono' }}</span>",
)

body_main = body_main.replace(
    '<a href="mailto:" id="contactEmailLink" hidden>',
    '@if($correo)<a href="mailto:{{ $correo }}" id="contactEmailLink">@else<a href="mailto:" id="contactEmailLink" hidden>@endif',
)
body_main = body_main.replace(
    '<span id="contactEmailDisplay"></span>',
    '<span id="contactEmailDisplay">{{ $correo }}</span>',
)
body_main = body_main.replace(
    '<li id="footEmailRow" hidden>',
    '<li id="footEmailRow"@if(!$correo) hidden@endif>',
)
body_main = body_main.replace(
    '<a id="footEmailLink" href="#">',
    '<a id="footEmailLink" href="mailto:{{ $correo }}">',
)

body_main = body_main.replace(
    '<a href="#" id="contactAddressRow" hidden>',
    '@if($direccion)<a href="{{ $google_maps_url ?: \'#\' }}" id="contactAddressRow"@if($google_maps_url) target="_blank" rel="noopener noreferrer"@endif>@else<a href="#" id="contactAddressRow" hidden>@endif',
)
body_main = body_main.replace(
    '<span id="contactAddressText"></span>',
    '<span id="contactAddressText">{{ $direccion }}</span>',
)
body_main = body_main.replace(
    '<li id="footAddressRow" hidden>',
    '<li id="footAddressRow"@if(!$direccion) hidden@endif>',
)
body_main = body_main.replace(
    '<a href="#" id="footAddressLink">',
    '<a href="{{ $google_maps_url ?: \'#\' }}" id="footAddressLink"@if($google_maps_url) target="_blank" rel="noopener noreferrer"@endif>',
)
body_main = body_main.replace(
    '<span id="footAddressText"></span>',
    '<span id="footAddressText">{{ $direccion }}</span>',
)

body_main = body_main.replace(
    '<div class="map-section bold-map-empty" id="mapSection">',
    '<div class="map-section @if(!is_numeric($map_lat) || !is_numeric($map_lon)) bold-map-empty @endif" id="mapSection">',
)
body_main = body_main.replace(
    '<div class="map-directions-row" id="mapDirectionsRow">',
    '<div class="map-directions-row @if($google_maps_url) is-visible @endif" id="mapDirectionsRow">',
)
body_main = body_main.replace(
    '<a href="#" id="tplMapsExternalLink"',
    '<a href="{{ $google_maps_url ?: \'#\' }}" id="tplMapsExternalLink"',
)

body_main = body_main.replace(
    '<section id="opiniones" class="reviews-cta-section">',
    '<section id="opiniones" class="reviews-cta-section @if($google_business_url) is-visible @endif">',
)
body_main = body_main.replace(
    'id="tplNavOpiniones" data-nav-link="opiniones" style="display:none;"',
    'id="tplNavOpiniones" data-nav-link="opiniones"@if(!$google_business_url) style="display:none;"@endif',
)
body_main = body_main.replace(
    'id="footNavOpiniones" style="display:none;"',
    'id="footNavOpiniones"@if(!$google_business_url) style="display:none;"@endif',
)
body_main = body_main.replace(
    '<a href="#" id="tplGbizLink"',
    '<a href="{{ $google_business_url ?: \'#\' }}" id="tplGbizLink"',
)

body_main = body_main.replace(
    '<div class="vcard-strip" id="tplVcardWrap">',
    '<div class="vcard-strip @if($vcard_enabled && $vcard_download_url) is-visible @endif" id="tplVcardWrap">',
)
body_main = body_main.replace(
    '<a href="#" id="tplVcardLink"',
    '<a href="{{ $vcard_download_url ?: \'#\' }}" id="tplVcardLink"',
)

body_main = body_main.replace(
    '<a href="#" id="tplSocialInstagram" target="_blank"',
    '<a href="{{ $instagram_url }}" id="tplSocialInstagram" target="_blank"',
)
body_main = body_main.replace(
    '<a href="#" id="tplSocialTiktok" target="_blank"',
    '<a href="{{ $tiktok_url }}" id="tplSocialTiktok" target="_blank"',
)
body_main = body_main.replace(
    '<a href="#" id="tplSocialFacebook" target="_blank"',
    '<a href="{{ $facebook_url }}" id="tplSocialFacebook" target="_blank"',
)

body_main = body_main.replace(
    "id=\"footTagline\">Tagline corto que describe lo que hacéis.",
    "id=\"footTagline\">{{ $tagline }}",
)
body_main = body_main.replace(
    "id=\"footBottomBrand\">© 2026 · Tu negocio",
    "id=\"footBottomBrand\">© {{ date('Y') }} · {{ $nombre }}",
)
body_main = body_main.replace(
    '<span id="tpl-platform-branding">',
    '<span id="tpl-platform-branding"@if($is_pro) style="display:none;"@endif>',
)

foot_brand_blade = """@php
  $footParts = preg_split('/\\s+/', trim($nombre));
@endphp
      <div class="foot-brand" id="footBrand">@if(count($footParts) >= 2){{ $footParts[0] }}<br/><span class="accent">{{ implode(' ', array_slice($footParts, 1)) }}</span>@else<span class="accent">{{ $nombre }}</span>@endif</div>"""
body_main = body_main.replace(
    '<div class="foot-brand" id="footBrand">Tu<br/><span class="accent">negocio</span></div>',
    foot_brand_blade,
)

scripts = scripts_part
scripts = scripts.replace('<script src="/templates/lw-contact-links.js?v=2"></script>\n', "")
scripts = re.sub(
    r"/\*\*\s*\n \* Mensajería SPA → template\..*?\}\)\(\);\s*\n",
    "",
    scripts,
    count=1,
    flags=re.DOTALL,
)
scripts = scripts.replace("  document.title = name + ' — LocalWeb';\n\n", "")

tracking_script = """<script>
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

map_vars = """<script>
  window.__lwLat = {{ is_numeric($map_lat) ? $map_lat : 'null' }};
  window.__lwLon = {{ is_numeric($map_lon) ? $map_lon : 'null' }};
</script>
"""

boot_script = """
<script>
(function bootUrbanBoldTenantPage() {
  function run() {
    updateBoldTicker({
      nombre: @json($nombre),
      tagline: @json($tagline),
      direccion: @json($direccion)
    });
    syncBoldScheduleFromPreview(@json($horario));
    renderBoldSchedule();
    if (typeof window.__lwLat === 'number' && typeof window.__lwLon === 'number') {
      updateBoldPreviewMap(window.__lwLat, window.__lwLon);
    } else {
      updateBoldPreviewMap(NaN, NaN);
    }
    if (typeof window.tvAnimationsRefresh === 'function') {
      requestAnimationFrame(function () { window.tvAnimationsRefresh(); });
    }
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }
})();
</script>
"""

# Blade treats @media / @keyframes / bare @ as directives — wrap static CSS/JS in @verbatim.
inline_style = inline_style.replace("<style>\n", "@verbatim\n<style>\n", 1)
inline_style = inline_style.replace("</style>\n", "</style>\n@endverbatim\n", 1)
head_links = head_links.replace("leaflet@1.9.4", "leaflet@@1.9.4")
body_main = body_main.replace('<span class="icon">@</span>', '<span class="icon">@@</span>')

scripts = scripts.replace("leaflet@1.9.4", "leaflet@@1.9.4")

out = f"""@extends('public.layouts.tenant')

@push('head-extras')
{head_links}{inline_style}
@endpush

@section('content')
{body_main}
@endsection

@push('body-end')
{map_vars}
{tracking_script}
@verbatim
{scripts}
@endverbatim
{boot_script}
@endpush
"""

out_path.write_text(out, encoding="utf-8")
print(f"Written {out_path} ({len(out)} chars, {out.count(chr(10))} lines)")
