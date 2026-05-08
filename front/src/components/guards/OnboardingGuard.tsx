import { Navigate, Outlet } from 'react-router-dom'
import { isOnboardingPreviewWithoutAuth } from '../../config/devFlags'
import { hasBearerToken } from '../../lib/authSession'
import { useAuthStore } from '../../store/authStore'

export default function OnboardingGuard() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const hasCompletedOnboarding = useAuthStore((state) => state.hasCompletedOnboarding)
  const user = useAuthStore((state) => state.user)

  /** Tras volver de Stripe (recarga completa) el store puede tardar en hidratar; lw_token sigue válido. */
  if (!isAuthenticated && !hasBearerToken() && !isOnboardingPreviewWithoutAuth()) {
    return <Navigate to="/login" replace />
  }

  if (user?.is_admin) {
    return <Navigate to="/admin" replace />
  }

  if (user && user.email_verified_at == null) {
    return <Navigate to="/verify-email" replace />
  }

  if (hasCompletedOnboarding) {
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}
