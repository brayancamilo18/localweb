/**
 * Sección «Próximos eventos» — destacado editorial + agenda + carrusel.
 * SSR: #lw-events-data (JSON). Preview: postMessage lw:onboarding-preview.
 */
(function () {
  'use strict';

  var ICON_CALENDAR =
    '<svg class="lw-eventos__icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>';
  var ICON_PIN =
    '<svg class="lw-eventos__icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M12 21s7-4.5 7-11a7 7 0 1 0-14 0c0 6.5 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/></svg>';
  var ICON_CHEV_L =
    '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M15 18l-6-6 6-6"/></svg>';
  var ICON_CHEV_R =
    '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M9 18l6-6-6-6"/></svg>';

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function escapeIcs(value) {
    return String(value || '')
      .replace(/\\/g, '\\\\')
      .replace(/;/g, '\\;')
      .replace(/,/g, '\\,')
      .replace(/\r?\n/g, '\\n');
  }

  function isValidHex(color) {
    return typeof color === 'string' && /^#[0-9a-fA-F]{6}$/.test(color.trim());
  }

  function pad2(n) {
    return (n < 10 ? '0' : '') + n;
  }

  function startOfToday() {
    var now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }

  function normalizeEvents(data) {
    if (!data || !Array.isArray(data.events)) return [];
    var start = startOfToday();
    return data.events
      .filter(function (event) {
        if (!event || !event.event_date) return false;
        var date = new Date(event.event_date);
        return !isNaN(date.getTime()) && date >= start;
      })
      .sort(function (a, b) {
        return new Date(a.event_date).getTime() - new Date(b.event_date).getTime();
      });
  }

  function shouldShow(data) {
    if (!data || !data.events_enabled || !data.is_pro) return false;
    return normalizeEvents(data).length > 0;
  }

  function formatDateParts(iso) {
    var date = new Date(iso);
    if (isNaN(date.getTime())) {
      return { full: '', time: '', day: '', month: '', year: '' };
    }
    var monthRaw = date.toLocaleDateString('es-ES', { month: 'short' }).replace('.', '');
    return {
      full: new Intl.DateTimeFormat('es-ES', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(date),
      time: new Intl.DateTimeFormat('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
      }).format(date),
      day: pad2(date.getDate()),
      month: monthRaw.toUpperCase().slice(0, 3),
      year: String(date.getFullYear()),
    };
  }

  function toIcsLocalDateTime(iso) {
    var date = new Date(iso);
    if (isNaN(date.getTime())) return '';
    return (
      String(date.getFullYear()) +
      pad2(date.getMonth() + 1) +
      pad2(date.getDate()) +
      'T' +
      pad2(date.getHours()) +
      pad2(date.getMinutes()) +
      '00'
    );
  }

  function addHoursIso(iso, hours) {
    var date = new Date(iso);
    if (isNaN(date.getTime())) return iso;
    date.setHours(date.getHours() + hours);
    return date.toISOString();
  }

  function buildIcs(event) {
    var uid =
      'lw-' +
      String(event.id || event.title || 'event')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-') +
      '@localweb';
    var dtStart = toIcsLocalDateTime(event.event_date);
    var dtEnd = toIcsLocalDateTime(addHoursIso(event.event_date, 2));
    var lines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//LocalWeb//Events//ES',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      'UID:' + escapeIcs(uid),
      'DTSTAMP:' + toIcsLocalDateTime(new Date().toISOString()),
      'DTSTART;VALUE=DATE-TIME:' + dtStart,
      'DTEND;VALUE=DATE-TIME:' + dtEnd,
      'SUMMARY:' + escapeIcs(event.title || 'Evento'),
    ];
    if (event.description) lines.push('DESCRIPTION:' + escapeIcs(event.description));
    if (event.location) lines.push('LOCATION:' + escapeIcs(event.location));
    lines.push('END:VEVENT', 'END:VCALENDAR');
    return lines.join('\r\n');
  }

  function downloadIcs(event) {
    var blob = new Blob([buildIcs(event)], { type: 'text/calendar;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var link = document.createElement('a');
    link.href = url;
    link.download = 'evento.ics';
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    window.setTimeout(function () {
      URL.revokeObjectURL(url);
      link.remove();
    }, 400);
  }

  function ensureStylesheet() {
    if (document.getElementById('lw-events-css')) return;
    var link = document.createElement('link');
    link.id = 'lw-events-css';
    link.rel = 'stylesheet';
    link.href = '/templates/lw-events.css?v=7';
    document.head.appendChild(link);
  }

  function detectTemplateSlug(data) {
    if (data && data.template_slug) return String(data.template_slug);
    var m = window.location.pathname.match(/\/templates\/([^/.]+)/);
    return m ? m[1] : '';
  }

  var DEFAULT_THEME = {
    headVariant: 'default',
    btnClass: 'lw-eventos__ics-btn',
    featuredTitleClass: 'lw-eventos__featured-title',
    descClass: 'lw-eventos__desc',
    metaClass: 'lw-eventos__featured-meta lw-eventos__eyebrow',
    placeLabelClass: 'lw-eventos__featured-place-label lw-eventos__eyebrow',
    agendaTitleClass: 'lw-eventos__agenda-title',
    agendaEyebrowClass: 'eyebrow',
  };

  /** Cabecera, tipografía y botones por plantilla (18 templates). */
  var SLUG_THEMES = {
    'noir-elite': {
      headVariant: 'noir',
      btnClass: 'btn outline sm lw-eventos__ics-btn',
      featuredTitleClass: 'lw-eventos__featured-title noir-svc-name',
      descClass: 'lw-eventos__desc noir-svc-desc',
      metaClass: 'lw-eventos__featured-meta eyebrow',
      placeLabelClass: 'lw-eventos__featured-place-label eyebrow',
      agendaTitleClass: 'lw-eventos__agenda-title noir-svc-name',
    },
    'bloom-studio': {
      headVariant: 'bloom',
      btnClass: 'btn outline lw-eventos__ics-btn',
      featuredTitleClass: 'lw-eventos__featured-title bloom-svc-name',
      descClass: 'lw-eventos__desc bloom-svc-desc',
      metaClass: 'lw-eventos__featured-meta eyebrow-coral',
      placeLabelClass: 'lw-eventos__featured-place-label eyebrow-coral',
      agendaTitleClass: 'lw-eventos__agenda-title bloom-svc-name',
      agendaEyebrowClass: 'eyebrow-coral',
    },
    'urban-bold': {
      headVariant: 'urban',
      btnClass: 'btn btn-primary lw-eventos__ics-btn',
      featuredTitleClass: 'lw-eventos__featured-title display section-title',
      metaClass: 'lw-eventos__featured-meta mono',
      placeLabelClass: 'lw-eventos__featured-place-label mono',
      agendaTitleClass: 'lw-eventos__agenda-title display section-title',
    },
    'craft-pro': {
      headVariant: 'craft',
      btnClass: 'btn-p lw-eventos__ics-btn',
      featuredTitleClass: 'lw-eventos__featured-title cond',
      metaClass: 'lw-eventos__featured-meta eyebrow',
      placeLabelClass: 'lw-eventos__featured-place-label eyebrow',
      agendaTitleClass: 'lw-eventos__agenda-title cond',
    },
    'kairos-bold': {
      headVariant: 'kairos',
      btnClass: 'btn btn-orange lw-eventos__ics-btn',
      featuredTitleClass: 'lw-eventos__featured-title',
      metaClass: 'lw-eventos__featured-meta cap on-cream',
      placeLabelClass: 'lw-eventos__featured-place-label cap on-cream',
    },
    'la-republica-vintage': {
      headVariant: 'republica',
      btnClass: 'btn lw-eventos__ics-btn',
      featuredTitleClass: 'lw-eventos__featured-title',
      metaClass: 'lw-eventos__featured-meta eyebrow flank solo',
      placeLabelClass: 'lw-eventos__featured-place-label eyebrow',
    },
    'tavola-warm': {
      headVariant: 'tavola',
      btnClass: 'btn lw-eventos__ics-btn',
      featuredTitleClass: 'lw-eventos__featured-title display',
      metaClass: 'lw-eventos__featured-meta ornament',
      placeLabelClass: 'lw-eventos__featured-place-label eyebrow',
      agendaTitleClass: 'lw-eventos__agenda-title display',
    },
    'luxe-atelier': {
      headVariant: 'serif',
      btnClass: 'btn lw-eventos__ics-btn',
      featuredTitleClass: 'lw-eventos__featured-title serif',
      agendaTitleClass: 'lw-eventos__agenda-title serif',
    },
    'mono-edito': {
      headVariant: 'mono',
      btnClass: 'btn lw-eventos__ics-btn',
      featuredTitleClass: 'lw-eventos__featured-title serif',
      agendaTitleClass: 'lw-eventos__agenda-title serif',
    },
    'consult-prime': {
      headVariant: 'serif',
      btnClass: 'btn lw-eventos__ics-btn',
      featuredTitleClass: 'lw-eventos__featured-title serif',
      agendaTitleClass: 'lw-eventos__agenda-title serif',
    },
    'soft-organic': {
      headVariant: 'serif',
      btnClass: 'btn lw-eventos__ics-btn',
      featuredTitleClass: 'lw-eventos__featured-title serif',
      agendaTitleClass: 'lw-eventos__agenda-title serif',
    },
    'trust-clinic': {
      headVariant: 'trust',
      btnClass: 'btn lw-eventos__ics-btn',
      featuredTitleClass: 'lw-eventos__featured-title serif',
      agendaTitleClass: 'lw-eventos__agenda-title serif',
    },
    'handyman-pro': {
      headVariant: 'handyman',
      btnClass: 'btn lw-eventos__ics-btn',
      featuredTitleClass: 'lw-eventos__featured-title cond',
      agendaTitleClass: 'lw-eventos__agenda-title cond',
    },
    'versa-studio': {
      headVariant: 'versa',
      btnClass: 'btn lw-eventos__ics-btn',
      featuredTitleClass: 'lw-eventos__featured-title display',
      agendaTitleClass: 'lw-eventos__agenda-title display',
    },
    'tech-sleek': {
      headVariant: 'tech',
      btnClass: 'btn lw-eventos__ics-btn',
      featuredTitleClass: 'lw-eventos__featured-title',
      metaClass: 'lw-eventos__featured-meta eyebrow',
      placeLabelClass: 'lw-eventos__featured-place-label eyebrow',
    },
    'graphite-soft': {
      headVariant: 'graphite',
      btnClass: 'lw-eventos__ics-btn',
      featuredTitleClass: 'lw-eventos__featured-title serif',
      metaClass: 'lw-eventos__featured-meta sec-num',
      agendaTitleClass: 'lw-eventos__agenda-title serif',
    },
    'wild-pet': {
      headVariant: 'wild',
      btnClass: 'btn btn-primary lw-eventos__ics-btn',
      featuredTitleClass: 'lw-eventos__featured-title',
      metaClass: 'lw-eventos__featured-meta eyebrow',
      placeLabelClass: 'lw-eventos__featured-place-label eyebrow',
    },
    'coastal-calm': {
      headVariant: 'coastal',
      btnClass: 'btn lw-eventos__ics-btn',
      featuredTitleClass: 'lw-eventos__featured-title',
      metaClass: 'lw-eventos__featured-meta eyebrow',
      placeLabelClass: 'lw-eventos__featured-place-label eyebrow',
    },
  };

  function detectLayout(slug) {
    var layout = Object.assign({}, DEFAULT_THEME, SLUG_THEMES[slug] || {});
    var horario = document.getElementById('horario');

    if (document.querySelector('.wrap')) layout.wrap = 'wrap';
    else if (document.querySelector('.container-narrow')) layout.wrap = 'container-narrow';
    else if (document.querySelector('.container')) layout.wrap = 'container';
    else layout.wrap = 'lw-eventos__inner';

    if (!SLUG_THEMES[slug] && horario) {
      if (horario.querySelector('.h-line')) layout.headVariant = 'noir';
      else if (horario.querySelector('.section-num')) layout.headVariant = 'urban';
      else if (horario.querySelector('.eyebrow-coral')) layout.headVariant = 'bloom';
      else if (horario.querySelector('.cap')) layout.headVariant = 'kairos';
      else if (horario.querySelector('.ornament')) layout.headVariant = 'tavola';
      else if (horario.querySelector('.flank')) layout.headVariant = 'republica';
      else if (horario.querySelector('.sec-num')) layout.headVariant = 'graphite';
      else if (horario.querySelector('.section-head .serif')) layout.headVariant = 'serif';
      else if (horario.querySelector('.section-head')) layout.headVariant = 'generic';
    }

    if (layout.btnClass === 'lw-eventos__ics-btn') {
      if (document.querySelector('.btn.outline')) layout.btnClass = 'btn outline sm lw-eventos__ics-btn';
      else if (document.querySelector('.btn-p')) layout.btnClass = 'btn-p lw-eventos__ics-btn';
      else if (document.querySelector('.btn.btn-primary')) layout.btnClass = 'btn btn-primary lw-eventos__ics-btn';
      else if (document.querySelector('.btn.btn-ghost')) layout.btnClass = 'btn btn-ghost lw-eventos__ics-btn';
      else if (document.querySelector('.btn.btn-orange')) layout.btnClass = 'btn btn-orange lw-eventos__ics-btn';
    }

    return layout;
  }

  function buildSectionHead(layout, count) {
    var countHtml =
      count > 1
        ? '<div class="lw-eventos__count reveal-up delay-2">' +
          '<span class="lw-eventos__count-num">' +
          pad2(count) +
          '</span>' +
          '<span class="lw-eventos__count-label">eventos<br/>programados</span>' +
          '</div>'
        : '';

    switch (layout.headVariant) {
      case 'noir':
        return (
          '<div class="lw-eventos__hero-head">' +
          '<div class="section-head">' +
          '<div class="h-line short reveal-up"></div>' +
          '<span class="eyebrow reveal-up delay-1">— Eventos</span>' +
          '<h2 id="lw-eventos-title" class="section-title reveal-up delay-1">Próximos <em>eventos</em></h2>' +
          '</div>' +
          countHtml +
          '</div>'
        );
      case 'urban':
        return (
          '<div class="lw-eventos__hero-head">' +
          '<div class="section-head"><div>' +
          '<span class="section-num">[ Eventos ]</span>' +
          '<h2 id="lw-eventos-title" class="display section-title">Próximos<br/>eventos.</h2>' +
          '</div></div>' +
          countHtml +
          '</div>'
        );
      case 'bloom':
        return (
          '<div class="sched-head">' +
          '<span class="eyebrow-coral r-up">Eventos</span>' +
          '<h2 id="lw-eventos-title" class="r-up d-1">Próximos <em>eventos</em>.</h2>' +
          '</div>'
        );
      case 'craft':
        return (
          '<div class="section-head">' +
          '<div><span class="eyebrow">Eventos</span>' +
          '<h2 id="lw-eventos-title" class="cond">Próximos<br/><span>eventos.</span></h2></div>' +
          '</div>'
        );
      case 'kairos':
        return (
          '<div class="section-head center reveal">' +
          '<span class="cap on-cream">★ Eventos</span>' +
          '<h2 id="lw-eventos-title">Próximos eventos</h2>' +
          '</div>'
        );
      case 'tavola':
        return (
          '<div class="section-head">' +
          '<div class="ornament">próximos eventos</div>' +
          '<h2 id="lw-eventos-title" class="display">Lo que <em>viene</em>.</h2>' +
          '</div>'
        );
      case 'republica':
        return (
          '<div class="section-head reveal">' +
          '<span class="eyebrow flank solo">Eventos</span>' +
          '<h2 id="lw-eventos-title">Próximos eventos</h2>' +
          '</div>'
        );
      case 'serif':
        return (
          '<div class="section-head slide-up">' +
          '<div><span class="eyebrow">Eventos</span>' +
          '<h2 id="lw-eventos-title" class="serif">Próximos<br/><em>eventos.</em></h2></div>' +
          '</div>'
        );
      case 'trust':
        return (
          '<div class="section-head">' +
          '<div><span class="eyebrow"><span class="rule"></span>Eventos</span>' +
          '<h2 id="lw-eventos-title" class="serif">Próximos <em>eventos.</em></h2></div>' +
          '</div>'
        );
      case 'handyman':
        return (
          '<div class="section-head reveal-up">' +
          '<div><span class="eyebrow">Eventos</span>' +
          '<h2 id="lw-eventos-title" class="cond">Próximos<br/><span>eventos.</span></h2></div>' +
          '</div>'
        );
      case 'versa':
        return (
          '<div class="section-head slide-up">' +
          '<div><span class="eyebrow">Eventos</span>' +
          '<h2 id="lw-eventos-title" class="display">Próximos<br/><em>eventos.</em></h2></div>' +
          '</div>'
        );
      case 'mono':
        return (
          '<div class="section-head slide-up">' +
          '<div><span class="eyebrow">Eventos</span>' +
          '<h2 id="lw-eventos-title" class="serif">Próximos<br/><em>eventos.</em></h2></div>' +
          '</div>'
        );
      case 'graphite':
        return (
          '<div class="lw-eventos__graphite-head">' +
          '<span class="sec-num">N° — Eventos</span>' +
          '<h2 id="lw-eventos-title" class="serif h-section" style="margin:14px 0 32px">Próximos <em>eventos.</em></h2>' +
          '</div>'
        );
      case 'tech':
        return (
          '<div class="section-head">' +
          '<div><span class="eyebrow">Agenda</span>' +
          '<h2 id="lw-eventos-title">Próximos<br/><span>eventos.</span></h2></div>' +
          '</div>'
        );
      case 'wild':
        return (
          '<div class="section-head sr">' +
          '<span class="eyebrow">Eventos</span>' +
          '<h2 id="lw-eventos-title">Próximos eventos</h2>' +
          '</div>'
        );
      case 'coastal':
        return (
          '<div class="lw-eventos__coastal-head">' +
          '<span class="eyebrow">Eventos</span>' +
          '<h2 id="lw-eventos-title">Próximos eventos</h2>' +
          '</div>'
        );
      case 'generic':
        return (
          '<div class="section-head">' +
          '<span class="eyebrow">Eventos</span>' +
          '<h2 id="lw-eventos-title" class="section-title">Próximos eventos</h2>' +
          '</div>'
        );
      default:
        return (
          '<header class="lw-eventos__head">' +
          '<span class="lw-eventos__eyebrow">Eventos</span>' +
          '<h2 id="lw-eventos-title" class="lw-eventos__title">Próximos eventos</h2>' +
          '</header>'
        );
    }
  }

  function buildFeaturedPanel(event, layout, index) {
    var parts = formatDateParts(event.event_date);
    var hasImage = Boolean(event.image_url);
    var html = '<div class="lw-eventos__featured-panel" data-featured-index="' + index + '">';
    html += '<div class="lw-eventos__featured-grid">';

    html += '<figure class="lw-eventos__featured-media">';
    if (hasImage) {
      html +=
        '<div class="lw-eventos__featured-img-wrap">' +
        '<img src="' +
        escapeHtml(event.image_url) +
        '" alt="' +
        escapeHtml(event.title || 'Evento') +
        '" width="640" height="800" loading="lazy" decoding="async" />' +
        '<div class="lw-eventos__featured-img-veil" aria-hidden="true"></div>' +
        '<div class="lw-eventos__date-badge" aria-hidden="true">' +
        '<span class="lw-eventos__date-badge-day">' +
        escapeHtml(parts.day) +
        '</span>' +
        '<span class="lw-eventos__date-badge-meta">' +
        escapeHtml(parts.month) +
        ' · ' +
        escapeHtml(parts.year) +
        '</span>' +
        '</div></div>';
    } else {
      html +=
        '<div class="lw-eventos__featured-img-wrap lw-eventos__featured-img-wrap--empty" aria-hidden="true">' +
        '<span class="lw-eventos__date-badge-day">' +
        escapeHtml(parts.day) +
        '</span>' +
        '<span class="lw-eventos__date-badge-meta">' +
        escapeHtml(parts.month) +
        ' · ' +
        escapeHtml(parts.year) +
        '</span></div>';
    }
    html += '</figure>';

    html += '<article class="lw-eventos__featured-body">';
    html +=
      '<div class="' +
      layout.metaClass +
      '">' +
      ICON_CALENDAR +
      '<span>' +
      escapeHtml(parts.full) +
      ' · ' +
      escapeHtml(parts.time) +
      '</span></div>';
    html +=
      '<h3 class="' +
      layout.featuredTitleClass +
      '">' +
      escapeHtml(event.title || 'Evento') +
      '</h3>';
    if (event.description) {
      html +=
        '<p class="' +
        layout.descClass +
        ' lw-eventos__featured-desc">' +
        escapeHtml(event.description) +
        '</p>';
    }
    if (event.location) {
      html +=
        '<div class="lw-eventos__featured-place">' +
        '<span class="' +
        layout.placeLabelClass +
        '">Lugar</span>' +
        '<p class="lw-eventos__featured-place-text">' +
        ICON_PIN +
        '<span>' +
        escapeHtml(event.location) +
        '</span></p></div>';
    }
    html +=
      '<button type="button" class="' +
      layout.btnClass +
      '" data-ics-index="' +
      index +
      '">Guardar en calendario</button>';
    html += '</article></div></div>';
    return html;
  }

  function buildAgendaList(events, activeIndex, layout) {
    var html = '<div class="lw-eventos__agenda">';
    html += '<div class="lw-eventos__agenda-head">';
    html += '<span class="' + (layout.agendaEyebrowClass || 'eyebrow') + '">Agenda completa</span>';
    html += '</div><ul class="lw-eventos__agenda-list">';
    events.forEach(function (event, index) {
      var parts = formatDateParts(event.event_date);
      var isActive = index === activeIndex;
      html +=
        '<li><button type="button" class="lw-eventos__agenda-item' +
        (isActive ? ' is-active' : '') +
        '" data-agenda-index="' +
        index +
        '" aria-pressed="' +
        (isActive ? 'true' : 'false') +
        '">';
      html += '<span class="lw-eventos__agenda-idx">' + pad2(index + 1) + '</span>';
      html += '<span class="lw-eventos__agenda-when">';
      html +=
        '<span class="lw-eventos__agenda-date">' +
        escapeHtml(parts.day + ' ' + parts.month) +
        ' · ' +
        escapeHtml(parts.time) +
        '</span></span>';
      html +=
        '<span class="' +
        (layout.agendaTitleClass || 'lw-eventos__agenda-title') +
        '">' +
        escapeHtml(event.title || 'Evento') +
        '</span>';
      html +=
        '<span class="lw-eventos__agenda-venue">' +
        escapeHtml(event.location || '') +
        '</span>';
      html += '<span class="lw-eventos__agenda-arrow" aria-hidden="true">→</span>';
      html += '</button></li>';
    });
    html += '</ul></div>';
    return html;
  }

  function bindSection(section, state) {
    function setActive(nextIndex) {
      var total = state.events.length;
      if (total === 0) return;
      state.active = ((nextIndex % total) + total) % total;

      var stage = section.querySelector('.lw-eventos__featured-stage');
      if (stage) {
        stage.innerHTML = buildFeaturedPanel(state.events[state.active], state.layout, state.active);
        bindIcsButtons(stage, state.events);
      }

      section.querySelectorAll('.lw-eventos__agenda-item').forEach(function (btn) {
        var idx = parseInt(btn.getAttribute('data-agenda-index') || '', 10);
        var on = idx === state.active;
        btn.classList.toggle('is-active', on);
        btn.setAttribute('aria-pressed', on ? 'true' : 'false');
      });

      var counter = section.querySelector('.lw-eventos__carousel-counter');
      if (counter) {
        counter.textContent = pad2(state.active + 1) + ' / ' + pad2(total);
      }
    }

    section.querySelectorAll('[data-carousel-prev]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        setActive(state.active - 1);
      });
    });
    section.querySelectorAll('[data-carousel-next]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        setActive(state.active + 1);
      });
    });
    section.querySelectorAll('.lw-eventos__agenda-item').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var idx = parseInt(btn.getAttribute('data-agenda-index') || '', 10);
        if (!isNaN(idx)) setActive(idx);
      });
    });

    bindIcsButtons(section, state.events);
  }

  function bindIcsButtons(root, events) {
    root.querySelectorAll('[data-ics-index]').forEach(function (button) {
      button.addEventListener('click', function () {
        var idx = parseInt(button.getAttribute('data-ics-index') || '', 10);
        if (!isNaN(idx) && events[idx]) downloadIcs(events[idx]);
      });
    });
  }

  function findInsertPoint() {
    return (
      document.getElementById('horario') ||
      document.querySelector('footer#contacto') ||
      document.getElementById('contacto') ||
      null
    );
  }

  function hideSection() {
    var section = document.getElementById('lw-eventos');
    if (section) section.remove();
  }

  function renderSection(events, data) {
    var slug = detectTemplateSlug(data);
    var layout = detectLayout(slug);
    var section = document.getElementById('lw-eventos');
    var isNew = !section;
    var multi = events.length > 1;

    if (isNew) {
      section = document.createElement('section');
      section.id = 'lw-eventos';
      section.setAttribute('aria-labelledby', 'lw-eventos-title');
    }

    section.className = 'lw-eventos' + (slug ? ' lw-eventos--' + slug : '');

    if (isValidHex(data && data.brand_color)) {
      section.style.setProperty('--lw-ev-accent', data.brand_color.trim());
    }

    var html = '<div class="' + layout.wrap + '">';
    html += buildSectionHead(layout, events.length);
    html += '<div class="lw-eventos__featured">';
    html += '<div class="lw-eventos__featured-stage">';
    html += buildFeaturedPanel(events[0], layout, 0);
    html += '</div>';

    if (multi) {
      html += '<div class="lw-eventos__carousel-nav">';
      html +=
        '<div class="lw-eventos__carousel-buttons">' +
        '<button type="button" class="lw-eventos__carousel-btn" data-carousel-prev aria-label="Evento anterior">' +
        ICON_CHEV_L +
        '</button>' +
        '<button type="button" class="lw-eventos__carousel-btn" data-carousel-next aria-label="Evento siguiente">' +
        ICON_CHEV_R +
        '</button></div>';
      html +=
        '<span class="lw-eventos__carousel-counter eyebrow">' +
        pad2(1) +
        ' / ' +
        pad2(events.length) +
        '</span>';
      html += '</div>';
    }

    html += '</div>';

    if (multi) {
      html += buildAgendaList(events, 0, layout);
    }

    html += '</div>';
    section.innerHTML = html;

    if (isNew) {
      var anchor = findInsertPoint();
      if (anchor && anchor.parentNode) {
        anchor.parentNode.insertBefore(section, anchor);
      } else {
        document.body.appendChild(section);
      }
    }

    var state = { events: events, layout: layout, active: 0 };
    bindSection(section, state);

    if (typeof window.IntersectionObserver !== 'undefined') {
      var revealRoot = section.querySelector('.section-head, .lw-eventos__head');
      if (revealRoot) {
        var obs = new IntersectionObserver(
          function (entries) {
            entries.forEach(function (entry) {
              if (!entry.isIntersecting) return;
              entry.target.classList.add('reveal');
              obs.unobserve(entry.target);
            });
          },
          { threshold: 0.12 }
        );
        obs.observe(revealRoot);
      }
    }
  }

  function lwRenderEvents(data) {
    ensureStylesheet();
    if (!shouldShow(data)) {
      hideSection();
      return;
    }
    renderSection(normalizeEvents(data), data || {});
  }

  window.lwRenderEvents = lwRenderEvents;

  function initFromScriptTag() {
    var el = document.getElementById('lw-events-data');
    if (!el || !el.textContent) return;
    try {
      lwRenderEvents(JSON.parse(el.textContent));
    } catch (err) {
      /* JSON inválido */
    }
  }

  function isAllowedPreviewOrigin(origin) {
    var queryOrigin = new URLSearchParams(window.location.search).get('parentOrigin') || '';
    if (queryOrigin) return origin === queryOrigin;
    var devOrigins = [
      'http://localhost',
      'http://localhost:5173',
      'http://localhost:4173',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:4173',
    ];
    return devOrigins.indexOf(origin) !== -1;
  }

  window.addEventListener('message', function (event) {
    if (!isAllowedPreviewOrigin(event.origin)) return;
    var data = event.data;
    if (!data || data.type !== 'lw:onboarding-preview') return;
    lwRenderEvents(data.payload || {});
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initFromScriptTag);
  } else {
    initFromScriptTag();
  }
})();
