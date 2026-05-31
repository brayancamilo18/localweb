/** Misma regla que `R2PublicUrl::isAllowedPath` en el backend. */
const MEDIA_OBJECT_PATH =
  /^\/(businesses\/\d+\/(?:cover|gallery|about|logo|favicon)\/.+)$/

function apiBase(): string {
  return (import.meta.env.VITE_API_URL ?? '/api/v1').replace(/\/$/, '')
}

/**
 * Convierte una URL pública del CDN (p. ej. cdn.onez.es) en la ruta proxy de la API
 * (/api/v1/media/…), mismo origen que el dashboard → sin CORS en fetch().
 */
export function mediaProxyFetchUrl(externalUrl: string): string {
  if (externalUrl.startsWith('data:') || externalUrl.startsWith('blob:')) {
    return externalUrl
  }

  try {
    const parsed = new URL(externalUrl, typeof window !== 'undefined' ? window.location.origin : 'https://app.onez.es')
    const path = parsed.pathname

    if (path.includes('/media/businesses/')) {
      return parsed.href
    }

    const match = path.match(MEDIA_OBJECT_PATH)
    if (match) {
      return `${apiBase()}/media/${match[1]}`
    }
  } catch {
    // URL relativa o mal formada: devolver tal cual.
  }

  return externalUrl
}
