/** Ruta del HTML estático (Vite copia front/public/landing → dist/landing). */
export const LANDING_INDEX_PATH = '/landing/index.html'

/** Hosts donde la raíz pública debe ser la landing, no el login del SPA. */
export function isMarketingSiteHost(hostname: string = window.location.hostname): boolean {
  return (
    hostname === 'onez.es' ||
    hostname === 'www.onez.es' ||
    hostname === 'app.onez.es' ||
    hostname === 'pre.onez.es' ||
    hostname === 'des.onez.es' ||
    hostname === 'localhost' ||
    hostname === '127.0.0.1'
  )
}
