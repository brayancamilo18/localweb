import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { logout as logoutApi } from '../../api/auth'
import { resetOnboarding } from '../../api/onboarding'
import { Btn } from '../../components/primitives/primitives'
import { clearAllOnboardingPersist } from './onboardingPersist'
import { useAuthStore } from '../../store/authStore'

/** Cerrar sesión durante el onboarding: reinicia el wizard en servidor y limpia borrador local. */
export function OnboardingLogoutButton() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const clearAuth = useAuthStore((s) => s.clearAuth)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const business = useAuthStore((s) => s.business)

  const logoutM = useMutation({
    retry: false,
    mutationFn: async () => {
      const plan = business?.plan
      const paidDuringOnboarding =
        business?.is_pro === true || plan === 'pro' || plan === 'pending'
      if (!paidDuringOnboarding) {
        try {
          await resetOnboarding()
        } catch {
          /* si falla el reset, igualmente cerramos sesión */
        }
      }
      try {
        await logoutApi()
      } catch {
        /* la cookie puede estar ya invalidada; seguimos con logout local */
      }
    },
    onSettled: async () => {
      clearAllOnboardingPersist()
      await qc.cancelQueries()
      qc.removeQueries()
      clearAuth()
      navigate('/login', { replace: true })
    },
  })

  if (!isAuthenticated) return null

  return (
    <Btn
      kind="ghost"
      size="sm"
      icon="logOut"
      loading={logoutM.isPending}
      disabled={logoutM.isPending}
      onClick={() => {
        if (!logoutM.isPending) logoutM.mutate()
      }}
      className="lw-onboarding-logout"
      aria-label="Cerrar sesión"
    >
      <span className="lw-onboarding-logout__label">Cerrar sesión</span>
    </Btn>
  )
}
