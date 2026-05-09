import { Navigate, Outlet } from 'react-router-dom'
import { isOnboardingPreviewWithoutAuth } from '../../config/devFlags'
import { useAuth } from '../../hooks/useAuth'
import { useAuthStore } from '../../store/authStore'

export default function OnboardingGuard() {
  const { isLoading, isAuthenticated } = useAuth()
  const hasCompletedOnboarding = useAuthStore((state) => state.hasCompletedOnboarding)
  const user = useAuthStore((state) => state.user)

  if (isLoading && !isAuthenticated) {
    return null
  }

  if (!isAuthenticated && !isOnboardingPreviewWithoutAuth()) {
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
