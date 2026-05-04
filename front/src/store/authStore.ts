import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { clearOnboardingPersistForUser } from '../features/onboarding/onboardingPersist'
import type { Business, User } from '../types/api'

interface AuthState {
  token: string | null
  user: User | null
  business: Business | null
  isAuthenticated: boolean
  hasCompletedOnboarding: boolean
  setAuth: (token: string, user: User, business?: Business | null) => void
  clearAuth: () => void
}

const AUTH_PERSIST = 'lw-auth-store'

function deriveHasCompleted(business: Business | null): boolean {
  if (!business) return false
  if (business.onboarding_completed_at != null && business.onboarding_completed_at !== '') return true
  // Store/API antiguos sin esta clave: mantener el criterio previo (plan ya activo).
  if (!('onboarding_completed_at' in business)) return business.plan !== 'pending'
  return false
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      business: null,
      isAuthenticated: false,
      hasCompletedOnboarding: false,
      setAuth: (token, user, business = null) => {
        localStorage.setItem('lw_token', token)
        set({
          token,
          user,
          business,
          isAuthenticated: true,
          hasCompletedOnboarding: deriveHasCompleted(business),
        })
      },
      clearAuth: () => {
        const uid = get().user?.id
        if (uid != null) clearOnboardingPersistForUser(uid)
        localStorage.removeItem('lw_token')
        try {
          localStorage.removeItem(AUTH_PERSIST)
        } catch {
          /* ignore */
        }
        set({
          token: null,
          user: null,
          business: null,
          isAuthenticated: false,
          hasCompletedOnboarding: false,
        })
      },
    }),
    {
      name: AUTH_PERSIST,
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        business: state.business,
        isAuthenticated: state.isAuthenticated,
        hasCompletedOnboarding: state.hasCompletedOnboarding,
      }),
      merge: (persisted, current) => {
        const p = persisted as Partial<AuthState>
        const token = p.token ?? current.token
        const user = p.user ?? current.user
        const business = p.business ?? current.business
        const isAuthenticated = p.isAuthenticated ?? !!token
        const hasCompletedOnboarding =
          p.hasCompletedOnboarding !== undefined ? p.hasCompletedOnboarding : deriveHasCompleted(business)
        return {
          ...current,
          ...p,
          token,
          user,
          business,
          isAuthenticated,
          hasCompletedOnboarding,
        }
      },
      onRehydrateStorage: () => (state) => {
        if (state?.token) {
          localStorage.setItem('lw_token', state.token)
        }
      },
      storage: {
        getItem: (name) => {
          const value = localStorage.getItem(name)
          return value ? JSON.parse(value) : null
        },
        setItem: (name, value) => {
          localStorage.setItem(name, JSON.stringify(value))
        },
        removeItem: (name) => {
          localStorage.removeItem(name)
        },
      },
    },
  ),
)
