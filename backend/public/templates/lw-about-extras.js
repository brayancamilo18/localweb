/**
 * Bloques extra «Sobre nosotros» (Pro) — todas las plantillas HTML/Blade.
 * Requiere #aboutExtraBlocks (o lo crea dentro de la sección about).
 */
(function (global) {
  'use strict';

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function escapeAttr(s) {
    return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
  }

  function findAboutSection() {
    return (
      document.getElementById('sobre-nosotros') ||
      document.getElementById('nosotros') ||
      document.querySelector('section.about[id]') ||
      document.getElementById('about')
    );
  }

  function aboutExtraTextFirst(index, mainTextFirst) {
    return (index + (mainTextFirst ? 1 : 0)) % 2 === 0;
  }

  function isMainAboutTextFirst(wrap) {
    if (global.lwAboutExtrasMainTextFirst === true) return true;
    if (!wrap) return false;
    return wrap.getAttribute('data-main-text-first') === '1';
  }

  function defaultWrapClassName() {
    var slug = slugFromPath() || String(global.__lwAboutExtrasTemplate || '').trim();
    if (slug && WRAP_CLASS_SLUG) {
      var keys = Object.keys(WRAP_CLASS_SLUG);
      for (var i = 0; i < keys.length; i++) {
        if (WRAP_CLASS_SLUG[keys[i]] === slug) return keys[i];
      }
    }
    return 'lw-about-extras-root';
  }

  function ensureContainer() {
    var wrap = document.getElementById('aboutExtraBlocks');
    if (wrap) return wrap;
    var section = findAboutSection();
    if (!section) return null;
    wrap = document.createElement('div');
    wrap.id = 'aboutExtraBlocks';
    wrap.className = defaultWrapClassName();
    if (SLUG_MAIN_TEXT_FIRST[slugFromPath()]) wrap.setAttribute('data-main-text-first', '1');
    section.appendChild(wrap);
    return wrap;
  }

  function pageSupportsRevealIn() {
    var styles = document.querySelectorAll('style');
    for (var i = 0; i < styles.length; i++) {
      var t = styles[i].textContent || '';
      if (/\.reveal\.in\b/.test(t) || (/\.reveal\s*\{/.test(t) && /opacity:\s*0/.test(t))) return true;
    }
    return false;
  }

  function revealSuffix() {
    return pageSupportsRevealIn() ? ' reveal' : '';
  }

  function stripNestedDataAnimConflicts() {
    var sel =
      '#aboutExtraBlocks .lw-about-extra__desc, #aboutExtraBlocks .lw-about-extra__title, #aboutExtraBlocks .lw-about-extra__kicker, #aboutExtraBlocks .craft-about-extra__desc, #aboutExtraBlocks .craft-about-extra__title, #aboutExtraBlocks .urban-about-extra__desc, #aboutExtraBlocks .urban-about-extra__title';
    document.querySelectorAll(sel).forEach(function (el) {
      var p = el.parentElement;
      while (p && p.id !== 'aboutExtraBlocks') {
        if (p.hasAttribute('data-anim')) {
          el.removeAttribute('data-anim');
          el.style.removeProperty('--anim-d');
          el.classList.add('in-view');
          break;
        }
        p = p.parentElement;
      }
    });
  }

  function prepareTvAboutExtras() {
    if (typeof global.tvAnimationsRefresh !== 'function') return;
    var hasTvReveal = false;
    document.querySelectorAll('style').forEach(function (s) {
      if ((s.textContent || '').indexOf('.tv-reveal') >= 0) hasTvReveal = true;
    });
    if (!hasTvReveal) return;

    var tvBlocks = document.querySelectorAll(
      '#aboutExtraBlocks .lw-about-extra, #aboutExtraBlocks .urban-about-extra, #aboutExtraBlocks .trust-about-extra, #aboutExtraBlocks .sleek-about-extra, #aboutExtraBlocks .tavola-about-extra',
    );
    tvBlocks.forEach(function (block) {
      var textFirst = /--text-first\b/.test(block.className);
      if (block.classList.contains('tavola-about-extra')) {
        var tContent = block.querySelector('.story-content');
        var tPhoto = block.querySelector('.tavola-about-extra__photo, .story-img');
        if (tPhoto && !tPhoto.classList.contains('tv-reveal')) {
          tPhoto.classList.add('tv-reveal', 'tv-img-reveal');
          tPhoto.setAttribute('data-anim', textFirst ? 'right' : 'left');
        }
        if (tContent) {
          tContent.querySelectorAll('.ornament, p, h3').forEach(function (el) {
            if (!el.classList.contains('tv-reveal')) {
              el.classList.add('tv-reveal');
              el.setAttribute('data-anim', el.tagName === 'H3' ? 'blur' : 'up');
            }
          });
        }
        return;
      }
      var body =
        block.querySelector('.lw-about-extra__body') ||
        block.querySelector('.urban-about-extra__copy') ||
        block.querySelector('.trust-content') ||
        block.querySelector('.sleek-about-extra .about-text, .about-text');
      var fig =
        block.querySelector('.lw-about-extra__figure') ||
        block.querySelector('.urban-about-extra__media') ||
        block.querySelector('.trust-about-extra__photo, .trust-img') ||
        block.querySelector('.about-photo-col');
      var photo =
        block.querySelector('.lw-about-extra__photo') ||
        block.querySelector('.urban-about-extra__img') ||
        block.querySelector('.trust-about-extra__photo, .trust-img') ||
        block.querySelector('.about-photo');
      if (body && !body.classList.contains('tv-reveal')) {
        body.classList.add('tv-reveal');
        body.setAttribute('data-anim', textFirst ? 'left' : 'right');
      }
      if (fig && !fig.classList.contains('tv-reveal')) {
        fig.classList.add('tv-reveal');
        fig.setAttribute('data-anim', textFirst ? 'right' : 'left');
      }
      if (photo && !photo.classList.contains('tv-img-reveal')) {
        photo.classList.add('tv-img-reveal', 'tv-reveal');
        photo.setAttribute('data-anim', textFirst ? 'clip' : 'clipR');
      }
    });
  }

  var WRAP_CLASS_SLUG = {
    'coastal-about-extras': 'coastal-calm',
    'tavola-about-extras': 'tavola-warm',
    'mono-about-extras': 'mono-edito',
    'graphite-about-extras': 'graphite-soft',
    'wild-about-extras': 'wild-pet',
    'kairos-about-extras': 'kairos-bold',
    'versa-about-extras': 'versa-studio',
    'luxe-about-extras': 'luxe-atelier',
    'sleek-about-extras': 'tech-sleek',
    'trust-about-extras': 'trust-clinic',
    'craft-about-extras': 'craft-pro',
    'urban-about-extras': 'urban-bold',
    'noir-about-extras': 'noir-elite',
    'bloom-about-extras': 'bloom-studio',
    'rep-about-extras': 'la-republica-vintage',
  };

  var SLUG_MAIN_TEXT_FIRST = {
    'graphite-soft': true,
    'mono-edito': true,
    'tech-sleek': true,
  };

  function slugFromWrap(wrap) {
    if (!wrap || !wrap.className) return '';
    var parts = wrap.className.split(/\s+/);
    for (var i = 0; i < parts.length; i++) {
      if (WRAP_CLASS_SLUG[parts[i]]) return WRAP_CLASS_SLUG[parts[i]];
    }
    return '';
  }

  function slugFromPath() {
    var m = (location.pathname || '').match(/\/([^/]+)\.html$/);
    return m ? m[1] : '';
  }

  function renderTemplateAboutExtras(wrapClass, mainTextFirst, buildArticle) {
    return function (sections) {
      var wrap = document.getElementById('aboutExtraBlocks') || ensureContainer();
      if (!wrap) return;
      wrap.className = wrapClass;
      if (mainTextFirst) wrap.setAttribute('data-main-text-first', '1');
      else wrap.removeAttribute('data-main-text-first');
      var list = Array.isArray(sections) ? sections.filter(function (s) { return s != null; }) : [];
      if (list.length === 0) {
        wrap.innerHTML = '';
        return;
      }
      var mainTF = isMainAboutTextFirst(wrap);
      wrap.innerHTML = list
        .map(function (sec, i) {
          return buildArticle(sec, i, aboutExtraTextFirst(i, mainTF));
        })
        .join('');
      refreshReveal();
    };
  }

  var TEMPLATE_ABOUT_RENDERERS = {
    'coastal-calm': renderTemplateAboutExtras('coastal-about-extras', false, function (sec, i, textFirst) {
      var title = escapeHtml(String(sec.title || '').trim());
      var desc = escapeHtml(String(sec.description || '').trim());
      var img = String(sec.image_url || '').trim();
      var mod = textFirst ? 'coastal-about-extra--text-first' : 'coastal-about-extra--photo-first';
      var bn = String(i + 3).padStart(2, '0');
      var bg = img ? ' style="background-image:url(\'' + escapeAttr(img) + '\')"' : '';
      return (
        '<article class="coastal-about-extra about-inner ' +
        mod +
        '"><div class="about-photo-wrap slide-up"><div class="about-photo-main coastal-about-extra__photo' +
        (img ? ' has-photo' : '') +
        '"' +
        bg +
        ' role="img" aria-label=""></div></div><div class="about-text slide-up" data-d="1"><span class="eyebrow">Bloque ' +
        bn +
        '</span>' +
        (title ? '<h3 class="serif">' + title + '</h3>' : '') +
        (desc ? '<p>' + desc + '</p>' : '') +
        '</div></article>'
      );
    }),
    'tavola-warm': renderTemplateAboutExtras('tavola-about-extras', false, function (sec, i, textFirst) {
      var title = escapeHtml(String(sec.title || '').trim());
      var desc = escapeHtml(String(sec.description || '').trim());
      var img = String(sec.image_url || '').trim();
      var mod = textFirst ? 'tavola-about-extra--text-first' : 'tavola-about-extra--photo-first';
      var bn = String(i + 3).padStart(2, '0');
      var bg = img ? ' style="background-image:url(\'' + escapeAttr(img) + '\')"' : '';
      return (
        '<article class="tavola-about-extra story-grid ' +
        mod +
        '"><div class="story-img tavola-about-extra__photo' +
        (img ? ' has-photo' : '') +
        '"' +
        bg +
        '></div><div class="story-content"><div class="ornament">capítulo ' +
        bn +
        '</div>' +
        (title ? '<h3 class="display">' + title + '</h3>' : '') +
        (desc ? '<p>' + desc + '</p>' : '') +
        '</div></article>'
      );
    }),
    'mono-edito': renderTemplateAboutExtras('mono-about-extras', true, function (sec, i, textFirst) {
      var title = escapeHtml(String(sec.title || '').trim());
      var desc = escapeHtml(String(sec.description || '').trim());
      var img = String(sec.image_url || '').trim();
      var mod = textFirst ? 'mono-about-extra--text-first' : 'mono-about-extra--photo-first';
      var bn = String(i + 3).padStart(2, '0');
      var bg = img ? ' style="background-image:url(\'' + escapeAttr(img) + '\')"' : '';
      return (
        '<article class="mono-about-extra about-grid ' +
        mod +
        '"><div class="slide-up"><span class="eyebrow">Bloque ' +
        bn +
        '</span>' +
        (title ? '<h3 class="serif">' + title + '</h3>' : '') +
        (desc ? '<p class="about-lede" style="margin-top:1.2rem">' + desc + '</p>' : '') +
        '</div><div class="about-side slide-up" data-d="1"><div class="about-photo mono-about-extra__photo' +
        (img ? ' has-photo' : '') +
        '"' +
        bg +
        '></div><div class="about-cap"><span>Equipo</span><strong>Bloque ' +
        bn +
        '</strong></div></div></article>'
      );
    }),
    'graphite-soft': renderTemplateAboutExtras('graphite-about-extras', true, function (sec, i, textFirst) {
      var title = escapeHtml(String(sec.title || '').trim());
      var desc = escapeHtml(String(sec.description || '').trim());
      var img = String(sec.image_url || '').trim();
      var mod = textFirst ? 'graphite-about-extra--text-first' : 'graphite-about-extra--photo-first';
      var bn = String(i + 3).padStart(2, '0');
      var bg = img ? ' style="background-image:url(\'' + escapeAttr(img) + '\')"' : '';
      return (
        '<article class="graphite-about-extra about-grid ' +
        mod +
        '"><div class="about-text"><span class="sec-num">N° ' +
        bn +
        ' — Extra</span>' +
        (title ? '<h3 class="serif h-section" style="margin-top:14px">' + title + '</h3>' : '') +
        (desc ? '<p class="lede" style="margin-top:24px">' + desc + '</p>' : '') +
        '</div><div class="about-photos"><div class="about-photo reveal-img' +
        (img ? ' has-photo in' : '') +
        '"><div class="img"' +
        bg +
        '></div><cap>Equipo</cap></div></div></article>'
      );
    }),
    'wild-pet': renderTemplateAboutExtras('wild-about-extras', false, function (sec, i, textFirst) {
      var title = escapeHtml(String(sec.title || '').trim());
      var desc = escapeHtml(String(sec.description || '').trim());
      var img = String(sec.image_url || '').trim();
      var mod = textFirst ? 'wild-about-extra--text-first' : 'wild-about-extra--photo-first';
      var bn = String(i + 3).padStart(2, '0');
      var photoRot = textFirst ? '-12deg' : '10deg';
      var bg = img ? ' style="background-image:url(\'' + escapeAttr(img) + '\')"' : '';
      var phSvg =
        '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="9" cy="9" r="3"/><circle cx="17" cy="11" r="2.4"/><path d="M3 20c0-3 3-5 6-5s6 2 6 5"/><path d="M14 20c0-2 2-4 4-4s3 1.5 3 3.5"/></svg>';
      return (
        '<article class="wild-about-extra about-grid about ' +
        mod +
        '"><div class="about-photo sr wild-about-extra__photo' +
        (img ? ' has-photo' : '') +
        '" style="--sr-rot:' +
        photoRot +
        ';"><div class="photo-fallback' +
        (img ? ' has-photo' : '') +
        '"' +
        bg +
        ' role="img" aria-hidden="true">' +
        (img ? '' : phSvg) +
        '</div></div><div class="wild-about-extra__body"><span class="eyebrow sr">Bloque ' +
        bn +
        '</span>' +
        (title ? '<h3 class="sr" style="--sr-rot:-2deg;">' + title + '</h3>' : '') +
        (desc ? '<p class="sr">' + desc + '</p>' : '') +
        '</div></article>'
      );
    }),
    'kairos-bold': renderTemplateAboutExtras('kairos-about-extras', false, function (sec, i, textFirst) {
      var title = escapeHtml(String(sec.title || '').trim());
      var desc = escapeHtml(String(sec.description || '').trim());
      var img = String(sec.image_url || '').trim();
      var mod = textFirst ? 'kairos-about-extra--text-first' : 'kairos-about-extra--photo-first';
      var bn = String(i + 3).padStart(2, '0');
      var photoInner = img
        ? '<img src="' + escapeAttr(img) + '" alt="" loading="lazy" decoding="async"/>'
        : '<div class="ph o" aria-hidden="true"><span class="ph-label">FOTO · ' + bn + '</span></div>';
      return (
        '<article class="kairos-about-extra about-grid ' +
        mod +
        '"><figure class="about-photo kairos-about-extra__photo' +
        (img ? ' has-photo' : '') +
        '">' +
        photoInner +
        '</figure><div class="about-body"><span class="cap reveal">★ Bloque ' +
        bn +
        '</span>' +
        (title ? '<h3 class="reveal">' + title + '</h3>' : '') +
        (desc ? '<p class="lede reveal">' + desc + '</p>' : '') +
        '</div></article>'
      );
    }),
    'versa-studio': renderTemplateAboutExtras('versa-about-extras', false, function (sec, i, textFirst) {
      var title = escapeHtml(String(sec.title || '').trim());
      var desc = escapeHtml(String(sec.description || '').trim());
      var img = String(sec.image_url || '').trim();
      var mod = textFirst ? 'versa-about-extra--text-first' : 'versa-about-extra--photo-first';
      var bn = String(i + 3).padStart(2, '0');
      var bg = img ? ' style="background-image:url(\'' + escapeAttr(img) + '\')"' : '';
      return (
        '<article class="versa-about-extra about-grid ' +
        mod +
        '"><div class="about-img-wrap slide-up"><div class="about-img versa-about-extra__img' +
        (img ? ' has-photo' : '') +
        '"' +
        bg +
        '></div><div class="about-img-tag"><span class="dot"></span>Bloque ' +
        bn +
        '</div></div><div class="about-text slide-up" data-d="1"><span class="eyebrow">Capítulo ' +
        bn +
        '</span>' +
        (title ? '<h3 class="display">' + title + '</h3>' : '') +
        (desc ? '<p>' + desc + '</p>' : '') +
        '</div></article>'
      );
    }),
    'luxe-atelier': renderTemplateAboutExtras('luxe-about-extras', false, function (sec, i, textFirst) {
      var title = escapeHtml(String(sec.title || '').trim());
      var desc = escapeHtml(String(sec.description || '').trim());
      var img = String(sec.image_url || '').trim();
      var mod = textFirst ? 'luxe-about-extra--text-first' : 'luxe-about-extra--photo-first';
      var bn = String(i + 3).padStart(2, '0');
      var bg = img ? ' style="background-image:url(\'' + escapeAttr(img) + '\')"' : '';
      return (
        '<article class="luxe-about-extra about-mosaic ' +
        mod +
        '"><div class="about-photos slide-up"><div class="aphoto a1 luxe-about-extra__photo' +
        (img ? ' has-photo' : '') +
        '"' +
        bg +
        '></div></div><div class="about-text slide-up" data-d="1"><span class="eyebrow">Capítulo ' +
        bn +
        '</span>' +
        (title ? '<h3 class="serif">' + title + '</h3>' : '') +
        (desc ? '<p>' + desc + '</p>' : '') +
        '</div></article>'
      );
    }),
    'tech-sleek': renderTemplateAboutExtras('sleek-about-extras', true, function (sec, i, textFirst) {
      var title = escapeHtml(String(sec.title || '').trim());
      var desc = escapeHtml(String(sec.description || '').trim());
      var img = String(sec.image_url || '').trim();
      var mod = textFirst ? 'sleek-about-extra--text-first' : 'sleek-about-extra--photo-first';
      var bn = String(i + 3).padStart(2, '0');
      var imgTag = img
        ? '<img src="' + escapeAttr(img) + '" alt="" loading="lazy" decoding="async"/>'
        : '';
      return (
        '<article class="sleek-about-extra about-inner ' +
        mod +
        '"><div class="about-text"><span class="eyebrow">Bloque ' +
        bn +
        '</span>' +
        (title ? '<h3><span>' + title + '</span></h3>' : '') +
        (desc ? '<p>' + desc + '</p>' : '') +
        '</div><div class="about-photo-col"><div class="about-photo sleek-about-extra__photo' +
        (img ? '' : ' is-empty') +
        '">' +
        imgTag +
        '<div class="about-photo-accent"></div></div></div></article>'
      );
    }),
    'trust-clinic': renderTemplateAboutExtras('trust-about-extras', false, function (sec, i, textFirst) {
      var title = escapeHtml(String(sec.title || '').trim());
      var desc = escapeHtml(String(sec.description || '').trim());
      var img = String(sec.image_url || '').trim();
      var mod = textFirst ? 'trust-about-extra--text-first' : 'trust-about-extra--photo-first';
      var bn = String(i + 3).padStart(2, '0');
      var bg = img ? ' style="background-image:url(\'' + escapeAttr(img) + '\')"' : '';
      return (
        '<article class="trust-about-extra trust-grid ' +
        mod +
        '"><div class="trust-img trust-about-extra__photo' +
        (img ? ' has-photo' : '') +
        '"' +
        bg +
        '></div><div class="trust-content"><span class="eyebrow"><span class="rule"></span>Bloque ' +
        bn +
        '</span>' +
        (title ? '<h3 class="serif">' + title + '</h3>' : '') +
        (desc ? '<p>' + desc + '</p>' : '') +
        '</div></article>'
      );
    }),
    'craft-pro': renderTemplateAboutExtras('craft-about-extras', false, function (sec, i, textFirst) {
      var title = escapeHtml(String(sec.title || '').trim());
      var desc = escapeHtml(String(sec.description || '').trim());
      var img = String(sec.image_url || '').trim();
      var mod = textFirst ? 'craft-about-extra--text-first' : 'craft-about-extra--photo-first';
      var bn = String(i + 3).padStart(2, '0');
      var imgTag = img
        ? '<img src="' + escapeAttr(img) + '" alt="" loading="lazy" decoding="async"/>'
        : '';
      return (
        '<article class="craft-about-extra ' +
        mod +
        '"><div class="craft-about-extra__copy"><span class="eyebrow craft-about-extra__kicker">Bloque ' +
        bn +
        '</span>' +
        (title ? '<h3 class="cond craft-about-extra__title">' + title + '</h3>' : '') +
        (desc ? '<p class="craft-about-extra__desc">' + desc + '</p>' : '') +
        '</div><figure class="craft-about-extra__figure"><div class="craft-about-extra__img' +
        (img ? ' has-photo' : '') +
        '"><div class="craft-about-extra__ph" aria-hidden="true">Foto</div>' +
        imgTag +
        '</div></figure></article>'
      );
    }),
  };

  function resolveTemplateRenderer(wrap) {
    if (typeof global.lwRenderAboutExtrasImpl === 'function') {
      return global.lwRenderAboutExtrasImpl;
    }
    var slug = slugFromWrap(wrap) || slugFromPath() || String(global.__lwAboutExtrasTemplate || '').trim();
    if (slug && TEMPLATE_ABOUT_RENDERERS[slug]) return TEMPLATE_ABOUT_RENDERERS[slug];
    return null;
  }

  function refreshReveal() {
    stripNestedDataAnimConflicts();
    prepareTvAboutExtras();
    if (typeof global.bloomRevealAboutExtras === 'function') {
      global.bloomRevealAboutExtras();
    } else {
      document.querySelectorAll('#aboutExtraBlocks .bloom-about-extra').forEach(function (el) {
        el.classList.add('reveal');
      });
    }
    if (typeof global.noirRevealAboutExtras === 'function') {
      global.noirRevealAboutExtras();
    } else {
      document.querySelectorAll('#aboutExtraBlocks .noir-about-extra').forEach(function (el) {
        el.classList.add('reveal');
      });
    }
    if (typeof global.kairosRevealAboutExtras === 'function') {
      global.kairosRevealAboutExtras();
    }
    if (typeof global.sleekRevealAboutExtras === 'function') {
      global.sleekRevealAboutExtras();
    }
    if (typeof global.trustRevealAboutExtras === 'function') {
      global.trustRevealAboutExtras();
    }
    if (typeof global.versaObserveReveals === 'function') {
      global.versaObserveReveals(document.getElementById('aboutExtraBlocks'));
    }
    if (typeof global.monoObserveReveals === 'function') {
      global.monoObserveReveals(document.getElementById('aboutExtraBlocks'));
    }
    if (typeof global.luxeObserveReveals === 'function') {
      global.luxeObserveReveals(document.getElementById('aboutExtraBlocks'));
    }
    if (typeof global.graphiteRevealAboutExtras === 'function') {
      global.graphiteRevealAboutExtras(document.getElementById('aboutExtraBlocks'));
    }
    if (typeof global.wildObserveReveals === 'function') {
      var wildRoot = document.getElementById('aboutExtraBlocks');
      if (wildRoot) {
        if (typeof global.forceWildPreviewAboutExtras === 'function') {
          global.forceWildPreviewAboutExtras(wildRoot);
        } else {
          global.wildObserveReveals(wildRoot);
        }
      }
    }
    if (typeof global.coastalRevealAboutExtras === 'function') {
      global.coastalRevealAboutExtras();
    } else {
      var coastalRoot = document.getElementById('aboutExtraBlocks');
      if (coastalRoot) {
        coastalRoot.querySelectorAll('.slide-up:not(.in)').forEach(function (el) {
          el.classList.add('in');
        });
      }
    }
    if (typeof global.republicaRevealRefresh === 'function') {
      global.republicaRevealRefresh();
      return;
    }
    if (typeof global.tvAnimationsRefresh === 'function') {
      global.tvAnimationsRefresh();
      return;
    }
    if (typeof global.__craftoAnimApplyTags === 'function') {
      global.__craftoAnimApplyTags();
      if (typeof global.__craftoAnimObserveAll === 'function') global.__craftoAnimObserveAll();
      return;
    }
    var reduced = global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var els = document.querySelectorAll('#aboutExtraBlocks .reveal:not(.in)');
    if (reduced) {
      els.forEach(function (el) {
        el.classList.add('in');
      });
      return;
    }
    els.forEach(function (el) {
      var r = el.getBoundingClientRect();
      var vh = global.innerHeight || document.documentElement.clientHeight;
      if (r.top < vh * 0.92 && r.bottom > 0) el.classList.add('in');
    });
  }

  function renderAboutExtras(sections) {
    var wrap = document.getElementById('aboutExtraBlocks') || ensureContainer();
    if (!wrap) return;
    var templateFn = resolveTemplateRenderer(wrap);
    if (templateFn) {
      templateFn(sections);
      refreshReveal();
      return;
    }
    var list = Array.isArray(sections) ? sections.filter(function (s) { return s != null; }) : [];
    if (list.length === 0) {
      wrap.innerHTML = '';
      return;
    }
    var rev = revealSuffix();
    var mainTextFirst = isMainAboutTextFirst(wrap);
    wrap.innerHTML = list
      .map(function (sec, i) {
        var title = escapeHtml(String(sec.title || '').trim());
        var desc = escapeHtml(String(sec.description || '').trim());
        var img = String(sec.image_url || '').trim();
        var textFirst = aboutExtraTextFirst(i, mainTextFirst);
        var mod = textFirst ? 'lw-about-extra--text-first' : 'lw-about-extra--photo-first';
        var blockNum = String(i + 3).padStart(2, '0');
        var imgTag = img
          ? '<img src="' + escapeAttr(img) + '" alt="" loading="lazy" decoding="async"/>'
          : '';
        var photoClass = 'lw-about-extra__photo' + (img ? ' has-photo' : '');
        return (
          '<article class="lw-about-extra ' +
          mod +
          '">' +
          '<div class="lw-about-extra__body">' +
          '<span class="lw-about-extra__kicker' +
          rev +
          '">Bloque ' +
          blockNum +
          '</span>' +
          (title ? '<h3 class="lw-about-extra__title' + rev + '">' + title + '</h3>' : '') +
          (desc ? '<p class="lw-about-extra__desc' + rev + '">' + desc + '</p>' : '') +
          '</div>' +
          '<figure class="lw-about-extra__figure' +
          rev +
          '">' +
          '<div class="' +
          photoClass +
          '">' +
          '<div class="lw-about-extra__photo-ph" aria-hidden="true">Foto</div>' +
          imgTag +
          '</div>' +
          '</figure>' +
          '</article>'
        );
      })
      .join('');
    refreshReveal();
  }

  function findAboutTitleEl() {
    return document.getElementById('aboutTitle') || document.getElementById('sleekAboutTitle');
  }

  function applyAboutTitle(raw) {
    if (!raw || !Object.prototype.hasOwnProperty.call(raw, 'about_title')) return;
    var text = String(raw.about_title || '').trim() || 'Sobre nosotros.';
    var el = findAboutTitleEl();
    if (el) {
      el.textContent = text;
      return;
    }
    var h2 = document.querySelector(
      '#sobre-nosotros .about-text h2:first-of-type, #sobre-nosotros .about h2:first-of-type',
    );
    if (h2 && !h2.querySelector('.split, .w, [class*="split"]')) {
      h2.textContent = text;
    }
  }

  function applyAboutPreview(raw) {
    raw = raw || {};
    applyAboutTitle(raw);
    if (Object.prototype.hasOwnProperty.call(raw, 'about_sections')) {
      renderAboutExtras(raw.about_sections);
    }
  }

  function patchApplyLivePreview() {
    var orig = global.applyLivePreviewData;
    if (typeof orig !== 'function' || orig.__lwAboutPatched) return false;
    function wrapped(raw, opts) {
      var result = orig.call(this, raw, opts);
      applyAboutPreview(raw);
      return result;
    }
    wrapped.__lwAboutPatched = true;
    global.applyLivePreviewData = wrapped;
    return true;
  }

  function tryPatchApply() {
    if (patchApplyLivePreview()) return;
    var n = 0;
    var timer = global.setInterval(function () {
      if (patchApplyLivePreview() || ++n > 200) global.clearInterval(timer);
    }, 50);
  }

  global.lwAboutExtraTextFirst = aboutExtraTextFirst;
  global.lwIsMainAboutTextFirst = isMainAboutTextFirst;
  global.lwRenderAboutExtras = renderAboutExtras;
  global.lwApplyAboutPreview = applyAboutPreview;
  global.lwEnsureAboutExtrasContainer = ensureContainer;
  global.lwRefreshAboutExtrasReveal = refreshReveal;

  tryPatchApply();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ensureContainer);
  } else {
    ensureContainer();
  }
})(typeof window !== 'undefined' ? window : globalThis);
