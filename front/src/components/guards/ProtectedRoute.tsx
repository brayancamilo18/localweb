import { Navigate, Outlet } from 'react-router-dom'
import { hasBearerToken } from '../../lib/authSession'
import { useAuthStore } from '../../store/authStore'

export default function ProtectedRoute() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const hasCompletedOnboarding = useAuthStore((state) => state.hasCompletedOnboarding)
  const user = useAuthStore((state) => state.user)

  if (!isAuthenticated && !hasBearerToken()) {
    return <Navigate to="/login" replace />
  }

  if (user && user.email_verified_at == null) {
    return <Navigate to="/verify-email" replace />
  }

  if (!hasCompletedOnboarding) {
    return <Navigate to="/onboarding" replace />
  }

  return <Outlet />
}
