import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useAuthStore } from '../../store/authStore'

export default function GuestRoute() {
  const { isLoading, isAuthenticated } = useAuth()
  const hasCompletedOnboarding = useAuthStore((state) => state.hasCompletedOnboarding)
  const user = useAuthStore((state) => state.user)

  // Mientras /auth/me está en vuelo y no hay user en memoria, mostramos /login (la
  // ruta de destino para no autenticados). Si la cookie resulta válida, el efecto del
  // useAuth setea user y este guard reevalúa, redirigiendo a /dashboard u /onboarding.
  if (isLoading && !isAuthenticated) {
    return <Outlet />
  }

  if (isAuthenticated) {
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
