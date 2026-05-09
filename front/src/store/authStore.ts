import { create } from 'zustand'
import { clearOnboardingPersistForUser } from '../features/onboarding/onboardingPersist'
import type { Business, User } from '../types/api'

/**
 * Auth: Sanctum SPA mode.
 *
 * Diseño: la verdad de "estoy logueado" vive en la cookie HttpOnly de sesión, no aquí.
 * Este store es solo memoria caliente para que la UI pinte sin esperar /auth/me en cada
 * render. La rehidratación de `user`/`business` la hace `useAuth()` con un useQuery a
 * `/auth/me`. Si la cookie no es válida, /auth/me devuelve 401 y limpiamos el store.
 *
 * Eliminado: persistencia en localStorage (clave `lw-auth-store`), token bearer y la
 * derivación `hasCompletedOnboarding` desde localStorage. Ahora el guard la deriva del
 * `business.onboarding_completed_at` que llega en /auth/me.
 */
interface AuthState {
  user: User | null
  business: Business | null
  isAuthenticated: boolean
  hasCompletedOnboarding: boolean
  setAuth: (user: User, business?: Business | null) => void
  clearAuth: () => void
}

function deriveHasCompleted(business: Business | null): boolean {
  if (!business) return false
  if (business.onboarding_completed_at != null && business.onboarding_completed_at !== '') return true
  return false
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  business: null,
  isAuthenticated: false,
  hasCompletedOnboarding: false,
  setAuth: (user, business = null) => {
    set({
      user,
      business,
      isAuthenticated: true,
      hasCompletedOnboarding: deriveHasCompleted(business),
    })
  },
  clearAuth: () => {
    const uid = get().user?.id
    if (uid != null) clearOnboardingPersistForUser(uid)
    set({
      user: null,
      business: null,
      isAuthenticated: false,
      hasCompletedOnboarding: false,
    })
  },
}))
