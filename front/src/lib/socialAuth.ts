import { apiClient } from '../api/client'

/**
 * Devuelve la base URL del backend a partir del baseURL configurado en axios.
 * `apiClient.defaults.baseURL` puede ser `http://localhost:8000/api/v1` o
 * `https://api.onez.es/api/v1`; descartamos el sufijo `/api/v1` para construir
 * la URL del redirect.
 */
function backendOrigin(): string {
  const base = apiClient.defaults.baseURL ?? ''
  try {
    const u = new URL(base, window.location.origin)
    return `${u.protocol}//${u.host}`
  } catch {
    return window.location.origin
  }
}

/**
 * Origen del backend para OAuth (debe coincidir con GOOGLE_REDIRECT_URI / APP_URL).
 * Con Vite en :5173 y API relativa `/api/v1`, el proxy no aplica a la vuelta de Google:
 * el callback va directo a `http://localhost` (nginx :80).
 */
export function oauthBackendOrigin(): string {
  const base = apiClient.defaults.baseURL ?? ''
  if (!base.startsWith('http') && typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    return 'http://localhost'
  }
  return backendOrigin()
}

export function startGoogleOAuth(): void {
  const origin = oauthBackendOrigin()
  window.location.assign(`${origin}/api/v1/auth/google/redirect`)
}
