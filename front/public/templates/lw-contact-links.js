/**
 * Aplica teléfono y enlaces WhatsApp en plantillas HTML (iframe público / onboarding).
 * - Actualiza [data-wa-link], cualquier <a href*="wa.me"> y placeholders {{whatsapp}}
 * - Abre WhatsApp en nueva pestaña (necesario dentro del iframe del SPA)
 */
(function (global) {
  function digitsFrom(raw, key) {
    if (!raw || raw[key] == null) return '';
    return String(raw[key]).replace(/\D/g, '');
  }

  function resolvePhone(raw) {
    raw = raw || {};
    var phoneRaw = raw.telefono != null ? String(raw.telefono).trim() : '';
    var phoneWa = phoneRaw.replace(/\D/g, '');
    if (!phoneWa) {
      phoneWa = digitsFrom(raw, 'whatsapp');
    }
    return { phoneRaw: phoneRaw, phoneWa: phoneWa };
  }

  function applyContactLinks(raw) {
    var phones = resolvePhone(raw);
    var phoneRaw = phones.phoneRaw;
    var phoneWa = phones.phoneWa;
    var waUrl = phoneWa ? 'https://wa.me/' + phoneWa : 'https://wa.me/';
    var telHref = phoneWa ? 'tel:+' + phoneWa : 'tel:';

    document
      .querySelectorAll('a[data-wa-link], a[href*="wa.me"], a[href*="{{whatsapp}}"]')
      .forEach(function (el) {
        if (!(el instanceof HTMLAnchorElement)) return;
        el.href = waUrl;
        el.target = '_blank';
        el.rel = 'noopener noreferrer';
      });

    document.querySelectorAll('[data-tel-link]').forEach(function (el) {
      if (!(el instanceof HTMLAnchorElement)) return;
      el.href = telHref;
    });

    document.querySelectorAll('[data-phone-display]').forEach(function (el) {
      el.textContent = phoneRaw || 'Tu teléfono';
    });

    bindContactClickTracking();
  }

  function bindContactClickTracking() {
    function bindOnce(el, kind) {
      if (!(el instanceof HTMLAnchorElement)) return;
      if (el.dataset.lwTrackBound === '1') return;
      el.dataset.lwTrackBound = '1';
      el.addEventListener('click', function () {
        try {
          window.parent.postMessage({ type: 'lw:track-click', kind: kind }, '*');
        } catch (_) {
          /* ignore */
        }
      });
    }

    document
      .querySelectorAll('a[data-wa-link], a[href*="wa.me"], a[href*="{{whatsapp}}"]')
      .forEach(function (el) {
        bindOnce(el, 'whatsapp_click');
      });

    document.querySelectorAll('[data-tel-link]').forEach(function (el) {
      bindOnce(el, 'phone_click');
    });
  }

  global.lwApplyContactLinks = applyContactLinks;
})(typeof window !== 'undefined' ? window : globalThis);
