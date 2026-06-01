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

/**
 * Dominio base de la web pública del negocio: {subdominio}.{host}
 * (p. ej. silgodev.app.onez.es en prod, silgodev.localhost en local).
 */
export function getPublicPageHost(hostname: string = window.location.hostname): string {
  const fromEnv = (import.meta.env.VITE_PUBLIC_PAGE_HOST as string | undefined)?.trim()
  if (fromEnv) {
    return fromEnv
  }

  if (!hostname || hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'localhost'
  }

  if (hostname === 'onez.es' || hostname === 'www.onez.es' || hostname === 'app.onez.es') {
    return 'app.onez.es'
  }

  if (hostname === 'pre.onez.es' || hostname.endsWith('.pre.onez.es')) {
    return 'pre.onez.es'
  }

  if (hostname === 'des.onez.es' || hostname.endsWith('.des.onez.es')) {
    return 'des.onez.es'
  }

  return 'app.onez.es'
}

/** URL pública canónica del negocio (https). */
export function buildPublicBusinessUrl(subdomain: string, hostname?: string): string {
  const sub = subdomain.trim()
  if (!sub) return ''
  return `https://${sub}.${getPublicPageHost(hostname)}`
}
