{{-- Coordenadas y arranque Leaflet unificado para todas las plantillas tenant públicas. --}}
<script>
  window.__lwLat = {{ is_numeric($map_lat) ? $map_lat : 'null' }};
  window.__lwLon = {{ is_numeric($map_lon) ? $map_lon : 'null' }};
  window.__lwMapAddress = @json($direccion);
</script>
<script>
function lwResolveMapCoords(lat, lon) {
  var la = typeof lat === 'number' ? lat : parseFloat(lat);
  var lo = typeof lon === 'number' ? lon : parseFloat(lon);
  if (!Number.isFinite(la) || !Number.isFinite(lo)) {
    la = typeof window.__lwLat === 'number' ? window.__lwLat : parseFloat(window.__lwLat);
    lo = typeof window.__lwLon === 'number' ? window.__lwLon : parseFloat(window.__lwLon);
  }
  return { lat: la, lon: lo, ok: Number.isFinite(la) && Number.isFinite(lo) };
}

function lwWhenLeafletReady(fn) {
  if (window.__LW_SKIP_LEAFLET) return;
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

/** Inicializa el mapa de la plantilla activa usando coords del servidor. */
function lwBootTenantMap(addressLine) {
  var c = lwResolveMapCoords(window.__lwLat, window.__lwLon);
  addressLine = addressLine || window.__lwMapAddress || '';
  if (typeof updateBoldPreviewMap === 'function') {
    updateBoldPreviewMap(c.ok ? c.lat : NaN, c.ok ? c.lon : NaN);
    return;
  }
  if (typeof updatePreviewMapEmbed === 'function') {
    updatePreviewMapEmbed(c.ok ? c.lat : NaN, c.ok ? c.lon : NaN, addressLine);
    return;
  }
  if (typeof updateBloomPreviewMap === 'function') {
    updateBloomPreviewMap(c.ok ? c.lat : NaN, c.ok ? c.lon : NaN, addressLine);
    return;
  }
  if (typeof updateSleekPreviewMap === 'function') {
    updateSleekPreviewMap(c.ok ? c.lat : NaN, c.ok ? c.lon : NaN);
    return;
  }
  if (typeof updateMonoPreviewMap === 'function') {
    updateMonoPreviewMap(c.ok ? c.lat : NaN, c.ok ? c.lon : NaN, addressLine);
    return;
  }
  if (typeof updateLuxePreviewMap === 'function') {
    updateLuxePreviewMap(c.ok ? c.lat : NaN, c.ok ? c.lon : NaN, addressLine);
    return;
  }
  if (typeof updateWildPreviewMap === 'function') {
    updateWildPreviewMap(c.ok ? c.lat : 40.4168, c.ok ? c.lon : -3.7038, addressLine || '');
    return;
  }
}

(function lwScheduleTenantMapBoot() {
  if (window.__LW_SKIP_LEAFLET) return;
  function boot() {
    if (typeof lwBootTenantMap === 'function') {
      lwBootTenantMap(window.__lwMapAddress || '');
    }
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      lwWhenLeafletReady(boot);
    });
  } else {
    lwWhenLeafletReady(boot);
  }
})();
</script>
