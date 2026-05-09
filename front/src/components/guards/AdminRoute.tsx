import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

function AdminLoading() {
  return (
    <div
      style={{
        flex: 1,
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--lw-bg)',
        color: 'var(--lw-text-2)',
        fontSize: 14,
      }}
    >
      Cargando panel admin…
    </div>
  )
}

export default function AdminRoute() {
  const { isLoading, isAuthenticated, user } = useAuth()

  if (isLoading && !user) {
    return <AdminLoading />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (!user?.is_admin) {
    return <Navigate to="/" replace />
  }

  if (user.email_verified_at == null) {
    return <Navigate to="/verify-email" replace />
  }

  return <Outlet />
}
