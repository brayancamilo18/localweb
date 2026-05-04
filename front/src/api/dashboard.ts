import { apiClient } from './client'
import type { ApiResponse, Business, BusinessImage, StatsData, Template } from '../types/api'

/** Google Business + vCard; se envían `null` en maps/reservas para limpiar enlaces manuales antiguos. */
export type BusinessIntegrationsUpdate = {
  google_business_url?: string | null
  vcard_enabled?: boolean
  google_maps_url?: string | null
  booking_url?: string | null
}

export async function getBusiness(): Promise<Business> {
  const response = await apiClient.get<ApiResponse<Business>>('/dashboard/business')
  return response.data.data
}

export async function updateBusiness(data: Partial<Business> & { template_id?: number }): Promise<Business> {
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

export async function getStats(): Promise<StatsData> {
  const response = await apiClient.get<ApiResponse<StatsData>>('/dashboard/stats')
  return response.data.data
}

export async function getTemplates(): Promise<Template[]> {
  const response = await apiClient.get<ApiResponse<Template[]>>('/dashboard/templates')
  return response.data.data
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
