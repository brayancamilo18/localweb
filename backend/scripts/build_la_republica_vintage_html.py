#!/usr/bin/env python3
"""Build front/public/templates/la-republica-vintage.html from source mock."""
from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "la-republica-vintage.html"
OUT = ROOT / "front/public/templates/la-republica-vintage.html"

INTEGRATION_CSS = """
<style id="lw-template-hooks">
  section[id],a[id]{scroll-margin-top:100px}
  html.embed-preview-root,body.embed-preview{overflow:auto!important;height:auto!important;min-height:100%}
  body.embed-preview .nav{position:fixed}
  #servicios.is-hidden,#opiniones.is-hidden,#tplVcardWrap.is-hidden{display:none!important}
  #tpl-platform-branding a{color:var(--gold)}
  .nav{--lw-logo-scale:1}
  .brand.brand-has-img .bmark{display:none!important}
  .brand.brand-has-img #navBrandName{display:none!important}
  .brand.brand-has-img .nav-brand-img{display:block;height:calc(34px * var(--lw-logo-scale,1));width:auto;max-width:calc(200px * var(--lw-logo-scale,1));object-fit:contain}
</style>
<style id="lw-photo-overrides">
  .vphoto.has-photo .ph{display:none!important}
  .vphoto.has-photo img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;filter:sepia(.18) saturate(.92)}
  .g-item.has-photo .ph{display:none!important}
  .g-item.has-photo img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;filter:sepia(.22) saturate(.9) contrast(.98)}
</style>
"""

INTEGRATION_JS = r"""
<script src="/templates/lw-contact-links.js?v=3"></script>
<script>
/* ONEZ / LocalWeb — la-republica-vintage */
var REPUBLICA_SCHEDULE_DEFAULT = [
  { day: 'Lunes',     open: '09:00', close: '23:00' },
  { day: 'Martes',    open: '09:00', close: '23:00' },
  { day: 'Miércoles', open: '09:00', close: '23:00' },
  { day: 'Jueves',    open: '09:00', close: '23:00' },
  { day: 'Viernes',   open: '09:00', close: '00:30' },
  { day: 'Sábado',    open: '10:00', close: '00:30' },
  { day: 'Domingo',   open: '10:00', close: '17:00' }
];
var SCHEDULE = REPUBLICA_SCHEDULE_DEFAULT.map(function (r) {
  return { day: r.day, open: r.open, close: r.close };
});

var REPUBLICA_PREVIEW_SAMPLE = {
  portada: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=900&q=80',
  portada_2: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=900&q=80',
  portada_3: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=900&q=80',
  foto_equipo: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=900&q=80',
};

var REPUBLICA_DEFAULT_GALLERY =
  '<figure class="g-item"><div class="ph" role="img"><span class="ph-orn">✦</span><span class="ph-label">FOTO · 01</span></div></figure>' +
  '<figure class="g-item"><div class="ph" role="img"><span class="ph-label">FOTO · 02</span></div></figure>' +
  '<figure class="g-item"><div class="ph" role="img"><span class="ph-label">FOTO · 03</span></div></figure>' +
  '<figure class="g-item"><div class="ph" role="img"><span class="ph-label">FOTO · 04</span></div></figure>' +
  '<figure class="g-item"><div class="ph" role="img"><span class="ph-label">FOTO · 05</span></div></figure>' +
  '<figure class="g-item"><div class="ph" role="img"><span class="ph-orn">★</span><span class="ph-label">FOTO · 06</span></div></figure>';

var republicaPreviewMap = null;
var republicaPreviewMarker = null;

function shouldUseRepublicaSampleMedia() {
  return document.body.classList.contains('embed-preview') || document.body.classList.contains('republica-preview');
}

function republicaResolvePreviewPhotoSrc(userSrc, sampleKey) {
  var src = userSrc ? String(userSrc).trim() : '';
  if (src) return src;
  if (!shouldUseRepublicaSampleMedia()) return '';
  return REPUBLICA_PREVIEW_SAMPLE[sampleKey] || '';
}

function escapeRepHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escapeRepAttr(s) {
  return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

function formatRepPrice(p) {
  if (p === null || p === undefined || p === '') return 'Consultar';
  var n = typeof p === 'number' ? p : parseFloat(String(p).replace(',', '.'));
  if (!Number.isFinite(n)) return 'Consultar';
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
}

function republicaSetVphoto(vphoto, src) {
  if (!vphoto) return;
  var s = src ? String(src).trim() : '';
  var ph = vphoto.querySelector('.ph');
  var img = vphoto.querySelector('img.rep-photo');
  if (s) {
    if (!img) {
      img = document.createElement('img');
      img.className = 'rep-photo';
      img.alt = '';
      img.decoding = 'async';
      img.loading = 'lazy';
      vphoto.appendChild(img);
    }
    img.src = s;
    vphoto.classList.add('has-photo');
    if (ph) ph.classList.add('has-photo');
  } else {
    if (img) img.remove();
    vphoto.classList.remove('has-photo');
    if (ph) ph.classList.remove('has-photo');
  }
}

function updateRepublicaHeroPhotos(raw) {
  raw = raw || {};
  var hasAny =
    Object.prototype.hasOwnProperty.call(raw, 'portada') ||
    Object.prototype.hasOwnProperty.call(raw, 'portada_2') ||
    Object.prototype.hasOwnProperty.call(raw, 'portada_3');
  if (!hasAny && !shouldUseRepublicaSampleMedia()) return;
  republicaSetVphoto(document.getElementById('heroPhoto1'), republicaResolvePreviewPhotoSrc(raw.portada, 'portada'));
  republicaSetVphoto(document.getElementById('heroPhoto2'), republicaResolvePreviewPhotoSrc(raw.portada_2, 'portada_2'));
  republicaSetVphoto(document.getElementById('heroPhoto3'), republicaResolvePreviewPhotoSrc(raw.portada_3, 'portada_3'));
}

function updateRepublicaAboutPhoto(raw) {
  var wrap = document.getElementById('aboutPhotoWrap');
  if (!wrap) return;
  var hasFoto = raw && Object.prototype.hasOwnProperty.call(raw, 'foto_equipo');
  if (!hasFoto && !shouldUseRepublicaSampleMedia()) return;
  republicaSetVphoto(wrap, republicaResolvePreviewPhotoSrc(raw && raw.foto_equipo, 'foto_equipo'));
}

function renderRepublicaGallery(urls) {
  var root = document.getElementById('galleryLive');
  if (!root) return;
  var list = Array.isArray(urls) ? urls.filter(Boolean) : [];
  if (list.length === 0) {
    root.innerHTML = REPUBLICA_DEFAULT_GALLERY;
    return;
  }
  root.innerHTML = list
    .map(function (src) {
      var esc = escapeRepAttr(src);
      return (
        '<figure class="g-item has-photo"><img class="rep-photo" src="' + esc + '" alt="" loading="lazy" decoding="async"></figure>'
      );
    })
    .join('');
}

function renderRepublicaServices(services) {
  var mg = document.getElementById('menuGrid');
  var sec = document.getElementById('servicios');
  if (!mg || !sec) return;
  var list = Array.isArray(services)
    ? services.filter(function (s) { return s && String(s.name || '').trim(); })
    : [];
  if (list.length === 0) {
    sec.classList.add('is-hidden');
    sec.style.display = 'none';
    mg.innerHTML = '';
    document.querySelectorAll('a[href="#servicios"]').forEach(function (a) {
      a.style.display = 'none';
    });
    return;
  }
  sec.classList.remove('is-hidden');
  sec.style.display = '';
  document.querySelectorAll('a[href="#servicios"]').forEach(function (a) {
    a.style.display = '';
  });
  mg.innerHTML = list
    .map(function (m) {
      var tag = m.tag || (m.highlight ? 'Especialidad de la casa' : '');
      return (
        '<article class="menu-row">' +
        '<div class="menu-line"><span class="menu-name">' + escapeRepHtml(String(m.name || '')) + '</span>' +
        '<span class="menu-dots" aria-hidden="true"></span>' +
        '<span class="menu-price num">' + escapeRepHtml(formatRepPrice(m.price)) + '</span></div>' +
        (m.description ? '<p class="menu-desc">' + escapeRepHtml(String(m.description)) + '</p>' : '') +
        (tag ? '<span class="menu-tag">★ ' + escapeRepHtml(String(tag)) + '</span>' : '') +
        '</article>'
      );
    })
    .join('');
}

function syncRepublicaScheduleFromPreview(h) {
  if (h == null || typeof h !== 'object') {
    SCHEDULE = REPUBLICA_SCHEDULE_DEFAULT.map(function (r) {
      return { day: r.day, open: r.open, close: r.close };
    });
    return;
  }
  var map = [
    ['mon', 'Lunes'],
    ['tue', 'Martes'],
    ['wed', 'Miércoles'],
    ['thu', 'Jueves'],
    ['fri', 'Viernes'],
    ['sat', 'Sábado'],
    ['sun', 'Domingo'],
  ];
  SCHEDULE = map.map(function (t) {
    var row = h[t[0]];
    if (!row || row.closed) return { day: t[1], open: null, close: null };
    return { day: t[1], open: row.open || '10:00', close: row.close || '20:00' };
  });
}

function dayIndex(js) {
  return (js + 6) % 7;
}

function renderRepublicaSchedule() {
  var schedEl = document.getElementById('schedule');
  if (!schedEl) return;
  var today = dayIndex(new Date().getDay());
  schedEl.innerHTML = SCHEDULE.map(function (row, i) {
    var closed = !row.open;
    var hours = closed ? 'Cerrado' : row.open + ' – ' + row.close;
    return (
      '<div class="sched-row ' +
      (i === today ? 'is-today ' : '') +
      (closed ? 'is-closed' : '') +
      '"><span class="day">' +
      escapeRepHtml(row.day) +
      '</span><span class="hours num">' +
      escapeRepHtml(hours) +
      '</span></div>'
    );
  }).join('');
}

function toMin(h) {
  var p = h.split(':');
  return +p[0] * 60 + +p[1];
}

function republicaStatus(now) {
  var idx = dayIndex(now.getDay());
  var row = SCHEDULE[idx];
  var cur = now.getHours() * 60 + now.getMinutes();
  if (!row || !row.open) return { open: false, text: 'Cerrado hoy', sub: 'Vuelve mañana o escríbenos.' };
  var o = toMin(row.open);
  var c = toMin(row.close);
  if (c <= o) c += 1440;
  if (cur >= o && cur < c) {
    return { open: true, text: 'Abierto · cierra a las ' + row.close, sub: 'Pásate a vernos o reserva tu mesa.' };
  }
  if (cur < o) return { open: false, text: 'Abrimos a las ' + row.open, sub: 'Te atendemos en cuanto abramos.' };
  return { open: false, text: 'Cerrado por hoy', sub: 'Escríbenos, te atendemos mañana.' };
}

function applyRepublicaStatus() {
  var s = republicaStatus(new Date());
  [['heroStatus', 'heroStatusLabel'], ['sideStatus', 'sideStatusLabel']].forEach(function (pair) {
    var pill = document.getElementById(pair[0]);
    var lbl = document.getElementById(pair[1]);
    if (!pill || !lbl) return;
    pill.classList.toggle('is-open', s.open);
    pill.classList.toggle('is-closed', !s.open);
    lbl.textContent = s.text;
  });
  var t = document.getElementById('sideStatusTitle');
  var x = document.getElementById('sideStatusText');
  if (t) t.textContent = s.open ? 'Estamos abiertos' : 'Ahora cerrado';
  if (x) x.textContent = s.sub;
}

function buildRepublicaDirectionsUrl(raw) {
  raw = raw || {};
  var manual = (raw.google_maps_url || '').trim();
  if (manual) return manual;
  var la = parseFloat(raw.map_lat);
  var lo = parseFloat(raw.map_lon);
  if (Number.isFinite(la) && Number.isFinite(lo)) {
    return 'https://www.google.com/maps/dir/?api=1&destination=' + encodeURIComponent(la + ',' + lo);
  }
  var addr = (raw.direccion || '').trim();
  if (addr) return 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(addr);
  return '';
}

function destroyRepublicaPreviewMap() {
  if (republicaPreviewMap) {
    try {
      republicaPreviewMap.remove();
    } catch (e) {}
    republicaPreviewMap = null;
    republicaPreviewMarker = null;
  }
}

function republicaVintageIcon() {
  if (typeof L === 'undefined') return null;
  return L.divIcon({
    className: 'vintage-marker',
    html:
      '<div style="width:40px;height:40px;border-radius:50%;background:#b8161b;color:#f5e6c8;display:grid;place-items:center;border:2px solid #d4a85a;box-shadow:0 0 0 4px #f5e6c8;"><svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6a2.5 2.5 0 0 1 0 5.5z"/></svg></div>',
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });
}

function updateRepublicaPreviewMap(lat, lon, label) {
  if (typeof lat !== 'number' || typeof lon !== 'number') {
    lat = window.__lwLat;
    lon = window.__lwLon;
  }
  var container = document.getElementById('map');
  if (!container) return;
  var ok = typeof lat === 'number' && typeof lon === 'number' && isFinite(lat) && isFinite(lon);
  if (!ok) {
    destroyRepublicaPreviewMap();
    return;
  }
  if (window.__LW_SKIP_LEAFLET) return;
  function bootMap() {
    if (typeof L === 'undefined') return;
    if (!republicaPreviewMap) {
      republicaPreviewMap = L.map('map', { scrollWheelZoom: false }).setView([lat, lon], 15);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap',
        maxZoom: 19,
      }).addTo(republicaPreviewMap);
    } else {
      republicaPreviewMap.setView([lat, lon], 15);
    }
    if (republicaPreviewMarker) republicaPreviewMap.removeLayer(republicaPreviewMarker);
    var icon = republicaVintageIcon();
    republicaPreviewMarker = L.marker([lat, lon], { icon: icon, title: label || '' }).addTo(republicaPreviewMap);
    setTimeout(function () {
      if (republicaPreviewMap) republicaPreviewMap.invalidateSize();
    }, 120);
  }
  if (typeof L === 'undefined' && typeof lwWhenLeafletReady === 'function') {
    lwWhenLeafletReady(bootMap);
  } else {
    bootMap();
  }
}

function syncRepublicaTemplateExtensions(raw) {
  raw = raw || {};
  var isPro = raw.is_pro === true || raw.is_pro === 'true' || raw.is_pro === 1;
  var branding = document.getElementById('tpl-platform-branding');
  if (branding) branding.style.display = isPro ? 'none' : '';

  var services = Array.isArray(raw.services) ? raw.services : null;
  if (services) renderRepublicaServices(services);

  var gUrl = (raw.google_business_url || '').trim();
  var opSec = document.getElementById('opiniones');
  var gBtn = document.getElementById('gbizBtn');
  if (opSec) {
    if (gUrl) {
      opSec.classList.remove('is-hidden');
      opSec.style.display = '';
      if (gBtn) gBtn.href = gUrl;
      document.querySelectorAll('a[href="#opiniones"]').forEach(function (a) {
        a.style.display = '';
      });
    } else {
      opSec.classList.add('is-hidden');
      opSec.style.display = 'none';
      if (gBtn) gBtn.removeAttribute('href');
      document.querySelectorAll('a[href="#opiniones"]').forEach(function (a) {
        a.style.display = 'none';
      });
    }
  }

  var vcOn = raw.vcard_enabled === true || raw.vcard_enabled === 'true' || raw.vcard_enabled === 1;
  var vcUrl = (raw.vcard_download_url || '').trim();
  var vcSec = document.getElementById('tplVcardWrap');
  var vcA = document.getElementById('vcardBtn');
  if (vcSec) {
    if (vcOn && vcUrl) {
      vcSec.classList.remove('is-hidden');
      vcSec.style.display = '';
      if (vcA) vcA.href = vcUrl;
    } else {
      vcSec.classList.add('is-hidden');
      vcSec.style.display = 'none';
      if (vcA) vcA.removeAttribute('href');
    }
  }
}

function applyLivePreviewData(raw, opts) {
  opts = opts || {};
  raw = raw || {};
  var name = (raw.nombre || '').trim() || 'Tu negocio';
  var tagline = (raw.tagline || '').trim() || 'Tagline corto de la casa';
  var descripcion = (raw.descripcion || '').trim();
  var direccion = (raw.direccion || '').trim();
  var correo = (raw.correo || '').trim();
  var ciudad = (raw.ciudad || '').trim();
  var year = (raw.anio_fundacion || '').trim() || String(new Date().getFullYear());
  var initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(function (w) {
      return w.charAt(0).toUpperCase();
    })
    .join('') || 'TN';

  document.title = name + ' — Vintage';

  var nav = document.querySelector('.nav');
  if (nav) {
    if ((raw.logo_url || '').trim()) {
      var lsc =
        typeof raw.logo_scale === 'number' && isFinite(raw.logo_scale) ? raw.logo_scale : 1.35;
      lsc = Math.min(1.5, Math.max(0.45, lsc));
      nav.style.setProperty('--lw-logo-scale', String(lsc));
    } else {
      nav.style.removeProperty('--lw-logo-scale');
    }
  }

  var navBrandWrap = document.getElementById('navBrandWrap');
  var navBrandLogo = document.getElementById('navBrandLogo');
  var navBrandName = document.getElementById('navBrandName');
  var logoUrl = (raw.logo_url || '').trim();
  if (navBrandWrap && navBrandLogo && navBrandName) {
    if (logoUrl) {
      navBrandLogo.src = logoUrl;
      navBrandLogo.alt = name;
      navBrandLogo.hidden = false;
      navBrandName.style.display = 'none';
      navBrandWrap.classList.add('brand-has-img');
    } else {
      navBrandLogo.removeAttribute('src');
      navBrandLogo.hidden = true;
      navBrandName.style.display = '';
      navBrandName.textContent = name;
      navBrandWrap.classList.remove('brand-has-img');
    }
  }

  var heroTitle = document.getElementById('heroTitle');
  var heroSub = document.getElementById('heroSub');
  if (heroTitle) heroTitle.textContent = name;
  if (heroSub) heroSub.textContent = tagline;

  var heroEyebrow = document.getElementById('heroEyebrow');
  if (heroEyebrow) heroEyebrow.textContent = 'EST. · ' + (year ? 'Casa fundada en ' + year : 'Casa fundada en 19XX');

  var heroTagline = document.getElementById('heroTagline');
  if (heroTagline && descripcion) heroTagline.textContent = descripcion.split(/\n\n+/)[0] || descripcion;

  var aboutTitle = document.getElementById('aboutTitle');
  var aboutLede = document.getElementById('aboutLede');
  if (aboutTitle) aboutTitle.textContent = 'Una casa con oficio, abierta desde ' + (year || 'siempre');
  if (aboutLede && descripcion) aboutLede.textContent = descripcion;

  document.querySelectorAll('.monogram, .bmark').forEach(function (el) {
    if (el.id === 'navBrandLogo') return;
    el.textContent = initials;
  });
  var footName = document.getElementById('footName');
  if (footName) footName.textContent = name;
  var footEst = document.getElementById('footEst');
  if (footEst) footEst.textContent = 'Est. ' + year + ' · ' + (ciudad || 'Casa fundada en…');

  var contactAddr = document.getElementById('contactAddressValue');
  if (contactAddr) contactAddr.textContent = direccion || ciudad || 'Calle Ejemplo, 00';

  var mapsUrl = buildRepublicaDirectionsUrl(raw);
  var addrCard = document.getElementById('contactAddressCard');
  if (addrCard) {
    if (mapsUrl) addrCard.href = mapsUrl;
    else addrCard.href = '#mapa';
  }

  if (typeof lwApplyContactLinks === 'function') lwApplyContactLinks(raw);

  var emailVal = document.getElementById('contactEmailValue');
  var emailCard = document.getElementById('contactEmailCard');
  if (emailVal) emailVal.textContent = correo || 'correo@ejemplo.com';
  if (emailCard && correo) emailCard.href = 'mailto:' + correo;

  updateRepublicaHeroPhotos(raw);
  updateRepublicaAboutPhoto(raw);
  if (Object.prototype.hasOwnProperty.call(raw, 'galeria')) {
    renderRepublicaGallery(raw.galeria);
  }
  syncRepublicaScheduleFromPreview(raw.horario);
  renderRepublicaSchedule();
  applyRepublicaStatus();
  syncRepublicaTemplateExtensions(raw);

  var lat = parseFloat(raw.map_lat);
  var lon = parseFloat(raw.map_lon);
  if (Number.isFinite(lat) && Number.isFinite(lon)) {
    updateRepublicaPreviewMap(lat, lon, name);
  } else {
    destroyRepublicaPreviewMap();
  }
}

(function initRepublicaPreviewModeClasses() {
  var params = new URLSearchParams(window.location.search);
  if (params.get('embed') === '1') {
    document.documentElement.classList.add('embed-preview-root');
    document.body.classList.add('embed-preview');
  }
  if (params.get('preview') === '1') {
    document.body.classList.add('republica-preview');
  }
})();

(function initLivePreviewFromQuery() {
  var params = new URLSearchParams(window.location.search);
  if (params.get('landingDemo') === '1') return;
  if (!params.has('preview')) {
    syncRepublicaScheduleFromPreview(null);
    renderRepublicaSchedule();
    applyRepublicaStatus();
    syncRepublicaTemplateExtensions({});
    return;
  }
  applyLivePreviewData(
    {
      nombre: params.get('nombre') || '',
      tagline: params.get('tagline') || '',
      telefono: params.get('telefono') || '',
      portada: params.get('portada') || '',
      portada_2: params.get('portada_2') || '',
      portada_3: params.get('portada_3') || '',
      descripcion: params.get('descripcion') || '',
      foto_equipo: params.get('foto_equipo') || '',
      direccion: params.get('direccion') || '',
      correo: params.get('correo') || '',
      ciudad: params.get('ciudad') || '',
      pais: params.get('pais') || '',
    },
    { alignToHash: !!window.location.hash.replace(/^#/, '') }
  );
})();

(function initSecureMessageListener() {
  var queryOrigin = new URLSearchParams(location.search).get('parentOrigin') || '';
  var DEV_ORIGINS = [
    'http://localhost',
    'http://localhost:5173',
    'http://localhost:4173',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:4173',
  ];
  function isAllowedOrigin(origin) {
    if (queryOrigin) return origin === queryOrigin;
    return DEV_ORIGINS.indexOf(origin) !== -1;
  }
  window.addEventListener('message', function (event) {
    if (!isAllowedOrigin(event.origin)) return;
    var data = event.data;
    if (!data || data.type !== 'lw:onboarding-preview') return;
    if (
      data.payload &&
      typeof data.payload.brand_color === 'string' &&
      typeof data.payload.brand_variable === 'string'
    ) {
      var lwBrandHex = data.payload.brand_color.trim();
      var lwBrandVar = data.payload.brand_variable.trim();
      if (/^#[0-9a-fA-F]{6}$/.test(lwBrandHex) && /^[a-zA-Z_][a-zA-Z0-9_-]*$/.test(lwBrandVar)) {
        if (typeof lwApplyBrandColor === 'function') lwApplyBrandColor(lwBrandVar, lwBrandHex);
      } else if (lwBrandHex === '' && /^[a-zA-Z_][a-zA-Z0-9_-]*$/.test(lwBrandVar)) {
        typeof lwClearBrandColor === 'function'
          ? lwClearBrandColor(lwBrandVar)
          : document.documentElement.style.removeProperty('--' + lwBrandVar);
      }
    }
    applyLivePreviewData(data.payload || {}, { alignToHash: data.alignToHash === true });
  });
})();
</script>
<script src="/templates/lw-landing-demo.js?v=2"></script>
"""

RESPONSIVE_SAFETY = """
<style id="lw-responsive-safety">
  html,body{overflow-x:clip;max-width:100%}
  @media (max-width:880px){
    .nav-inner{gap:10px;min-width:0;padding-left:max(12px,env(safe-area-inset-left,0px));padding-right:max(12px,env(safe-area-inset-right,0px))}
    .brand{min-width:0;flex:1 1 auto;max-width:calc(100% - 118px)}
    .brand.brand-has-img .nav-brand-img{max-width:min(140px,38vw)!important;max-height:calc(34px * var(--lw-logo-scale,1.35))!important}
    .nav-cta{flex-shrink:0;gap:8px}
    .nav-cta .btn{white-space:nowrap;font-size:clamp(9px,2.8vw,11px);padding:7px 10px}
    .burger{flex-shrink:0}
  }
</style>
"""

LEAFLET_LOADER = """
<script>
(function () {
  var p = new URLSearchParams(location.search);
  if (p.get('thumb') === '1') { window.__LW_SKIP_LEAFLET = true; return; }
  var l = document.createElement('link');
  l.rel = 'stylesheet';
  l.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
  l.crossOrigin = '';
  document.head.appendChild(l);
})();
</script>
"""


def main() -> None:
    src_lines = SRC.read_text(encoding="utf-8").splitlines()
    # CSS inside <style> lines 16-625 (1-indexed) => indices 15-624
    css_block = "\n".join(src_lines[15:625])

    body_start = 626  # line 627 is <body>
    body_end = 974  # before scripts
    body = "\n".join(src_lines[626:974])

    # Original UI script (burger, reveal, ticker, schedule demo menu) — strip vCard blob + leaflet loader
    orig_script_lines = []
    in_script = False
    for line in src_lines[974:]:
        if "<script" in line and "email-decode" in line:
            continue
        if line.strip().startswith("<script"):
            in_script = True
        if in_script:
            if "var COORDS" in line or "var ls = document.createElement" in line:
                break
            if "/* ===== vCard ===== */" in line:
                break
            orig_script_lines.append(line)
        if "</script>" in line and in_script and "vcardBtn" not in "".join(orig_script_lines[-5:]):
            orig_script_lines.append(line)
            if "document.head.appendChild(ls)" not in "".join(orig_script_lines):
                break

    # Re-extract original script more reliably
    full = SRC.read_text(encoding="utf-8")
    script_match_start = full.find("<script>\n(function(){\n  'use strict';")
    script_match_end = full.find("  /* ===== Leaflet")
    orig_script = full[script_match_start:script_match_end] + "})();\n</script>\n"

    # Patch body HTML
    body = body.replace(
        '<a href="#top" class="brand" aria-label="Inicio · Tu negocio">',
        '<a href="#top" class="brand" id="navBrandWrap" aria-label="Inicio · Tu negocio">'
        + '\n      <img id="navBrandLogo" class="nav-brand-img" alt="" hidden style="display:none"/>',
    )
    body = body.replace(
        '<span class="bmark" aria-hidden="true">TN</span>\n      Tu negocio',
        '<span class="bmark" id="navBrandMark" aria-hidden="true">TN</span>\n      <span id="navBrandName">Tu negocio</span>',
    )
    body = body.replace(
        '<a class="btn btn-cream btn-sm" href="https://wa.me/" aria-label="Escríbenos por WhatsApp">',
        '<a class="btn btn-cream btn-sm" href="https://wa.me/" data-wa-link aria-label="Escríbenos por WhatsApp">',
    )

    body = body.replace(
        '<span class="eyebrow flank hero-eyebrow reveal">EST. · Casa fundada en 19XX</span>',
        '<span class="eyebrow flank hero-eyebrow reveal" id="heroEyebrow">EST. · Casa fundada en 19XX</span>',
    )
    body = body.replace(
        '<h1 id="hero-title" class="reveal">\n      Tu negocio\n      <span class="sub">Tagline corto de la casa</span>',
        '<h1 id="hero-title" class="reveal">\n      <span id="heroTitle">Tu negocio</span>\n      <span class="sub" id="heroSub">Tagline corto de la casa</span>',
    )
    body = body.replace(
        '<p class="hero-tagline reveal">Frase breve',
        '<p class="hero-tagline reveal" id="heroTagline">Frase breve',
    )
    body = body.replace(
        '<a class="btn btn-ghost" href="tel:+00000000000">',
        '<a class="btn btn-ghost" href="tel:+00000000000" data-tel-link>',
        1,
    )

    body = body.replace(
        '<figure class="vphoto">\n        <div class="ph" role="img" aria-label="Foto del local',
        '<figure class="vphoto" id="heroPhoto1">\n        <div class="ph" role="img" aria-label="Foto del local',
        1,
    )
    body = body.replace(
        '<figure class="vphoto">\n        <div class="ph" role="img" aria-label="Foto del plato',
        '<figure class="vphoto" id="heroPhoto2">\n        <div class="ph" role="img" aria-label="Foto del plato',
        1,
    )
    body = body.replace(
        '<figure class="vphoto">\n        <div class="ph" role="img" aria-label="Foto del equipo',
        '<figure class="vphoto" id="heroPhoto3">\n        <div class="ph" role="img" aria-label="Foto del equipo',
        1,
    )

    body = body.replace(
        '<section id="servicios" aria-labelledby="serv-title" style="display:none;">',
        '<section id="servicios" class="is-hidden" aria-labelledby="serv-title" style="display:none;">',
    )
    body = body.replace(
        '<div class="vphoto">\n          <div class="ph" role="img" aria-label="Foto del equipo o del local',
        '<div class="vphoto" id="aboutPhotoWrap">\n          <div class="ph" role="img" aria-label="Foto del equipo o del local',
    )

    body = body.replace(
        '<div class="gallery" data-stagger>',
        '<div class="gallery" data-stagger id="galleryLive">',
    )
    body = body.replace(
        '<section id="opiniones" aria-labelledby="rev-title" style="display:none;">',
        '<section id="opiniones" class="is-hidden" aria-labelledby="rev-title" style="display:none;">',
    )
    body = body.replace(
        '<a class="btn btn-gold" href="https://www.google.com/" rel="noopener" target="_blank">',
        '<a class="btn btn-gold" href="https://www.google.com/" id="gbizBtn" rel="noopener" target="_blank">',
    )
    body = body.replace(
        '<section aria-labelledby="vcard-title" style="display:none;">',
        '<section id="tplVcardWrap" class="is-hidden" aria-labelledby="vcard-title" style="display:none;">',
    )
    body = body.replace(
        '<a class="contact-phone reveal num" href="tel:+00000000000">+00 000 000 000</a>',
        '<a class="contact-phone reveal num" href="tel:+00000000000" id="contactPhone" data-tel-link>+00 000 000 000</a>',
    )
    body = body.replace(
        '<a class="ccard" href="https://wa.me/">',
        '<a class="ccard" href="https://wa.me/" data-wa-link>',
    )
    body = body.replace(
        '<a class="ccard" href="/cdn-cgi/l/email-protection#731b1c1f1233171c1e1a1d1a1c5d101c1e">',
        '<a class="ccard" href="mailto:hola@ejemplo.com" id="contactEmailCard">',
    )
    body = body.replace(
        '<span class="value"><span class="__cf_email__" data-cfemail="eb8384878aab8f848682858284c5888486">[email&#160;protected]</span></span>',
        '<span class="value" id="contactEmailValue">hola@ejemplo.com</span>',
    )
    body = body.replace(
        '<a class="ccard" href="#mapa">',
        '<a class="ccard" href="#mapa" id="contactAddressCard">',
    )
    body = body.replace(
        '<span class="value">Calle Ejemplo, 00</span>',
        '<span class="value" id="contactAddressValue">Calle Ejemplo, 00</span>',
    )
    body = body.replace(
        '<div class="foot-name">Tu negocio</div>',
        '<div class="foot-name" id="footName">Tu negocio</div>',
    )
    body = body.replace(
        '<div class="foot-est">Est. 19XX · Casa fundada en…</div>',
        '<div class="foot-est" id="footEst">Est. 19XX · Casa fundada en…</div>',
    )
    body = body.replace(
        '<div class="foot-bottom">© <span id="year"></span> Tu negocio · Todos los derechos reservados · Aviso legal · Privacidad</div>',
        '<div class="foot-bottom">© <span id="year"></span> <span id="footCopyName">Tu negocio</span> · Todos los derechos reservados · '
        '<span id="tpl-platform-branding">Creado con <a href="https://localweb.es" target="_blank" rel="noopener noreferrer">ONEZ</a></span></div>',
    )
    body = body.replace(
        '<a class="btn btn-gold" href="https://wa.me/" rel="noopener">',
        '<a class="btn btn-gold" href="https://wa.me/" data-wa-link rel="noopener">',
    )
    body = body.replace('href="tel:+00000000000">Llamar ahora</a>', 'href="tel:+00000000000" data-tel-link>Llamar ahora</a>')

    # Remove static MENU render from orig script — ONEZ handles menuGrid
    orig_script = orig_script.replace(
        "  /* ===== Carta / Servicios ===== */\n  var MENU = [",
        "  /* ===== Carta / Servicios (ONEZ: menuGrid) ===== */\n  var MENU_SKIP = [",
    )
    orig_script = orig_script.replace(
        "  var mg = document.getElementById('menuGrid');\n  if(mg){\n    mg.innerHTML = MENU.map(function(m){",
        "  var mg = document.getElementById('menuGrid');\n  if(mg && false){\n    mg.innerHTML = MENU_SKIP.map(function(m){",
    )
    # Remove static schedule from orig — ONEZ handles
    orig_script = orig_script.replace(
        "  /* ===== Horario + estado en vivo ===== */\n  var SCHEDULE = [",
        "  /* ===== Horario (ONEZ) ===== */\n  if(typeof renderRepublicaSchedule==='function'){renderRepublicaSchedule();applyRepublicaStatus();setInterval(applyRepublicaStatus,60000);}else{var SCHEDULE_LEGACY = [",
    )
    # Close legacy block before leaflet comment - messy; simpler: remove schedule block entirely
    import re

    orig_script = re.sub(
        r"  /\* ===== Horario.*?setInterval\(applyStatus, 60000\);\n",
        "",
        orig_script,
        flags=re.DOTALL,
    )

    out = f"""<!doctype html>
<!--
  Contrato LocalWeb: postMessage `lw:onboarding-preview` + `?parentOrigin=` en iframe.
-->
<html lang="es">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>{{{{nombre}}}} — Vintage</title>
<meta name="description" content="Plantilla profesional de estilo vintage americana / soda fountain para restaurantes, sangüicherías y delis con identidad de marca clásica." />
{RESPONSIVE_SAFETY}
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Alfa+Slab+One&family=DM+Serif+Display:ital@0;1&family=Oswald:wght@400;500;600;700&family=Lora:ital,wght@0,400;0,500;0,600;1,400&family=Courier+Prime:wght@400;700&display=swap" rel="stylesheet">
{LEAFLET_LOADER}
{css_block}
{INTEGRATION_CSS}
</head>
{body}
{orig_script}
{INTEGRATION_JS}
<!--
LW-CONTRACT-VERSION: 1
Public: applyLivePreviewData, initLivePreviewFromQuery, initSecureMessageListener
-->
</body>
</html>
"""

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(out, encoding="utf-8")
    print(f"Wrote {OUT} ({len(out)} bytes)")


if __name__ == "__main__":
    main()
