/**
 * Carga una plantilla existente en iframe y envía payload de demo vía postMessage.
 * Solo para grabación de vídeos — carpeta temporal, no toca /templates/.
 */
(function () {
  'use strict';

  var cfg = window.VIDEO_DEMO_CONFIG;
  if (!cfg || !cfg.slug || !cfg.payload) {
    console.error('[video-demo] Falta VIDEO_DEMO_CONFIG (slug + payload).');
    return;
  }

  var origin = location.origin;
  var iframe = document.getElementById('demoFrame');
  if (!iframe) return;

  var params = new URLSearchParams({
    v: '3',
    preview: '1',
    parentOrigin: origin,
  });
  iframe.src = '/templates/' + encodeURIComponent(cfg.slug) + '.html?' + params.toString();

  function pushData() {
    var win = iframe.contentWindow;
    if (!win) return;
    var payload = Object.assign({}, cfg.payload, { api_base_url: origin });
    win.postMessage(
      {
        type: 'lw:onboarding-preview',
        alignToHash: false,
        payload: payload,
      },
      origin,
    );
  }

  iframe.addEventListener('load', function () {
    pushData();
    setTimeout(pushData, 100);
    setTimeout(pushData, 350);
    setTimeout(pushData, 800);
  });
})();
