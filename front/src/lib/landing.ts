/** Ruta pública de la landing de marketing. */
export const LANDING_PUBLIC_PATH = '/landing'

/** Ruta del HTML estático (Vite copia front/public/landing → dist/landing). */
export const LANDING_INDEX_PATH = '/landing/index.html'

/** URL canónica en producción. */
export const LANDING_CANONICAL_URL = 'https://onez.es/landing'

/** Dominio del SPA (login, registro, dashboard). */
export const APP_ORIGIN = 'https://app.onez.es'

/** onez.es / www: sitio de marketing; la landing vive en /landing. */
export function isOnezMarketingHost(hostname: string = window.location.hostname): boolean {
  return hostname === 'onez.es' || hostname === 'www.onez.es'
}

/** En onez.es la raíz redirige a /landing (no al login de app.onez.es). */
export function shouldRootRedirectToLanding(hostname: string = window.location.hostname): boolean {
  return isOnezMarketingHost(hostname)
}
