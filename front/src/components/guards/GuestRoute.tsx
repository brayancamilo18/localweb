import { Navigate, Outlet } from 'react-router-dom'
import { hasBearerToken } from '../../lib/authSession'
import { useAuthStore } from '../../store/authStore'

export default function GuestRoute() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const hasCompletedOnboarding = useAuthStore((state) => state.hasCompletedOnboarding)

  if (isAuthenticated || hasBearerToken()) {
    return <Navigate to={hasCompletedOnboarding ? '/dashboard' : '/onboarding'} replace />
  }

  return <Outlet />
}
