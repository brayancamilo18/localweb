import axios from 'axios'
import { isOnboardingPreviewWithoutAuth } from '../config/devFlags'

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api/v1',
  withCredentials: false,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('lw_token')

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  if (config.data instanceof FormData) {
    delete config.headers['Content-Type']
  }

  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status
    /** Solo 401 = sesión inválida. 403 suele ser “no permitido” con sesión válida (no borrar token). */
    if (status === 401) {
      localStorage.removeItem('lw_token')
      try {
        localStorage.removeItem('lw-auth-store')
      } catch {
        /* ignore */
      }

      const skipRedirectToLogin =
        isOnboardingPreviewWithoutAuth() && window.location.pathname.startsWith('/onboarding')

      if (!skipRedirectToLogin && window.location.pathname !== '/login') {
        const next = encodeURIComponent(window.location.pathname + window.location.search)
        window.location.href = `/login?next=${next}`
      }
    }

    return Promise.reject(error)
  },
)
