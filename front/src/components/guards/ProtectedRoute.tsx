import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useAuthStore } from '../../store/authStore'

export default function ProtectedRoute() {
  const { isLoading, isAuthenticated } = useAuth()
  const hasCompletedOnboarding = useAuthStore((state) => state.hasCompletedOnboarding)
  const user = useAuthStore((state) => state.user)

  // Primera carga: aún no sabemos si la cookie es válida. No redirigir todavía.
  if (isLoading && !isAuthenticated) {
    return null
  }

  if (!isAuthenticated) {
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
