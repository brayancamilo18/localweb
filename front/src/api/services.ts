import { apiClient } from './client'
import type { ApiResponse, BusinessService } from '../types/api'

export type CreateServicePayload = {
  name: string
  price?: number | null
  description?: string | null
}

export type UpdateServicePayload = {
  name?: string
  price?: number | null
  description?: string | null
}

export async function getServices(): Promise<BusinessService[]> {
  const response = await apiClient.get<ApiResponse<BusinessService[]>>('/dashboard/services')
  return response.data.data
}

export async function createService(data: CreateServicePayload): Promise<BusinessService> {
  const response = await apiClient.post<ApiResponse<BusinessService>>('/dashboard/services', data)
  return response.data.data
}

export async function updateService(id: number, data: UpdateServicePayload): Promise<BusinessService> {
  const response = await apiClient.put<ApiResponse<BusinessService>>(`/dashboard/services/${id}`, data)
  return response.data.data
}

export async function deleteService(id: number): Promise<void> {
  await apiClient.delete(`/dashboard/services/${id}`)
}

export async function reorderServices(ids: number[]): Promise<void> {
  await apiClient.put('/dashboard/services/reorder', { ids })
}
