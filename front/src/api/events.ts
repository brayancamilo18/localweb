import { apiClient } from './client'
import { prepareImageForUpload, UPLOAD_MAX_BYTES } from '../lib/imageUpload'
import type { ApiResponse, BusinessEvent } from '../types/api'

export type EventPayload = {
  title: string
  event_date: string
  location?: string | null
  description?: string | null
}

export async function getEvents(): Promise<BusinessEvent[]> {
  const response = await apiClient.get<ApiResponse<BusinessEvent[]>>('/dashboard/events')
  return response.data.data
}

export async function createEvent(data: EventPayload): Promise<BusinessEvent> {
  const response = await apiClient.post<ApiResponse<BusinessEvent>>('/dashboard/events', data)
  return response.data.data
}

export async function updateEvent(id: number, data: Partial<EventPayload>): Promise<BusinessEvent> {
  const response = await apiClient.put<ApiResponse<BusinessEvent>>(`/dashboard/events/${id}`, data)
  return response.data.data
}

export async function deleteEvent(id: number): Promise<void> {
  await apiClient.delete(`/dashboard/events/${id}`)
}

export async function uploadEventPhoto(id: number, photo: File): Promise<BusinessEvent> {
  const formData = new FormData()
  formData.append(
    'photo',
    await prepareImageForUpload(photo, {
      maxBytes: UPLOAD_MAX_BYTES.gallery,
      maxDimension: 2200,
      quality: 0.88,
    }),
  )
  const response = await apiClient.post<ApiResponse<BusinessEvent>>(
    `/dashboard/events/${id}/photo`,
    formData,
  )
  return response.data.data
}

export async function deleteEventPhoto(id: number): Promise<BusinessEvent> {
  const response = await apiClient.delete<ApiResponse<BusinessEvent>>(`/dashboard/events/${id}/photo`)
  return response.data.data
}
