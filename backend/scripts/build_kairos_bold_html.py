#!/usr/bin/env python3
"""Build front/public/templates/kairos-bold.html from source mock."""
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "kairos-bold.html"
OUT = ROOT / "front/public/templates/kairos-bold.html"

INTEGRATION_CSS = """
<style id="lw-template-hooks">
  section[id],a[id]{scroll-margin-top:100px}
  html.embed-preview-root,body.embed-preview{overflow:auto!important;height:auto!important;min-height:100%}
  body.embed-preview .nav{position:fixed}
  #servicios.is-hidden,#opiniones.is-hidden,#tplVcardWrap.is-hidden{display:none!important}
  #tpl-platform-branding a{color:var(--orange)}
  .nav{--lw-logo-scale:1}
  .brand.brand-has-img .bmark{display:none!important}
  .brand.brand-has-img #navBrandName{display:none!important}
  .brand.brand-has-img .nav-brand-img{display:block;height:calc(38px * var(--lw-logo-scale,1));width:auto;max-width:calc(200px * var(--lw-logo-scale,1));object-fit:contain}
</style>
<style id="lw-photo-overrides">
  .hero-photo.has-photo .ph,.about-photo.has-photo .ph,.stack-card .sc-photo.has-photo .ph,.g-item.has-photo .ph{display:none!important}
  .hero-photo.has-photo img,.about-photo.has-photo img,.stack-card .sc-photo.has-photo img,.g-item.has-photo img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
</style>
"""

INTEGRATION_JS = r"""
<script src="/templates/lw-contact-links.js?v=3"></script>
<script>
/* ONEZ / LocalWeb — kairos-bold */
var KAIROS_SCHEDULE_DEFAULT = [
  { day: 'Lunes',     open: '12:00', close: '23:30' },
  { day: 'Martes',    open: '12:00', close: '23:30' },
  { day: 'Miércoles', open: '12:00', close: '23:30' },
  { day: 'Jueves',    open: '12:00', close: '23:30' },
  { day: 'Viernes',   open: '12:00', close: '01:00' },
  { day: 'Sábado',    open: '12:00', close: '01:00' },
  { day: 'Domingo',   open: '13:00', close: '23:00' }
];
var SCHEDULE = KAIROS_SCHEDULE_DEFAULT.map(function (r) {
  return { day: r.day, open: r.open, close: r.close };
});

var KAIROS_PREVIEW_SAMPLE = {
  portada: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=900&q=80',
  portada_2: 'https://images.unsplash.com/photo-1572802419224-296b0aeee0df?auto=format&fit=crop&w=900&q=80',
  portada_3: 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=900&q=80',
  foto_equipo: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=900&q=80',
};

var KAIROS_DEFAULT_GALLERY =
  '<figure class="g-item"><div class="ph o" role="img"><span class="emoji" aria-hidden="true">🍔</span><span class="ph-label">FOTO · 01</span></div></figure>' +
  '<figure class="g-item"><div class="ph c" role="img"><span class="emoji" aria-hidden="true">🍕</span><span class="ph-label">FOTO · 02</span></div></figure>' +
  '<figure class="g-item"><div class="ph b" role="img"><span class="emoji" aria-hidden="true">🌮</span><span class="ph-label">FOTO · 03</span></div></figure>' +
  '<figure class="g-item"><div class="ph c" role="img"><span class="emoji" aria-hidden="true">🍟</span><span class="ph-label">FOTO · 04</span></div></figure>' +
  '<figure class="g-item"><div class="ph b" role="img"><span class="emoji" aria-hidden="true">🥤</span><span class="ph-label">FOTO · 05</span></div></figure>' +
  '<figure class="g-item"><div class="ph o" role="img"><span class="emoji" aria-hidden="true">🍩</span><span class="ph-label">FOTO · 06</span></div></figure>';

var KAIROS_STACK_PH = ['o', 'c', 'b', 'o', 'c'];
var KAIROS_STACK_EMOJI = ['🍔', '🍕', '🌮', '🥗', '🍩'];

var kairosPreviewMap = null;
var kairosPreviewMarker = null;

function shouldUseKairosSampleMedia() {
  return document.body.classList.contains('embed-preview') || document.body.classList.contains('kairos-preview');
}

function kairosResolvePreviewPhotoSrc(userSrc, sampleKey) {
  var src = userSrc ? String(userSrc).trim() : '';
  if (src) return src;
  if (!shouldUseKairosSampleMedia()) return '';
  return KAIROS_PREVIEW_SAMPLE[sampleKey] || '';
}

function escapeKairosHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escapeKairosAttr(s) {
  return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

function formatKairosPrice(p) {
  if (p === null || p === undefined || p === '') return 'Consultar';
  var n = typeof p === 'number' ? p : parseFloat(String(p).replace(',', '.'));
  if (!Number.isFinite(n)) return 'Consultar';
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
}

function kairosSetPhoto(wrap, src) {
  if (!wrap) return;
  var s = src ? String(src).trim() : '';
  var ph = wrap.querySelector('.ph');
  var img = wrap.querySelector('img.kairos-photo');
  if (s) {
    if (!img) {
      img = document.createElement('img');
      img.className = 'kairos-photo';
      img.alt = '';
      img.decoding = 'async';
      img.loading = 'lazy';
      wrap.appendChild(img);
    }
    img.src = s;
    wrap.classList.add('has-photo');
    if (ph) ph.classList.add('has-photo');
  } else {
    if (img) img.remove();
    wrap.classList.remove('has-photo');
    if (ph) ph.classList.remove('has-photo');
  }
}

function updateKairosHeroPhotos(raw) {
  raw = raw || {};
  var hasAny =
    Object.prototype.hasOwnProperty.call(raw, 'portada') ||
    Object.prototype.hasOwnProperty.call(raw, 'portada_2') ||
    Object.prototype.hasOwnProperty.call(raw, 'portada_3');
  if (!hasAny && !shouldUseKairosSampleMedia()) return;
  kairosSetPhoto(document.getElementById('heroPhoto1'), kairosResolvePreviewPhotoSrc(raw.portada, 'portada'));
  kairosSetPhoto(document.getElementById('heroPhoto2'), kairosResolvePreviewPhotoSrc(raw.portada_2, 'portada_2'));
  kairosSetPhoto(document.getElementById('heroPhoto3'), kairosResolvePreviewPhotoSrc(raw.portada_3, 'portada_3'));
}

function updateKairosAboutPhoto(raw) {
  var wrap = document.getElementById('aboutPhotoWrap');
  if (!wrap) return;
  var hasFoto = raw && Object.prototype.hasOwnProperty.call(raw, 'foto_equipo');
  if (!hasFoto && !shouldUseKairosSampleMedia()) return;
  kairosSetPhoto(wrap, kairosResolvePreviewPhotoSrc(raw && raw.foto_equipo, 'foto_equipo'));
}

function renderKairosGallery(urls) {
  var root = document.getElementById('galleryLive');
  if (!root) return;
  var list = Array.isArray(urls) ? urls.filter(Boolean) : [];
  if (list.length === 0) {
    root.innerHTML = KAIROS_DEFAULT_GALLERY;
    return;
  }
  root.innerHTML = list
    .slice(0, 6)
    .map(function (src) {
      var esc = escapeKairosAttr(src);
      return (
        '<figure class="g-item has-photo"><img class="kairos-photo" src="' + esc + '" alt="" loading="lazy" decoding="async"></figure>'
      );
    })
    .join('');
}

function renderKairosStack(services) {
  var stack = document.getElementById('stack');
  var sec = document.getElementById('servicios');
  if (!stack || !sec) return;
  var list = Array.isArray(services)
    ? services.filter(function (s) { return s && String(s.name || '').trim(); })
    : [];
  if (list.length === 0) {
    sec.classList.add('is-hidden');
    sec.style.display = 'none';
    stack.innerHTML = '';
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
  stack.innerHTML = list
    .map(function (m, i) {
      var n = (i + 1 < 10 ? '0' : '') + (i + 1);
      var ph = KAIROS_STACK_PH[i % KAIROS_STACK_PH.length];
      var emoji = KAIROS_STACK_EMOJI[i % KAIROS_STACK_EMOJI.length];
      var tag = m.tag || (m.highlight ? 'TOP' : '');
      return (
        '<article class="stack-card pop">' +
        '<div class="sc-photo"><div class="ph ' + ph + '" role="img" aria-hidden="true">' +
        '<span class="emoji" aria-hidden="true">' + emoji + '</span>' +
        '<span class="ph-label">FOTO PLATO</span></div></div>' +
        '<div class="sc-body">' +
        '<div class="sc-top"><span class="sc-num">N° ' + n + '</span>' +
        (tag
          ? '<span class="cap" style="font-size:.78rem;padding:.25rem .7rem;box-shadow:none;">' +
            escapeKairosHtml(String(tag)) +
            '</span>'
          : '') +
        '</div>' +
        '<h3 class="sc-name">' + escapeKairosHtml(String(m.name || '')) + '</h3>' +
        (m.description
          ? '<p class="sc-desc">' + escapeKairosHtml(String(m.description)) + '</p>'
          : '') +
        '<div class="sc-foot"><span class="sc-price num">' +
        escapeKairosHtml(formatKairosPrice(m.price)) +
        '</span><a class="btn btn-ink btn-sm" href="https://wa.me/" data-wa-link>Pedí este</a></div>' +
        '</div></article>'
      );
    })
    .join('');
  if (typeof window.kairosLayoutStack === 'function') window.kairosLayoutStack();
  if (typeof lwApplyContactLinks === 'function') lwApplyContactLinks(window.__kairosLastRaw || {});
}

function syncKairosScheduleFromPreview(h) {
  if (h == null || typeof h !== 'object') {
    SCHEDULE = KAIROS_SCHEDULE_DEFAULT.map(function (r) {
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
    return { day: t[1], open: row.open || '12:00', close: row.close || '23:00' };
  });
}

function dayIndex(js) {
  return (js + 6) % 7;
}

function renderKairosSchedule() {
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
      escapeKairosHtml(row.day) +
      '</span><span class="hours num">' +
      escapeKairosHtml(hours) +
      '</span></div>'
    );
  }).join('');
}

function toMin(h) {
  var p = h.split(':');
  return +p[0] * 60 + +p[1];
}

function kairosStatus(now) {
  var idx = dayIndex(now.getDay());
  var row = SCHEDULE[idx];
  var cur = now.getHours() * 60 + now.getMinutes();
  if (!row || !row.open) return { open: false, text: 'Cerrado hoy', sub: 'Volvé mañana o escribinos.' };
  var o = toMin(row.open);
  var c = toMin(row.close);
  if (c <= o) c += 1440;
  if (cur >= o && cur < c) {
    return { open: true, text: 'Abierto · cierra a las ' + row.close, sub: 'Pedí ya o pásate. Te lo preparamos al momento.' };
  }
  if (cur < o) return { open: false, text: 'Abrimos a las ' + row.open, sub: 'Te atendemos en cuanto abramos.' };
  return { open: false, text: 'Cerrado por hoy', sub: 'Escribinos, te atendemos mañana.' };
}

function applyKairosStatus() {
  var s = kairosStatus(new Date());
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

function buildKairosDirectionsUrl(raw) {
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

function lwWhenLeafletReady(cb) {
  if (window.__LW_SKIP_LEAFLET) return;
  var n = 0;
  function tick() {
    if (typeof L !== 'undefined') {
      cb();
      return;
    }
    if (++n < 80) setTimeout(tick, 50);
  }
  tick();
}

function destroyKairosPreviewMap() {
  if (kairosPreviewMap) {
    try {
      kairosPreviewMap.remove();
    } catch (e) {}
    kairosPreviewMap = null;
    kairosPreviewMarker = null;
  }
}

function kairosBoldIcon() {
  if (typeof L === 'undefined') return null;
  return L.divIcon({
    className: 'bold-marker',
    html:
      '<div style="width:42px;height:42px;border-radius:13px;background:#ee7a1f;color:#1a1410;display:grid;place-items:center;border:3px solid #1a1410;box-shadow:4px 4px 0 #1a1410;"><svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M12 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6a2.5 2.5 0 0 1 0 5.5z"/></svg></div>',
    iconSize: [42, 42],
    iconAnchor: [21, 21],
  });
}

function updateKairosPreviewMap(lat, lon, label) {
  if (typeof lat !== 'number' || typeof lon !== 'number') {
    lat = window.__lwLat;
    lon = window.__lwLon;
  }
  var container = document.getElementById('map');
  if (!container) return;
  var ok = typeof lat === 'number' && typeof lon === 'number' && isFinite(lat) && isFinite(lon);
  if (!ok) {
    destroyKairosPreviewMap();
    return;
  }
  if (window.__LW_SKIP_LEAFLET) return;
  function bootMap() {
    if (typeof L === 'undefined') return;
    if (!kairosPreviewMap) {
      kairosPreviewMap = L.map('map', { scrollWheelZoom: false }).setView([lat, lon], 18);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap',
        maxZoom: 19,
      }).addTo(kairosPreviewMap);
    } else {
      kairosPreviewMap.setView([lat, lon], 18);
    }
    if (kairosPreviewMarker) kairosPreviewMap.removeLayer(kairosPreviewMarker);
    var icon = kairosBoldIcon();
    kairosPreviewMarker = L.marker([lat, lon], { icon: icon, title: label || '' }).addTo(kairosPreviewMap);
    setTimeout(function () {
      if (kairosPreviewMap) kairosPreviewMap.invalidateSize();
    }, 120);
  }
  if (typeof L === 'undefined' && typeof lwWhenLeafletReady === 'function') {
    lwWhenLeafletReady(bootMap);
  } else {
    bootMap();
  }
}

function syncKairosTemplateExtensions(raw) {
  raw = raw || {};
  window.__kairosLastRaw = raw;
  var isPro = raw.is_pro === true || raw.is_pro === 'true' || raw.is_pro === 1;
  var branding = document.getElementById('tpl-platform-branding');
  if (branding) branding.style.display = isPro ? 'none' : '';

  var services = Array.isArray(raw.services) ? raw.services : null;
  if (services) renderKairosStack(services);

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
  window.__kairosLastRaw = raw;
  var name = (raw.nombre || '').trim() || 'Tu negocio';
  var tagline = (raw.tagline || '').trim() || 'Frase corta y con chispa sobre tu negocio.';
  var descripcion = (raw.descripcion || '').trim();
  var direccion = (raw.direccion || '').trim();
  var correo = (raw.correo || '').trim();
  var ciudad = (raw.ciudad || '').trim();
  var year = (raw.anio_fundacion || '').trim() || String(new Date().getFullYear());
  var parts = name.split(/\s+/).filter(Boolean);
  var first = parts[0] || 'Tu';
  var rest = parts.slice(1).join(' ') || 'negocio';
  var initials = parts
    .slice(0, 2)
    .map(function (w) {
      return w.charAt(0).toUpperCase();
    })
    .join('') || 'TN';

  document.title = name + ' — Bold pop';

  var nav = document.querySelector('.nav');
  if (nav) {
    if ((raw.logo_url || '').trim()) {
      var lsc =
        typeof raw.logo_scale === 'number' && isFinite(raw.logo_scale) ? raw.logo_scale : 1;
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
  var heroTitleTint = document.getElementById('heroTitleTint');
  if (heroTitle) heroTitle.textContent = first;
  if (heroTitleTint) heroTitleTint.textContent = rest;

  var heroTagline = document.getElementById('heroTagline');
  if (heroTagline) heroTagline.textContent = tagline;
  if (heroTagline && descripcion && !tagline) heroTagline.textContent = descripcion.split(/\n\n+/)[0] || descripcion;

  var aboutTitle = document.getElementById('aboutTitle');
  var aboutLede = document.getElementById('aboutLede');
  if (aboutTitle) aboutTitle.textContent = 'Gente con hambre de hacerlo rico';
  if (aboutLede && descripcion) aboutLede.textContent = descripcion;

  document.querySelectorAll('.bmark').forEach(function (el) {
    if (el.id === 'navBrandLogo') return;
    el.textContent = initials;
  });

  var footBrand = document.getElementById('footBrand');
  if (footBrand) footBrand.textContent = name;
  var footTagline = document.getElementById('footTagline');
  if (footTagline) footTagline.textContent = tagline || descripcion || 'Comida rica, rápida y hecha con ganas.';
  var footCopy = document.getElementById('footCopyName');
  if (footCopy) footCopy.textContent = name;
  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = year;

  var contactAddr = document.getElementById('contactAddressValue');
  if (contactAddr) contactAddr.textContent = direccion || ciudad || 'Calle Ejemplo, 00 · Ciudad';

  var mapsUrl = buildKairosDirectionsUrl(raw);
  var addrCard = document.getElementById('contactAddressCard');
  if (addrCard) {
    if (mapsUrl) addrCard.href = mapsUrl;
    else addrCard.href = '#mapa';
  }

  if (typeof lwApplyContactLinks === 'function') lwApplyContactLinks(raw);

  var emailVal = document.getElementById('contactEmailValue');
  var emailCard = document.getElementById('contactEmailCard');
  if (emailVal) emailVal.textContent = correo || 'hola@ejemplo.com';
  if (emailCard && correo) emailCard.href = 'mailto:' + correo;

  updateKairosHeroPhotos(raw);
  updateKairosAboutPhoto(raw);
  if (Object.prototype.hasOwnProperty.call(raw, 'galeria')) {
    renderKairosGallery(raw.galeria);
  }
  syncKairosScheduleFromPreview(raw.horario);
  renderKairosSchedule();
  applyKairosStatus();
  syncKairosTemplateExtensions(raw);

  var lat = parseFloat(raw.map_lat);
  var lon = parseFloat(raw.map_lon);
  if (Number.isFinite(lat) && Number.isFinite(lon)) {
    updateKairosPreviewMap(lat, lon, name);
  } else {
    destroyKairosPreviewMap();
  }
}

(function initKairosPreviewModeClasses() {
  var params = new URLSearchParams(window.location.search);
  if (params.get('embed') === '1') {
    document.documentElement.classList.add('embed-preview-root');
    document.body.classList.add('embed-preview');
  }
  if (params.get('preview') === '1') {
    document.body.classList.add('kairos-preview');
  }
})();

(function initLivePreviewFromQuery() {
  var params = new URLSearchParams(window.location.search);
  if (params.get('landingDemo') === '1') return;
  if (!params.has('preview')) {
    syncKairosScheduleFromPreview(null);
    renderKairosSchedule();
    applyKairosStatus();
    setInterval(applyKairosStatus, 60000);
    syncKairosTemplateExtensions({});
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
    .brand.brand-has-img .nav-brand-img{max-width:min(140px,38vw)!important;max-height:calc(38px * var(--lw-logo-scale,1))!important}
    .nav-cta{flex-shrink:0;gap:8px}
    .nav-cta .btn-wa{white-space:nowrap;font-size:clamp(9px,2.8vw,11px);padding:7px 10px}
    .burger{flex-shrink:0}
  }
</style>
"""

LEAFLET_CSS_LOADER = """
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

LEAFLET_JS_LOADER = """
<script>
(function () {
  var p = new URLSearchParams(location.search);
  if (p.get('thumb') === '1') { window.__LW_SKIP_LEAFLET = true; return; }
  var s = document.createElement('script');
  s.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
  s.crossOrigin = '';
  document.head.appendChild(s);
})();
</script>
"""


def patch_body(body: str) -> str:
    body = body.replace(
        '<a href="#top" class="brand" aria-label="Inicio · Tu negocio">',
        '<a href="#top" class="brand" id="navBrandWrap" aria-label="Inicio · Tu negocio">\n'
        '      <img id="navBrandLogo" class="nav-brand-img" alt="" hidden style="display:none"/>',
    )
    body = body.replace(
        '<span class="bmark" aria-hidden="true">◆</span>\n      Tu negocio',
        '<span class="bmark" id="navBrandMark" aria-hidden="true">◆</span>\n      <span id="navBrandName">Tu negocio</span>',
    )
    body = body.replace(
        '<a class="btn btn-wa btn-sm" href="https://wa.me/" aria-label="Pedí por WhatsApp">',
        '<a class="btn btn-wa btn-sm" href="https://wa.me/" data-wa-link aria-label="Pedí por WhatsApp">',
    )
    body = body.replace(
        '<h1 id="hero-title">Tu <span class="tint">negocio</span></h1>',
        '<h1 id="hero-title"><span id="heroTitle">Tu</span> <span class="tint" id="heroTitleTint">negocio</span></h1>',
    )
    body = body.replace(
        '<p class="hero-tagline">Frase corta y con chispa:',
        '<p class="hero-tagline" id="heroTagline">Frase corta y con chispa:',
    )
    body = body.replace(
        '<a class="btn btn-ink" href="https://wa.me/">\n            <svg viewBox="0 0 24 24" fill="currentColor"',
        '<a class="btn btn-ink" href="https://wa.me/" data-wa-link>\n            <svg viewBox="0 0 24 24" fill="currentColor"',
        1,
    )
    body = body.replace(
        '<figure class="hero-photo p1">',
        '<figure class="hero-photo p1" id="heroPhoto1">',
    )
    body = body.replace(
        '<figure class="hero-photo p2">',
        '<figure class="hero-photo p2" id="heroPhoto2">',
    )
    body = body.replace(
        '<figure class="hero-photo p3">',
        '<figure class="hero-photo p3" id="heroPhoto3">',
    )
    body = body.replace(
        '<section id="servicios" class="bg-cream"',
        '<section id="servicios" class="bg-cream is-hidden" style="display:none;"',
    )
    body = body.replace(
        '<figure class="about-photo reveal">',
        '<figure class="about-photo reveal" id="aboutPhotoWrap">',
    )
    body = body.replace(
        '<h2 id="about-title" class="reveal">Gente con hambre de hacerlo rico</h2>',
        '<h2 id="aboutTitle" class="reveal">Gente con hambre de hacerlo rico</h2>',
    )
    body = re.sub(
        r'<p class="lede reveal">Cuenta aquí quién está detrás.*?</p>',
        '<p class="lede reveal" id="aboutLede">Cuenta aquí quién está detrás, cómo empezó todo y qué os hace diferentes. Producto, recetas y muchas ganas de que repitas.</p>',
        body,
        count=1,
        flags=re.DOTALL,
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
        '<a class="btn btn-ink" href="https://www.google.com/" rel="noopener" target="_blank">',
        '<a class="btn btn-ink" href="https://www.google.com/" id="gbizBtn" rel="noopener" target="_blank">',
    )
    body = body.replace(
        '<section aria-labelledby="vcard-title" style="display:none;">',
        '<section id="tplVcardWrap" class="is-hidden" aria-labelledby="vcard-title" style="display:none;">',
    )
    body = body.replace(
        '<a class="contact-big c1" href="tel:+00000000000">',
        '<a class="contact-big c1" href="tel:+00000000000" data-tel-link>',
    )
    body = body.replace(
        '<a class="contact-big c2" href="https://wa.me/">',
        '<a class="contact-big c2" href="https://wa.me/" data-wa-link>',
    )
    body = body.replace(
        '<a class="ccard" href="/cdn-cgi/l/email-protection#f79f989b96b793989a9e999e98d994989a">',
        '<a class="ccard" href="mailto:hola@ejemplo.com" id="contactEmailCard">',
    )
    body = body.replace(
        '<span class="v"><span class="__cf_email__" data-cfemail="fb9394979abb9f949692959294d5989496">[email&#160;protected]</span></span>',
        '<span class="v" id="contactEmailValue">hola@ejemplo.com</span>',
    )
    body = body.replace(
        '<a class="ccard" href="#mapa">\n        <span class="l">Visitanos</span>\n        <span class="v">Calle Ejemplo, 00 · Ciudad</span>',
        '<a class="ccard" href="#mapa" id="contactAddressCard">\n        <span class="l">Visitanos</span>\n        <span class="v" id="contactAddressValue">Calle Ejemplo, 00 · Ciudad</span>',
    )
    body = body.replace(
        '<a href="#top" class="brand"><span class="bmark" aria-hidden="true">◆</span> Tu negocio</a>',
        '<a href="#top" class="brand"><span class="bmark" aria-hidden="true">◆</span> <span id="footBrand">Tu negocio</span></a>',
    )
    body = body.replace(
        '<p style="margin-top:1rem;color:rgba(253,236,194,.8);max-width:34ch;font-weight:600;">Frase corta sobre la filosofía del negocio: comida rica, rápida y hecha con ganas.</p>',
        '<p id="footTagline" style="margin-top:1rem;color:rgba(253,236,194,.8);max-width:34ch;font-weight:600;">Frase corta sobre la filosofía del negocio: comida rica, rápida y hecha con ganas.</p>',
    )
    body = body.replace(
        '<span>© <span id="year"></span> Tu negocio · Todos los derechos reservados</span>',
        '<span>© <span id="year"></span> <span id="footCopyName">Tu negocio</span> · Todos los derechos reservados · '
        '<span id="tpl-platform-branding">Creado con <a href="https://localweb.es" target="_blank" rel="noopener noreferrer">ONEZ</a></span></span>',
    )
    body = body.replace(
        '<a class="btn btn-ink" href="https://wa.me/" rel="noopener">',
        '<a class="btn btn-ink" href="https://wa.me/" data-wa-link rel="noopener">',
    )
    body = body.replace(
        '<a class="btn btn-cream" href="tel:+00000000000">Llamar ahora</a>',
        '<a class="btn btn-cream" href="tel:+00000000000" data-tel-link>Llamar ahora</a>',
    )
    body = re.sub(
        r'<li><a href="/cdn-cgi/l/email-protection[^"]*"><span class="__cf_email__"[^>]*>\[email[^<]*</span></a></li>',
        '<li><a href="mailto:hola@ejemplo.com" id="footEmailLink">hola@ejemplo.com</a></li>',
        body,
        count=1,
    )
    return body


def extract_orig_script(full: str) -> str:
    start = full.find("<script>\n(function(){\n  'use strict';")
    end = full.find("  /* ===== Leaflet ===== */")
    if start < 0 or end < 0:
        raise RuntimeError("Could not locate original UI script block")
    script = full[start:end] + "})();\n</script>\n"
    script = re.sub(
        r"  /\* ===== Servicios — STICKY STACK ===== \*/[\s\S]*?window\.addEventListener\('resize', layoutStack.*?\n  \}\n",
        "",
        script,
        count=1,
    )
    script = re.sub(
        r"  /\* ===== Horario \+ estado en vivo ===== \*/[\s\S]*?setInterval\(applyStatus, 60000\);\n",
        "",
        script,
        count=1,
    )
    script = script.replace(
        "    layoutStack();\n    window.addEventListener('resize', layoutStack, { passive: true });\n  }",
        "",
    )
    stack_layout = """
  /* ===== Sticky stack layout (ONEZ fills #stack) ===== */
  var stack = document.getElementById('stack');
  if (stack) {
    var REDUCED_STACK = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    function layoutStack() {
      var cards = [].slice.call(stack.querySelectorAll('.stack-card'));
      var mob = window.matchMedia('(max-width: 900px)').matches;
      cards.forEach(function (c, i) {
        if (REDUCED_STACK || mob) { c.style.top = ''; return; }
        c.style.top = (96 + i * 16) + 'px';
      });
    }
    window.kairosLayoutStack = layoutStack;
    layoutStack();
    window.addEventListener('resize', layoutStack, { passive: true });
  }
"""
    script = script.replace(
        "  /* ===== Reveal + pop (chequeo de viewport, robusto) ===== */",
        stack_layout + "\n  /* ===== Reveal + pop (chequeo de viewport, robusto) ===== */",
    )
    return script


def main() -> None:
    full = SRC.read_text(encoding="utf-8")
    src_lines = full.splitlines()
    css_block = "\n".join(src_lines[15:399])
    body = "\n".join(src_lines[400:723])
    body = patch_body(body)
    orig_script = extract_orig_script(full)

    out = f"""<!doctype html>
<!--
  Contrato LocalWeb: postMessage `lw:onboarding-preview` + `?parentOrigin=` en iframe.
-->
<html lang="es">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>{{{{nombre}}}} — Bold pop</title>
<meta name="description" content="Plantilla profesional bold pop para negocios fast-casual: hamburgueserías, pizzerías, tacos, poke y comida callejera de calidad." />
{RESPONSIVE_SAFETY}
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Lilita+One&family=Manrope:wght@500;600;700;800&family=Space+Mono:wght@700&display=swap" rel="stylesheet">
{LEAFLET_CSS_LOADER}
{css_block}
{INTEGRATION_CSS}
</head>
{body}
{LEAFLET_JS_LOADER}
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
