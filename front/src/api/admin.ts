import type { AxiosRequestConfig } from 'axios'
import { apiClient } from './client'
import type {
  AdminBusinessListItem,
  AdminBusinessShow,
  AdminOverview,
  AdminPagination,
  AdminSectorRow,
  AdminStatsTemplateItem,
  AdminTemplateRow,
  AdminTimeSeries,
  AdminTopPageRow,
  AdminUserRow,
  ApiResponse,
} from '../types/api'

const ADMIN_PREFIX = '/admin'

/** Path relativo al prefijo `/admin` (p.ej. `/stats/overview` o `stats/overview`). */
export function adminPath(path: string): string {
  const p = path.startsWith('/') ? path : `/${path}`
  return `${ADMIN_PREFIX}${p}`
}

export async function adminGet<T>(path: string, config?: AxiosRequestConfig): Promise<T> {
  const response = await apiClient.get<ApiResponse<T>>(adminPath(path), config)
  return response.data.data
}

export async function adminPost<T>(path: string, body?: unknown, config?: AxiosRequestConfig): Promise<T> {
  const response = await apiClient.post<ApiResponse<T>>(adminPath(path), body, config)
  return response.data.data
}

export async function adminPatch<T>(path: string, body?: unknown, config?: AxiosRequestConfig): Promise<T> {
  const response = await apiClient.patch<ApiResponse<T>>(adminPath(path), body, config)
  return response.data.data
}

export async function adminDelete(path: string, config?: AxiosRequestConfig): Promise<void> {
  await apiClient.delete(adminPath(path), config)
}

export async function fetchAdminOverview(): Promise<AdminOverview> {
  return adminGet<AdminOverview>('/stats/overview')
}

export async function fetchAdminTimeSeries(params: {
  metric: 'registrations' | 'visits'
  range: '7d' | '30d' | '90d'
}): Promise<AdminTimeSeries> {
  return adminGet<AdminTimeSeries>('/stats/timeseries', { params })
}

export async function fetchAdminSectors(): Promise<{ sectors: AdminSectorRow[] }> {
  return adminGet<{ sectors: AdminSectorRow[] }>('/stats/sectors')
}

export async function fetchAdminStatsTemplateUsage(): Promise<{ templates: AdminStatsTemplateItem[] }> {
  return adminGet<{ templates: AdminStatsTemplateItem[] }>('/stats/templates')
}

export async function fetchAdminBusinesses(params?: {
  page?: number
  per_page?: number
  search?: string
  sector?: string
  plan?: string
  is_published?: boolean
  onboarding_completed?: boolean
  with_trashed?: boolean
  sort?: string
  direction?: string
}): Promise<{ items: AdminBusinessListItem[]; pagination: AdminPagination }> {
  return adminGet<{ items: AdminBusinessListItem[]; pagination: AdminPagination }>('/businesses', {
    params,
  })
}

export async function fetchAdminBusiness(id: number): Promise<{ business: AdminBusinessShow }> {
  return adminGet<{ business: AdminBusinessShow }>(`/businesses/${id}`)
}

export async function patchAdminBusiness(id: number, body: Record<string, unknown>): Promise<{ business: AdminBusinessShow }> {
  return adminPatch<{ business: AdminBusinessShow }>(`/businesses/${id}`, body)
}

export async function toggleAdminBusinessPublish(id: number): Promise<{ is_published: boolean }> {
  const response = await apiClient.patch<ApiResponse<{ is_published: boolean }>>(
    adminPath(`/businesses/${id}/toggle-publish`),
  )
  return response.data.data
}

export async function softDeleteAdminBusiness(id: number): Promise<void> {
  await apiClient.delete(adminPath(`/businesses/${id}`))
}

export async function restoreAdminBusiness(id: number): Promise<void> {
  await apiClient.post(adminPath(`/businesses/${id}/restore`))
}

export async function forceDeleteAdminBusiness(id: number): Promise<void> {
  await apiClient.delete(adminPath(`/businesses/${id}/force`))
}

export async function fetchAdminTemplates(): Promise<{ templates: AdminTemplateRow[] }> {
  return adminGet<{ templates: AdminTemplateRow[] }>('/templates')
}

export async function toggleAdminTemplateActive(id: number): Promise<{ template: AdminTemplateRow }> {
  return adminPatch<{ template: AdminTemplateRow }>(`/templates/${id}/toggle-active`)
}

export async function toggleAdminTemplatePro(id: number): Promise<{ template: AdminTemplateRow }> {
  return adminPatch<{ template: AdminTemplateRow }>(`/templates/${id}/toggle-pro`)
}

export async function fetchAdminUsers(params?: {
  page?: number
  per_page?: number
  search?: string
  has_business?: boolean
  email_verified?: boolean
}): Promise<{ items: AdminUserRow[]; pagination: AdminPagination }> {
  return adminGet<{ items: AdminUserRow[]; pagination: AdminPagination }>('/users', { params })
}

export async function resendAdminUserVerification(userId: number): Promise<{ resent: boolean }> {
  return adminPost<{ resent: boolean }>(`/users/${userId}/resend-verification`)
}

export async function fetchAdminTopPages(params: {
  range?: '7d' | '30d' | '90d' | 'all'
  event_type?: 'visit' | 'whatsapp_click' | 'phone_click' | 'all'
  limit?: number
}): Promise<{ pages: AdminTopPageRow[] }> {
  return adminGet<{ pages: AdminTopPageRow[] }>('/stats/top-pages', { params })
}
