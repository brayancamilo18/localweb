/* ONEZ data bridge for wild-pet.html — preview, onboarding, tenant payload */
(function () {
  'use strict';

  (function initWildPreviewModeClasses() {
    var params = new URLSearchParams(window.location.search);
    if (params.get('embed') === '1' || window.self !== window.top) {
      document.documentElement.classList.add('embed-preview-root');
      document.body.classList.add('embed-preview');
    }
    if (params.get('preview') === '1' || params.get('thumb') === '1') {
      document.body.classList.add('wild-preview');
    }
  })();

  var WILD_SCHEDULE_DEFAULT = [
    { day: 'Lunes', open: '09:00', close: '20:00' },
    { day: 'Martes', open: '09:00', close: '20:00' },
    { day: 'Miércoles', open: '09:00', close: '20:00' },
    { day: 'Jueves', open: '09:00', close: '20:00' },
    { day: 'Viernes', open: '09:00', close: '20:00' },
    { day: 'Sábado', open: '10:00', close: '14:00' },
    { day: 'Domingo', open: null, close: null },
  ];
  var WILD_SCHEDULE = WILD_SCHEDULE_DEFAULT.map(function (r) {
    return { day: r.day, open: r.open, close: r.close };
  });

  var WILD_SERVICE_ICONS = {
    paw: '<svg viewBox="0 0 24 24" fill="currentColor" width="26" height="26"><circle cx="6" cy="10" r="2"/><circle cx="10" cy="6" r="2"/><circle cx="14" cy="6" r="2"/><circle cx="18" cy="10" r="2"/><path d="M12 11c-3 0-6 2.5-6 5.5 0 2 1.5 3.5 3.5 3.5.9 0 1.6-.4 2.5-.4s1.6.4 2.5.4c2 0 3.5-1.5 3.5-3.5 0-3-3-5.5-6-5.5z"/></svg>',
    heart:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" width="26" height="26"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z"/></svg>',
    sparkle:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" width="26" height="26"><path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8"/></svg>',
    bone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" width="26" height="26"><path d="M7 4a2.5 2.5 0 1 0-3 4 2.5 2.5 0 0 0 1 4l9 9a2.5 2.5 0 0 0 4-1 2.5 2.5 0 1 0-4-3l-7-7a2.5 2.5 0 0 0-3-4"/></svg>',
    home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" width="26" height="26"><path d="M3 10l9-7 9 7v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/></svg>',
    star: '<svg viewBox="0 0 24 24" fill="currentColor" width="26" height="26"><path d="M12 2l3 7h7l-5.5 4.5L18 22l-6-4.5L6 22l1.5-8.5L2 9h7z"/></svg>',
  };
  var WILD_ICON_KEYS = ['paw', 'heart', 'sparkle', 'bone', 'home', 'star'];

  /** Mascotas — muestras Unsplash para onboarding / preview (URLs verificadas, sin repetir entre slots) */
  var WILD_PREVIEW_SAMPLE = {
    portada: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?auto=format&fit=crop&w=1200&q=80',
    portada_2: 'https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=1000&q=80',
    portada_3: 'https://images.unsplash.com/photo-1574158622682-e40e69881006?auto=format&fit=crop&w=1000&q=80',
    foto_equipo: 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?auto=format&fit=crop&w=1000&q=80',
  };
  var WILD_DEFAULT_GALLERY_URLS = [
    'https://images.unsplash.com/photo-1450778869180-41d0601e046e?auto=format&fit=crop&w=900&q=75',
    'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=900&q=75',
    'https://images.unsplash.com/photo-1561037404-61cd46aa615b?auto=format&fit=crop&w=900&q=75',
    'https://images.unsplash.com/photo-1573865526739-10659fec78a5?auto=format&fit=crop&w=700&q=75',
    'https://images.unsplash.com/photo-1546527868-ccb7ee7dfa6a?auto=format&fit=crop&w=700&q=75',
    'https://images.unsplash.com/photo-1518791841217-8f162f1e1131?auto=format&fit=crop&w=700&q=75',
    'https://images.unsplash.com/photo-1526336024174-e58f5cdd8e13?auto=format&fit=crop&w=700&q=75',
  ];
  var WILD_PREVIEW_COPY = {
    tagline: 'Cuidamos a tu mascota con energía, cariño y mucha diversión.',
    descripcion:
      'Somos un equipo apasionado por los animales: peluquería canina, guardería y paseos con trato cercano y profesional.',
    ciudad: 'Madrid',
  };

  var wildPreviewMap = null;
  var wildPreviewMarker = null;
  var WILD_MAP_ZOOM = 15;
  var WILD_DEFAULT_MAP_LAT = 40.4168;
  var WILD_DEFAULT_MAP_LON = -3.7038;

  function resolveWildMapCoords(raw) {
    raw = raw || {};
    var lat = raw.map_lat != null ? raw.map_lat : window.__lwLat;
    var lon = raw.map_lon != null ? raw.map_lon : window.__lwLon;
    var latN = typeof lat === 'number' ? lat : parseFloat(lat);
    var lonN = typeof lon === 'number' ? lon : parseFloat(lon);
    if (!Number.isFinite(latN) || !Number.isFinite(lonN)) {
      latN = WILD_DEFAULT_MAP_LAT;
      lonN = WILD_DEFAULT_MAP_LON;
    }
    return { lat: latN, lon: lonN };
  }

  function whenWildLeafletReady(fn) {
    if (window.__LW_SKIP_LEAFLET) return;
    if (typeof lwWhenLeafletReady === 'function') {
      lwWhenLeafletReady(fn);
      return;
    }
    if (typeof L !== 'undefined') {
      fn();
      return;
    }
    var tries = 0;
    (function wait() {
      if (typeof L !== 'undefined') {
        fn();
        return;
      }
      if (++tries < 200) setTimeout(wait, 50);
    })();
  }

  function shouldUseWildSampleMedia() {
    return (
      document.body.classList.contains('embed-preview') ||
      document.body.classList.contains('wild-preview')
    );
  }

  function wildResolvePreviewPhotoSrc(userSrc, sampleKey) {
    var src = userSrc ? String(userSrc).trim() : '';
    if (src) return src;
    if (!shouldUseWildSampleMedia()) return '';
    return WILD_PREVIEW_SAMPLE[sampleKey] || '';
  }

  function escapeWildHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function escapeWildAttr(s) {
    return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
  }

  function formatWildPrice(p) {
    if (p === null || p === undefined || p === '') return 'Consultar';
    var n = typeof p === 'number' ? p : parseFloat(String(p).replace(',', '.'));
    if (!Number.isFinite(n)) return 'Consultar';
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
  }

  function wildDayIndex(jsDay) {
    return (jsDay + 6) % 7;
  }

  function syncWildScheduleFromPreview(h) {
    if (h == null || typeof h !== 'object') {
      WILD_SCHEDULE = WILD_SCHEDULE_DEFAULT.map(function (r) {
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
    WILD_SCHEDULE = map.map(function (t) {
      var row = h[t[0]];
      if (!row || row.closed) return { day: t[1], open: null, close: null };
      return { day: t[1], open: row.open || '09:00', close: row.close || '20:00' };
    });
  }

  function renderWildSchedule() {
    var schedEl = document.getElementById('schedule');
    if (!schedEl) return;
    var today = wildDayIndex(new Date().getDay());
    schedEl.innerHTML = WILD_SCHEDULE.map(function (row, i) {
      var closed = !row.open;
      return (
        '<div class="schedule-row ' +
        (i === today ? 'is-today' : '') +
        ' ' +
        (closed ? 'is-closed' : '') +
        '">' +
        '<span class="day">' +
        escapeWildHtml(row.day) +
        '</span>' +
        '<span class="hours num">' +
        (closed ? 'Cerrado' : escapeWildHtml(row.open + ' – ' + row.close)) +
        '</span></div>'
      );
    }).join('');
    applyWildOpenStatus();
  }

  function wildToMin(h) {
    var parts = h.split(':').map(Number);
    return parts[0] * 60 + (parts[1] || 0);
  }

  function applyWildOpenStatus() {
    var idx = wildDayIndex(new Date().getDay());
    var row = WILD_SCHEDULE[idx];
    var cur = new Date().getHours() * 60 + new Date().getMinutes();
    var open = false;
    var text = 'Cerrado hoy';
    var sub = 'Vuelve mañana o escríbenos.';
    if (row && row.open) {
      var o = wildToMin(row.open);
      var c = wildToMin(row.close);
      if (cur >= o && cur < c) {
        open = true;
        text = 'Abierto · cierra a las ' + row.close;
        sub = 'Pasa a vernos o reserva tu cita.';
      } else if (cur < o) {
        text = 'Abrimos a las ' + row.open;
        sub = 'Te atendemos en cuanto abramos.';
      } else {
        text = 'Cerrado por hoy';
        sub = 'Escríbenos, te atendemos mañana.';
      }
    }
    [['heroStatus', 'heroStatusLabel'], ['sideStatus', 'sideStatusLabel']].forEach(function (pair) {
      var pill = document.getElementById(pair[0]);
      var lbl = document.getElementById(pair[1]);
      if (!pill || !lbl) return;
      pill.classList.toggle('is-open', open);
      pill.classList.toggle('is-closed', !open);
      lbl.textContent = text;
    });
    var t = document.getElementById('sideStatusTitle');
    var x = document.getElementById('sideStatusText');
    if (t) t.textContent = open ? 'Estamos abiertos' : 'Ahora cerrado';
    if (x) x.textContent = sub;
  }

  function setWildPhotoSlot(slotId, imgId, src) {
    var slot = document.getElementById(slotId);
    var img = document.getElementById(imgId);
    if (!slot || !img) return;
    var s = src ? String(src).trim() : '';
    if (s) {
      img.style.backgroundImage = 'url("' + escapeWildAttr(s) + '")';
      slot.classList.add('has-photo');
    } else {
      if (!shouldUseWildSampleMedia() && slot.classList.contains('has-photo')) return;
      img.style.backgroundImage = '';
      slot.classList.remove('has-photo');
    }
  }

  function updateWildHeroPhotos(raw) {
    raw = raw || {};
    var hasP1 = Object.prototype.hasOwnProperty.call(raw, 'portada');
    var hasP2 = Object.prototype.hasOwnProperty.call(raw, 'portada_2');
    var hasP3 = Object.prototype.hasOwnProperty.call(raw, 'portada_3');
    if (!hasP1 && !hasP2 && !hasP3 && !shouldUseWildSampleMedia()) return;
    setWildPhotoSlot(
      'hp1',
      'hp1Img',
      hasP1 || shouldUseWildSampleMedia() ? wildResolvePreviewPhotoSrc(raw.portada, 'portada') : '',
    );
    setWildPhotoSlot(
      'hp2',
      'hp2Img',
      hasP2 || shouldUseWildSampleMedia() ? wildResolvePreviewPhotoSrc(raw.portada_2, 'portada_2') : '',
    );
    setWildPhotoSlot(
      'hp3',
      'hp3Img',
      hasP3 || shouldUseWildSampleMedia() ? wildResolvePreviewPhotoSrc(raw.portada_3, 'portada_3') : '',
    );
  }

  function setWildTeamPhotoSlot(wrap, img, src) {
    if (!wrap || !img) return;
    var s = src ? String(src).trim() : '';
    if (s) {
      img.style.backgroundImage = 'url("' + escapeWildAttr(s) + '")';
      wrap.classList.add('has-photo');
      img.classList.add('has-photo');
    } else {
      if (!shouldUseWildSampleMedia() && wrap.classList.contains('has-photo')) return;
      img.style.backgroundImage = '';
      wrap.classList.remove('has-photo');
      img.classList.remove('has-photo');
    }
  }

  function updateWildAboutPhoto(raw) {
    raw = raw || {};
    var hasFoto = Object.prototype.hasOwnProperty.call(raw, 'foto_equipo');
    var src =
      hasFoto || shouldUseWildSampleMedia()
        ? wildResolvePreviewPhotoSrc(raw.foto_equipo, 'foto_equipo')
        : '';
    setWildTeamPhotoSlot(document.getElementById('aboutPhotoWrap'), document.getElementById('aboutPhotoImg'), src);
    setWildTeamPhotoSlot(
      document.getElementById('finalCtaPhotoWrap'),
      document.getElementById('finalCtaPhotoImg'),
      src,
    );
  }

  function syncWildAboutContact(raw) {
    raw = raw || {};
    var phone = String(
      raw.whatsapp != null && String(raw.whatsapp).trim() !== ''
        ? raw.whatsapp
        : raw.telefono != null
          ? raw.telefono
          : '',
    ).trim();
    var email = String(raw.correo != null ? raw.correo : '').trim();
    var waLink = document.getElementById('aboutStatWhatsapp');
    var phoneVal = document.getElementById('aboutStatPhoneVal');
    if (waLink && phoneVal) {
      if (phone) {
        phoneVal.textContent = phone;
        var digits = phone.replace(/\D/g, '');
        waLink.href =
          raw.whatsapp != null && String(raw.whatsapp).trim() !== ''
            ? 'https://wa.me/' + digits
            : 'tel:+' + digits;
        waLink.hidden = false;
        waLink.removeAttribute('hidden');
      } else {
        waLink.hidden = true;
        phoneVal.textContent = '';
      }
    }
    var emailLink = document.getElementById('aboutStatEmail');
    var emailVal = document.getElementById('aboutStatEmailVal');
    if (emailLink && emailVal) {
      if (email) {
        emailVal.textContent = email;
        emailLink.href = 'mailto:' + email;
        emailLink.hidden = false;
        emailLink.removeAttribute('hidden');
      } else {
        emailLink.hidden = true;
        emailVal.textContent = '';
      }
    }
  }

  function renderWildGallery(urls) {
    var root = document.getElementById('galleryLive');
    var navGal = document.getElementById('tplNavGaleria');
    if (!root) return;
    var list = Array.isArray(urls) ? urls.filter(Boolean) : [];
    if (list.length === 0 && shouldUseWildSampleMedia()) {
      list = WILD_DEFAULT_GALLERY_URLS.slice();
    }
    if (list.length === 0) {
      if (!shouldUseWildSampleMedia() && root.children.length > 0) {
        if (navGal) navGal.style.display = '';
        return;
      }
      root.innerHTML = '';
      if (navGal) navGal.style.display = '';
      return;
    }
    if (navGal) navGal.style.display = '';
    root.innerHTML = list
      .map(function (src, i) {
        return (
          '<div class="g-item has-photo">' +
          '<img class="g-photo" src="' +
          escapeWildAttr(src) +
          '" alt="Foto ' +
          (i + 1) +
          '" loading="lazy" decoding="async">' +
          '</div>'
        );
      })
      .join('');
    if (typeof window.wildObserveReveals === 'function') {
      window.wildObserveReveals(root);
    }
  }

  function renderWildServices(services) {
    var sec = document.getElementById('servicios');
    var sg = document.getElementById('tplServicesList');
    var nav = document.getElementById('tplNavServicios');
    var navM = document.getElementById('tplNavServiciosMobile');
    if (!sg) return;
    var list = Array.isArray(services)
      ? services.filter(function (s) {
          return s && String(s.name || '').trim();
        })
      : [];
    if (list.length === 0) {
      if (sec) sec.style.display = 'none';
      sg.innerHTML = '';
      if (nav) nav.style.display = 'none';
      if (navM) navM.style.display = 'none';
      return;
    }
    if (sec) sec.style.display = '';
    if (nav) nav.style.display = '';
    if (navM) navM.style.display = '';
    sg.innerHTML = list
      .map(function (s, i) {
        var icon = WILD_ICON_KEYS[i % WILD_ICON_KEYS.length];
        return (
          '<article class="service">' +
          '<div class="service-icon" aria-hidden="true">' +
          (WILD_SERVICE_ICONS[icon] || WILD_SERVICE_ICONS.paw) +
          '</div>' +
          '<h3>' +
          escapeWildHtml(String(s.name || '')) +
          '</h3>' +
          '<p>' +
          escapeWildHtml(s.description && String(s.description).trim() ? String(s.description) : '') +
          '</p>' +
          '<div class="price"><small>Desde</small><strong class="num">' +
          escapeWildHtml(formatWildPrice(s.price)) +
          '</strong></div></article>'
        );
      })
      .join('');
    if (typeof window.wildObserveReveals === 'function') {
      window.wildObserveReveals(sg);
    }
  }

  function renderWildHeroTitle(name) {
    var h1 = document.getElementById('heroTitle');
    if (!h1) return;
    var text = (name || '').trim();
    if (!text) return;
    var words = text.split(/\s+/).filter(Boolean);
    if (words.length === 0) return;
    h1.innerHTML = words
      .map(function (w, i) {
        return '<span class="w w-' + (i + 1) + '">' + escapeWildHtml(w) + '</span>';
      })
      .join(' ');
    if (typeof window.wildObserveReveals === 'function') {
      window.wildObserveReveals(h1);
    }
  }

  function buildWildDirectionsUrl(raw) {
    raw = raw || {};
    var manual = (raw.google_maps_url || '').trim();
    if (manual) return manual;
    var coords = resolveWildMapCoords(raw);
    return (
      'https://www.google.com/maps/dir/?api=1&destination=' +
      encodeURIComponent(coords.lat + ',' + coords.lon)
    );
  }

  function destroyWildPreviewMap() {
    if (wildPreviewMap) {
      try {
        wildPreviewMap.remove();
      } catch (e) {}
      wildPreviewMap = null;
      wildPreviewMarker = null;
    }
  }

  function syncWildMapsLink(raw) {
    var row = document.getElementById('mapDirectionsRow');
    var link = document.getElementById('tplMapsExternalLink');
    if (!row || !link) return;
    var url = buildWildDirectionsUrl(raw);
    link.href = url;
    row.hidden = false;
    row.removeAttribute('hidden');
  }

  function updateWildPreviewMap(lat, lon, label) {
    var container = document.getElementById('map');
    if (!container || window.__LW_SKIP_LEAFLET) return;
    var coords = resolveWildMapCoords({ map_lat: lat, map_lon: lon });
    lat = coords.lat;
    lon = coords.lon;

    function applyMap() {
      if (window.__LW_SKIP_LEAFLET || typeof L === 'undefined') return;
      if (!wildPreviewMap) {
        wildPreviewMap = L.map(container, { scrollWheelZoom: false }).setView([lat, lon], WILD_MAP_ZOOM);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap',
          maxZoom: 19,
        }).addTo(wildPreviewMap);
      } else {
        wildPreviewMap.setView([lat, lon], WILD_MAP_ZOOM);
      }
      if (wildPreviewMarker) wildPreviewMap.removeLayer(wildPreviewMarker);
      var icon = L.divIcon({
        className: 'wild-marker',
        html:
          '<div style="width:42px;height:42px;border-radius:50%;background:#8b5cf6;color:#fff;display:grid;place-items:center;box-shadow:4px 4px 0 #1a1428;border:3px solid #1a1428;transform:rotate(-8deg);"><svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><circle cx="6" cy="10" r="2"/><circle cx="10" cy="6" r="2"/><circle cx="14" cy="6" r="2"/><circle cx="18" cy="10" r="2"/><path d="M12 11c-3 0-6 2.5-6 5.5 0 2 1.5 3.5 3.5 3.5.9 0 1.6-.4 2.5-.4s1.6.4 2.5.4c2 0 3.5-1.5 3.5-3.5 0-3-3-5.5-6-5.5z"/></svg></div>',
        iconSize: [42, 42],
        iconAnchor: [21, 21],
      });
      wildPreviewMarker = L.marker([lat, lon], { icon: icon, title: label || '' }).addTo(wildPreviewMap);
      wildPreviewMarker.bindPopup('<strong>' + escapeWildHtml(label || 'Tu negocio') + '</strong>');
      [80, 320, 900].forEach(function (ms) {
        setTimeout(function () {
          if (wildPreviewMap) wildPreviewMap.invalidateSize();
        }, ms);
      });
    }
    whenWildLeafletReady(function () {
      requestAnimationFrame(function () {
        requestAnimationFrame(applyMap);
      });
    });
  }

  window.updateWildPreviewMap = updateWildPreviewMap;

  function syncWildSocialRow(rowId, linkId, url) {
    var row = document.getElementById(rowId);
    var link = document.getElementById(linkId);
    if (!row || !link) return;
    url = String(url || '').trim();
    if (url) {
      link.href = url;
      row.hidden = false;
    } else {
      link.removeAttribute('href');
      row.hidden = true;
    }
  }

  function syncWildFooter(raw) {
    raw = raw || {};
    var phone = String(raw.telefono != null ? raw.telefono : '').trim();
    var email = String(raw.correo != null ? raw.correo : '').trim();
    var addr = String(raw.direccion || '').trim();
    var ciudad = String(raw.ciudad || '').trim();
    var addrLine = addr;
    if (addr && ciudad) addrLine = addr + ' · ' + ciudad;
    else if (ciudad) addrLine = ciudad;

    var footPhoneRow = document.getElementById('footPhoneRow');
    if (footPhoneRow) footPhoneRow.hidden = !phone;

    var footEmailRow = document.getElementById('footEmailRow');
    var footEmailLink = document.getElementById('footEmailLink');
    var footEmailDisplay = document.getElementById('footEmailDisplay');
    if (footEmailRow && footEmailLink && footEmailDisplay) {
      if (email) {
        footEmailLink.href = 'mailto:' + email;
        footEmailDisplay.textContent = email;
        footEmailRow.hidden = false;
      } else {
        footEmailRow.hidden = true;
      }
    }

    var footAddressRow = document.getElementById('footAddressRow');
    var footAddressLink = document.getElementById('footAddressLink');
    var footAddressText = document.getElementById('footAddressText');
    if (footAddressRow && footAddressLink && footAddressText) {
      if (addrLine) {
        footAddressText.textContent = addrLine;
        var dirUrl = buildWildDirectionsUrl(raw);
        if (dirUrl) {
          footAddressLink.href = dirUrl;
          footAddressLink.target = '_blank';
          footAddressLink.rel = 'noopener noreferrer';
        } else {
          footAddressLink.href = '#';
          footAddressLink.removeAttribute('target');
          footAddressLink.removeAttribute('rel');
        }
        footAddressRow.hidden = false;
      } else {
        footAddressRow.hidden = true;
      }
    }

    syncWildSocialRow('footSocialInstagramRow', 'tplSocialInstagram', raw.instagram_url);
    syncWildSocialRow('footSocialTiktokRow', 'tplSocialTiktok', raw.tiktok_url);
  }

  function syncWildTemplateExtensions(raw) {
    raw = raw || {};
    var isPro = raw.is_pro === true || raw.is_pro === 'true' || raw.is_pro === 1;
    var branding = document.getElementById('tpl-platform-branding');
    if (branding) branding.style.display = isPro ? 'none' : '';

    renderWildServices(raw.services);

    var galeria = Array.isArray(raw.galeria) ? raw.galeria.filter(Boolean) : [];
    renderWildGallery(galeria);

    var gUrl = (raw.google_business_url || '').trim();
    var gSec = document.getElementById('opiniones');
    var gLink = document.getElementById('tplGbizLink');
    var footGbiz = document.getElementById('footGbizLink');
    var footGbizRow = document.getElementById('footGbizRow');
    var navOp = document.getElementById('tplNavOpiniones');
    var navOpM = document.getElementById('tplNavOpinionesMobile');
    var footNavOp = document.getElementById('footNavOpiniones');
    if (gSec && gLink) {
      if (gUrl) {
        gSec.style.display = '';
        gLink.href = gUrl;
        if (navOp) navOp.style.display = '';
        if (navOpM) navOpM.style.display = '';
        if (footNavOp) footNavOp.style.display = '';
        if (footGbiz) footGbiz.href = gUrl;
        if (footGbizRow) footGbizRow.hidden = false;
      } else {
        gSec.style.display = 'none';
        gLink.removeAttribute('href');
        if (navOp) navOp.style.display = 'none';
        if (navOpM) navOpM.style.display = 'none';
        if (footNavOp) footNavOp.style.display = 'none';
        if (footGbiz) footGbiz.removeAttribute('href');
        if (footGbizRow) footGbizRow.hidden = true;
      }
    }

    var list = Array.isArray(raw.services)
      ? raw.services.filter(function (s) {
          return s && String(s.name || '').trim();
        })
      : [];
    var hasSvc = list.length > 0;
    ['tplNavServicios', 'tplNavServiciosMobile', 'footNavServicios'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.style.display = hasSvc ? '' : 'none';
    });

    var vcEnabled = raw.vcard_enabled === true || raw.vcard_enabled === 'true' || raw.vcard_enabled === 1;
    var vcUrl = (raw.vcard_download_url || '').trim();
    var vcWrap = document.getElementById('tplVcardWrap');
    var vcA = document.getElementById('tplVcardLink');
    if (vcWrap && vcA) {
      if (vcEnabled && vcUrl) {
        vcWrap.style.display = '';
        vcA.href = vcUrl;
      } else {
        vcWrap.style.display = 'none';
        vcA.removeAttribute('href');
      }
    }
  }

  function scrollEmbedPreviewToHash() {
    if (new URLSearchParams(window.location.search).get('embed') !== '1') return;
    var id = (window.location.hash || '').replace(/^#/, '');
    if (!id) return;
    function doScroll() {
      var el = document.getElementById(id);
      if (!el) return;
      var nav = document.querySelector('.nav-inner');
      var offset = nav ? Math.round(nav.getBoundingClientRect().height) + 20 : 20;
      var y = el.getBoundingClientRect().top + window.pageYOffset - offset;
      window.scrollTo({ top: Math.max(0, y), behavior: 'auto' });
    }
    requestAnimationFrame(function () {
      requestAnimationFrame(doScroll);
    });
    setTimeout(doScroll, 80);
    setTimeout(doScroll, 280);
  }

  function applyLivePreviewData(raw, opts) {
    opts = opts || {};
    raw = raw || {};

    var name = (raw.nombre || '').trim() || 'Tu negocio';
    var tagline = (raw.tagline || '').trim();
    var descripcion = (raw.descripcion || '').trim();
    var ciudad = (raw.ciudad || '').trim();
    var logoUrl = (raw.logo_url || '').trim();

    if (shouldUseWildSampleMedia()) {
      if (!tagline) tagline = WILD_PREVIEW_COPY.tagline;
      if (!descripcion) descripcion = WILD_PREVIEW_COPY.descripcion;
      if (!ciudad) ciudad = WILD_PREVIEW_COPY.ciudad;
    }

    document.title = name + ' — ONEZ';

    var navWrap = document.getElementById('navBrandWrap');
    var navLogo = document.getElementById('navBrandLogo');
    var navName = document.getElementById('navBrandName');
    var navMark = document.getElementById('navBrandMark');
    if (navWrap && navLogo && navName) {
      if (logoUrl) {
        navLogo.src = logoUrl;
        navLogo.alt = name;
        navLogo.hidden = false;
        navLogo.style.display = '';
        navWrap.classList.add('brand-has-img');
        navName.style.display = 'none';
        if (navMark) navMark.style.display = 'none';
      } else {
        navLogo.removeAttribute('src');
        navLogo.hidden = true;
        navLogo.style.display = 'none';
        navWrap.classList.remove('brand-has-img');
        navName.textContent = name;
        navName.style.display = '';
        if (navMark) navMark.style.display = '';
      }
    } else if (navName) {
      navName.textContent = name;
    }

    renderWildHeroTitle(name);

    var heroTag = document.getElementById('heroTagline');
    if (heroTag) heroTag.textContent = tagline;

    var aboutDesc = document.getElementById('aboutDescripcion');
    if (aboutDesc) aboutDesc.textContent = descripcion;

    var footBrand = document.getElementById('footBrand');
    if (footBrand) footBrand.textContent = name;
    var footTag = document.getElementById('footTagline');
    if (footTag) footTag.textContent = tagline || descripcion;
    var footBottom = document.getElementById('footBottomBrand');
    if (footBottom) {
      footBottom.textContent = '© ' + new Date().getFullYear() + ' · ' + name + ' · Todos los derechos reservados';
    }

    updateWildHeroPhotos(raw);
    updateWildAboutPhoto(raw);

    if (typeof lwApplyContactLinks === 'function') lwApplyContactLinks(raw);
    syncWildFooter(raw);
    syncWildAboutContact(raw);

    var phone = String(raw.telefono != null ? raw.telefono : '').trim();
    var email = String(raw.correo != null ? raw.correo : '').trim();
    var addr = String(raw.direccion || '').trim();
    var rowPhone = document.getElementById('tplContactPhone');
    var phoneVal = document.getElementById('tplContactPhoneVal');
    if (rowPhone) {
      if (phone) {
        if (phoneVal) phoneVal.textContent = phone;
        rowPhone.style.display = '';
      } else {
        rowPhone.style.display = 'none';
      }
    }
    var rowEmail = document.getElementById('tplContactEmail');
    var emailVal = document.getElementById('tplContactEmailVal');
    if (rowEmail && emailVal) {
      if (email) {
        rowEmail.href = 'mailto:' + email;
        emailVal.textContent = email;
        rowEmail.style.display = '';
      } else {
        rowEmail.style.display = 'none';
      }
    }
    var rowAddr = document.getElementById('tplContactAddress');
    var addrVal = document.getElementById('tplContactAddressVal');
    if (rowAddr && addrVal) {
      if (addr) {
        addrVal.textContent = addr;
        var mapsUrl = buildWildDirectionsUrl(raw);
        rowAddr.href = mapsUrl || '#';
        rowAddr.style.display = '';
      } else {
        rowAddr.style.display = 'none';
      }
    }

    var coords = resolveWildMapCoords(raw);
    updateWildPreviewMap(coords.lat, coords.lon, name);
    syncWildMapsLink(raw);

    syncWildScheduleFromPreview(raw.horario);
    renderWildSchedule();
    syncWildTemplateExtensions(raw);

    if (typeof window.tvAnimationsRefresh === 'function') {
      requestAnimationFrame(function () {
        window.tvAnimationsRefresh();
      });
    }

    if (opts.alignToHash) scrollEmbedPreviewToHash();
  }

  window.applyLivePreviewData = applyLivePreviewData;

  (function initWildPreviewSampleMedia() {
    if (!shouldUseWildSampleMedia()) return;
    function boot() {
      updateWildHeroPhotos({ portada: '', portada_2: '', portada_3: '' });
      updateWildAboutPhoto({ foto_equipo: '' });
      renderWildGallery([]);
      renderWildServices([]);
      syncWildScheduleFromPreview(null);
      renderWildSchedule();
      updateWildPreviewMap(WILD_DEFAULT_MAP_LAT, WILD_DEFAULT_MAP_LON, 'Tu negocio');
      syncWildMapsLink({});
      var heroTag = document.getElementById('heroTagline');
      if (heroTag && !heroTag.textContent.trim()) heroTag.textContent = WILD_PREVIEW_COPY.tagline;
      var aboutDesc = document.getElementById('aboutDescripcion');
      if (aboutDesc && !aboutDesc.textContent.trim()) aboutDesc.textContent = WILD_PREVIEW_COPY.descripcion;
    }
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', boot);
    } else {
      boot();
    }
  })();

  (function initLivePreviewFromQuery() {
    var params = new URLSearchParams(window.location.search);
    if (params.get('landingDemo') === '1') return;
    if (!params.has('preview')) {
      syncWildScheduleFromPreview(null);
      renderWildSchedule();
      if (shouldUseWildSampleMedia()) {
        updateWildHeroPhotos({ portada: '', portada_2: '', portada_3: '' });
        updateWildAboutPhoto({ foto_equipo: '' });
        renderWildGallery([]);
      }
      if (window.location.hash) scrollEmbedPreviewToHash();
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
      },
      { alignToHash: !!window.location.hash.replace(/^#/, '') },
    );
  })();

  (function initWildEmbedHashScroll() {
    var params = new URLSearchParams(window.location.search);
    if (params.get('embed') !== '1') return;
    if (!window.location.hash) return;
    function boot() {
      scrollEmbedPreviewToHash();
    }
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', boot);
    } else {
      boot();
    }
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
      applyLivePreviewData(data.payload || {}, { alignToHash: data.alignToHash === true });
    });
  })();

  if (!window.__LW_SKIP_LEAFLET) {
    var ls = document.createElement('script');
    ls.src = 'https://unpkg.com/leaflet@' + '1.9.4/dist/leaflet.js';
    ls.crossOrigin = '';
    document.head.appendChild(ls);
  }

  setInterval(applyWildOpenStatus, 60000);
})();
