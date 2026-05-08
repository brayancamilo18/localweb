import { Navigate, Outlet } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { me } from '../../api/auth'
import { keys } from '../../api/queryKeys'
import { hasBearerToken } from '../../lib/authSession'
import { useAuthStore } from '../../store/authStore'

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
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('lw_token') : null
  const user = useAuthStore((s) => s.user)

  const { isLoading, isFetching } = useQuery({
    queryKey: keys.auth.me,
    queryFn: me,
    enabled: Boolean(token ?? hasBearerToken()),
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  })

  const loading = Boolean(token ?? hasBearerToken()) && (isLoading || isFetching) && !user

  if (!(token ?? hasBearerToken())) {
    return <Navigate to="/login" replace />
  }

  if (loading) {
    return <AdminLoading />
  }

  if (!user?.is_admin) {
    return <Navigate to="/" replace />
  }

  if (user.email_verified_at == null) {
    return <Navigate to="/verify-email" replace />
  }

  return <Outlet />
}
