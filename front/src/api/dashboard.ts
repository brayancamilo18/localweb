import { apiClient } from './client'
import type { ApiResponse, Business, BusinessImage, DashboardTemplatesResponse, StatsData } from '../types/api'

/** Google Business + vCard; se envían `null` en maps/reservas para limpiar enlaces manuales antiguos. */
export type BusinessIntegrationsUpdate = {
  google_business_url?: string | null
  vcard_enabled?: boolean
  google_maps_url?: string | null
  booking_url?: string | null
  instagram_url?: string | null
  tiktok_url?: string | null
  facebook_url?: string | null
}

export async function getBusiness(): Promise<Business> {
  const response = await apiClient.get<ApiResponse<Business>>('/dashboard/business')
  return response.data.data
}

export async function setBusinessSubdomain(subdomain: string): Promise<Business> {
  const response = await apiClient.post<ApiResponse<Business>>('/dashboard/subdomain', { subdomain })
  return response.data.data
}

export async function updateBusiness(data: Partial<Business>): Promise<Business> {
  const response = await apiClient.put<ApiResponse<Business>>('/dashboard/business', data)
  return response.data.data
}

export async function updateBusinessGoogleMapsUrl(url: string | null): Promise<Business> {
  return updateBusiness({ google_maps_url: url })
}

export async function updateBusinessGoogleBusinessUrl(url: string | null): Promise<Business> {
  return updateBusiness({ google_business_url: url })
}

export async function updateBusinessBookingUrl(url: string | null): Promise<Business> {
  return updateBusiness({ booking_url: url })
}

export async function updateBusinessVcardEnabled(enabled: boolean): Promise<Business> {
  return updateBusiness({ vcard_enabled: enabled })
}

export async function updateBusinessIntegrations(data: BusinessIntegrationsUpdate): Promise<Business> {
  return updateBusiness(data)
}

export async function getStats(params?: {
  from?: string
  to?: string
  granularity?: 'day' | 'hour'
}): Promise<StatsData> {
  const response = await apiClient.get<ApiResponse<StatsData>>('/dashboard/stats', {
    params: params ?? {},
  })
  return response.data.data
}

export async function getDashboardTemplates(): Promise<DashboardTemplatesResponse> {
  const response = await apiClient.get<ApiResponse<DashboardTemplatesResponse>>('/dashboard/templates')
  return response.data.data
}

export type TemplateChangePreview = {
  same_template: boolean
  template?: { id: number; name: string; slug: string }
  brand_color?: {
    has_current: boolean
    current_color: string
    current_in_new: boolean
    suggested_color: string
    new_palette: string[]
    new_default: string
    new_template_supported: boolean
  }
}

export async function previewTemplateChange(templateId: number): Promise<TemplateChangePreview> {
  const response = await apiClient.get<TemplateChangePreview>(`/dashboard/template/${templateId}/preview`)
  return response.data
}

export type ChangeBusinessTemplatePayload = {
  template_id: number
  brand_color?: string | null
  keep_current_brand_color?: boolean
}

export async function changeBusinessTemplate(payload: ChangeBusinessTemplatePayload): Promise<Business> {
  const response = await apiClient.post<ApiResponse<Business>>('/dashboard/template', payload)
  return response.data.data
}

export type BrandColorTemplateMeta = {
  usage: 'text' | 'bg' | 'mixed' | 'text_on_dark'
  bg: string
  ink: string
}

export type BrandColorState = {
  palette: string[]
  current: string | null
  effective: string
  default: string
  template_slug: string | null
  template_meta: BrandColorTemplateMeta | null
  contrast_warning: string | null
  is_pro: boolean
  is_supported: boolean
}

export async function getBrandColor(): Promise<BrandColorState> {
  const response = await apiClient.get<BrandColorState>('/dashboard/brand-color')
  return response.data
}

export async function updateBrandColor(brandColor: string | null): Promise<{
  brand_color: string | null
  effective_color: string
  contrast_warning: string | null
}> {
  const response = await apiClient.put<{
    brand_color: string | null
    effective_color: string
    contrast_warning: string | null
  }>('/dashboard/brand-color', { brand_color: brandColor })
  return response.data
}

export async function uploadImage(
  file: File,
  section: 'cover' | 'gallery' | 'about',
  onProgress?: (pct: number) => void,
): Promise<BusinessImage> {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('section', section)

  const response = await apiClient.post<ApiResponse<BusinessImage>>('/dashboard/images', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress(progressEvent) {
      if (!onProgress || !progressEvent.total) return
      onProgress(Math.round((progressEvent.loaded * 100) / progressEvent.total))
    },
  })
  return response.data.data
}

export async function deleteImage(id: number): Promise<void> {
  await apiClient.delete(`/dashboard/images/${id}`)
}

export async function reorderImages(ids: number[]): Promise<void> {
  await apiClient.put('/dashboard/images/reorder', { ids })
}

export async function uploadBusinessLogo(
  file: File,
  onProgress?: (pct: number) => void,
): Promise<Business> {
  const formData = new FormData()
  formData.append('file', file)

  const response = await apiClient.post<ApiResponse<Business>>('/dashboard/logo', formData, {
    onUploadProgress(progressEvent) {
      if (!onProgress || !progressEvent.total) return
      onProgress(Math.round((progressEvent.loaded * 100) / progressEvent.total))
    },
  })
  return response.data.data
}

export async function deleteBusinessLogo(): Promise<Business> {
  const response = await apiClient.delete<ApiResponse<Business>>('/dashboard/logo')
  return response.data.data
}

export async function uploadBusinessFavicon(
  file: File,
  onProgress?: (pct: number) => void,
): Promise<Business> {
  const formData = new FormData()
  formData.append('file', file)

  const response = await apiClient.post<ApiResponse<Business>>('/dashboard/favicon', formData, {
    onUploadProgress(progressEvent) {
      if (!onProgress || !progressEvent.total) return
      onProgress(Math.round((progressEvent.loaded * 100) / progressEvent.total))
    },
  })
  return response.data.data
}

export async function deleteBusinessFavicon(): Promise<Business> {
  const response = await apiClient.delete<ApiResponse<Business>>('/dashboard/favicon')
  return response.data.data
}
