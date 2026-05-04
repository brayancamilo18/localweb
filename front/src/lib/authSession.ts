import { useAuthStore } from '../store/authStore'

/** Sesión SPA: token en Zustand (p. ej. tras hidratar) o en localStorage (siempre enviado a la API). */
export function hasBearerToken(): boolean {
  if (typeof localStorage === 'undefined') return false
  return !!(useAuthStore.getState().token || localStorage.getItem('lw_token'))
}
