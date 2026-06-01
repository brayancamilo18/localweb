import axios, { type AxiosRequestConfig, type InternalAxiosRequestConfig } from 'axios'
import { isOnboardingPreviewWithoutAuth } from '../config/devFlags'

/** Marca de tiempo del último login/registro exitoso. Durante una breve
 * ventana tras autenticarse, los 401 NO redirigen a /login porque la cookie
 * de sesión puede tardar unos ms en propagarse en algunos navegadores móviles.
 * El flujo normal de la app reintentará la petición. */
const POST_AUTH_GRACE_MS = 3000
let lastSuccessfulAuthAt = 0

export function markPostAuthGrace(): void {
  lastSuccessfulAuthAt = Date.now()
}

function isInPostAuthGrace(): boolean {
  return lastSuccessfulAuthAt > 0 && Date.now() - lastSuccessfulAuthAt < POST_AUTH_GRACE_MS
}

export function isInPostAuthGracePublic(): boolean {
  return isInPostAuthGrace()
}

/**
 * Auth: Sanctum SPA mode (cookie HttpOnly + CSRF).
 *
 * Producción: SPA y API comparten eTLD+1 (p. ej. onez.es / api.onez.es) con
 * SESSION_DOMAIN=.onez.es. El SPA llama al backend en su URL absoluta vía
 * VITE_API_URL.
 *
 * Dev: Vite proxy redirige /api a nginx → Laravel; baseURL es '/api/v1' relativo y
 * las cookies se comparten porque ambos viajan por el mismo origin (puerto del dev
 * server). Para que las cookies de sesión Sanctum funcionen, el SPA debe correr en
 * un dominio listado en SANCTUM_STATEFUL_DOMAINS y CORS debe permitir credentials.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL ?? '/api/v1'

/** Origen del backend (sin /api/v1) para llamar /sanctum/csrf-cookie por debajo del prefijo. */
function backendOrigin(): string {
  if (API_BASE_URL.startsWith('http://') || API_BASE_URL.startsWith('https://')) {
    return API_BASE_URL.replace(/\/api\/v\d+\/?$/, '')
  }
  return API_BASE_URL.replace(/\/api\/v\d+\/?$/, '')
}

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  // axios usa estos defaults; los explicito para evitar regresiones si cambia.
  xsrfCookieName: 'XSRF-TOKEN',
  xsrfHeaderName: 'X-XSRF-TOKEN',
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
})

const MUTATING_METHODS = new Set(['post', 'put', 'patch', 'delete'])

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const all = document.cookie ? document.cookie.split('; ') : []
  for (const raw of all) {
    const eq = raw.indexOf('=')
    const key = eq === -1 ? raw : raw.slice(0, eq)
    if (key === name) {
      return eq === -1 ? '' : decodeURIComponent(raw.slice(eq + 1))
    }
  }
  return null
}

let csrfFetchInFlight: Promise<void> | null = null

/**
 * Asegura que la cookie XSRF-TOKEN esté presente antes de una mutación. Llama a
 * /sanctum/csrf-cookie una sola vez por sesión (no por request). Si varias mutaciones
 * se disparan a la vez, comparten la misma promesa.
 */
async function ensureCsrfCookie(): Promise<void> {
  if (readCookie('XSRF-TOKEN')) return
  if (csrfFetchInFlight) return csrfFetchInFlight

  csrfFetchInFlight = axios
    .get(`${backendOrigin()}/sanctum/csrf-cookie`, { withCredentials: true })
    .then(() => undefined)
    .catch((err) => {
      // No bloqueamos la mutación si csrf-cookie falla por red; el backend devolverá
      // 419 y el caller lo verá. Limpiamos el lock para reintentar en el siguiente.
      csrfFetchInFlight = null
      throw err
    })
    .finally(() => {
      csrfFetchInFlight = null
    })

  return csrfFetchInFlight
}

apiClient.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const method = (config.method ?? 'get').toLowerCase()
  if (MUTATING_METHODS.has(method)) {
    try {
      await ensureCsrfCookie()
    } catch {
      /* dejamos seguir; backend responderá 419 si CSRF falta */
    }
  }

  if (config.data instanceof FormData) {
    delete (config.headers as Record<string, unknown> | undefined)?.['Content-Type']
  }

  return config
})

/**
 * Pantallas públicas (no requieren sesión). Si el interceptor de 401 viese al
 * usuario en una de estas rutas y le forzase un redirect a `/login`, rompería
 * el flujo: el enlace de reset por email aterriza en `/reset-password`, no hay
 * cookie aún → /auth/me da 401 → el interceptor saltaría a /login antes de que
 * la página llegue a pintar el formulario.
 */
const PUBLIC_AUTH_PATHS = new Set([
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
])

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status
    /** Solo 401 = sesión inválida. 403 suele ser “no permitido” con sesión válida (no purgar). */
    if (status === 401) {
      const path = window.location.pathname

      const skipRedirectToLogin =
        PUBLIC_AUTH_PATHS.has(path) ||
        isInPostAuthGrace() ||
        (isOnboardingPreviewWithoutAuth() && path.startsWith('/onboarding'))

      if (!skipRedirectToLogin) {
        const next = encodeURIComponent(path + window.location.search)
        window.location.href = `/login?next=${next}`
      }
    }

    return Promise.reject(error)
  },
)

/** Útil en tests para forzar un nuevo pre-flight de CSRF (jsdom no lo cachea). */
export function __resetCsrfCookieFetchForTests(): void {
  csrfFetchInFlight = null
}

export type { AxiosRequestConfig }
