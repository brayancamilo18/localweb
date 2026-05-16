const ENV_HOST_LABELS = new Set(['app', 'pre', 'des', 'www'])

/**
 * Subdominio de tenant a partir del hostname, o null si es landing / entorno / local.
 */
export function getTenantFromHostname(hostname: string = window.location.hostname): string | null {
  if (!hostname || hostname === 'localhost' || hostname === '127.0.0.1') {
    return null
  }

  if (hostname === 'onez.es') {
    return null
  }

  const firstLabel = hostname.split('.')[0]?.toLowerCase() ?? ''
  if (!firstLabel || ENV_HOST_LABELS.has(firstLabel)) {
    return null
  }

  return firstLabel
}

/** URL de la landing ONEZ según el entorno (prod / pre / des). */
export function getOnezHomeUrl(hostname: string = window.location.hostname): string {
  if (hostname === 'pre.onez.es' || hostname.endsWith('.pre.onez.es')) {
    return 'https://pre.onez.es'
  }

  if (hostname === 'des.onez.es' || hostname.endsWith('.des.onez.es')) {
    return 'https://des.onez.es'
  }

  return 'https://app.onez.es'
}
