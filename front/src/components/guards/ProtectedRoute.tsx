import { Navigate, Outlet } from 'react-router-dom'
import { hasBearerToken } from '../../lib/authSession'
import { useAuthStore } from '../../store/authStore'

export default function ProtectedRoute() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const hasCompletedOnboarding = useAuthStore((state) => state.hasCompletedOnboarding)

  if (!isAuthenticated && !hasBearerToken()) {
    return <Navigate to="/login" replace />
  }

  if (!hasCompletedOnboarding) {
    return <Navigate to="/onboarding" replace />
  }

  return <Outlet />
}
