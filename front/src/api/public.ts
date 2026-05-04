import { apiClient } from './client'
import type { ApiResponse, PublicBusiness } from '../types/api'

export async function getPublicBusiness(subdomain: string): Promise<PublicBusiness> {
  const response = await apiClient.get<ApiResponse<PublicBusiness>>(`/public/${subdomain}`)
  return response.data.data
}

export async function trackClick(subdomain: string, type: 'whatsapp_click' | 'phone_click'): Promise<void> {
  await apiClient.post(`/public/${subdomain}/track`, { type })
}
