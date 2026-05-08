import type { AxiosRequestConfig } from 'axios'
import { useMemo } from 'react'
import { apiClient } from '../api/client'
import { adminPath } from '../api/admin'

/**
 * Cliente admin sobre el mismo `apiClient` (token, interceptores), con prefijo `/admin`.
 */
export function useAdminApi() {
  return useMemo(
    () => ({
      path: adminPath,
      get: <T>(relativePath: string, config?: AxiosRequestConfig) =>
        apiClient.get<T>(adminPath(relativePath), config),
      post: <T>(relativePath: string, body?: unknown, config?: AxiosRequestConfig) =>
        apiClient.post<T>(adminPath(relativePath), body, config),
      patch: <T>(relativePath: string, body?: unknown, config?: AxiosRequestConfig) =>
        apiClient.patch<T>(adminPath(relativePath), body, config),
      delete: (relativePath: string, config?: AxiosRequestConfig) =>
        apiClient.delete(adminPath(relativePath), config),
    }),
    [],
  )
}
