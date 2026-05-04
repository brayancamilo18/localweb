/**
 * Enlace de Google Maps (rutas o búsqueda) a partir de coordenadas o dirección.
 * No requiere que el usuario pegue un enlace manual.
 */
export function buildGoogleDirectionsUrl(opts: {
  lat?: number | null
  lng?: number | null
  address?: string | null
}): string {
  const la = typeof opts.lat === 'number' ? opts.lat : opts.lat != null ? Number(opts.lat) : NaN
  const lo = typeof opts.lng === 'number' ? opts.lng : opts.lng != null ? Number(opts.lng) : NaN
  if (Number.isFinite(la) && Number.isFinite(lo)) {
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${la},${lo}`)}`
  }
  const addr = opts.address?.trim()
  if (addr) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addr)}`
  }
  return ''
}
