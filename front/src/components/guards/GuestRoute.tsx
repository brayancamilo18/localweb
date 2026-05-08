import { Navigate, Outlet } from 'react-router-dom'
import { hasBearerToken } from '../../lib/authSession'
import { useAuthStore } from '../../store/authStore'

export default function GuestRoute() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const hasCompletedOnboarding = useAuthStore((state) => state.hasCompletedOnboarding)
  const user = useAuthStore((state) => state.user)

  if (isAuthenticated || hasBearerToken()) {
    if (user?.is_admin) {
      return <Navigate to="/admin" replace />
    }
    if (user && user.email_verified_at == null) {
      return <Navigate to="/verify-email" replace />
    }
    return <Navigate to={hasCompletedOnboarding ? '/dashboard' : '/onboarding'} replace />
  }

  return <Outlet />
}
