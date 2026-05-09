import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { me } from '../api/auth'
import { keys } from '../api/queryKeys'
import { useAuthStore } from '../store/authStore'

/**
 * Auth: Sanctum SPA mode.
 *
 * La verdad la dicta /auth/me: si responde 200 estamos logueados (cookie de sesión
 * válida), si responde 401 no. El store local solo cachea user/business para evitar
 * parpadeos al pintar la UI.
 *
 * Este hook se monta una vez en el árbol (en App) y todos los demás consumidores leen
 * el resultado del mismo `queryKey: keys.auth.me`, así no hay refetches duplicados.
 */
export function useAuth() {
  const { user, business, isAuthenticated, setAuth, clearAuth } = useAuthStore()

  const query = useQuery({
    queryKey: keys.auth.me,
    queryFn: me,
    retry: false,
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  })

  useEffect(() => {
    if (query.data) {
      setAuth(query.data.user, query.data.business)
    }
  }, [query.data, setAuth])

  useEffect(() => {
    if (!query.isError) return
    const status = (query.error as { response?: { status?: number } })?.response?.status
    if (status === 401) {
      clearAuth()
    }
  }, [query.isError, query.error, clearAuth])

  return {
    user,
    business,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isAuthenticated,
  }
}
