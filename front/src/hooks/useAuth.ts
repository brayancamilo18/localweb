import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { me } from '../api/auth'
import { keys } from '../api/queryKeys'
import { useAuthStore } from '../store/authStore'

export function useAuth() {
  const token = localStorage.getItem('lw_token')
  const { user, business, isAuthenticated, setAuth, clearAuth } = useAuthStore()

  const query = useQuery({
    queryKey: keys.auth.me,
    queryFn: me,
    enabled: Boolean(token),
    retry: false,
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  })

  useEffect(() => {
    if (query.data && token) {
      setAuth(token, query.data.user, query.data.business)
    }
  }, [query.data, setAuth, token])

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
    isAuthenticated,
  }
}
