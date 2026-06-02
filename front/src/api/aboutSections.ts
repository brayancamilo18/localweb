import { apiClient } from './client'
import { prepareImageForUpload, UPLOAD_MAX_BYTES } from '../lib/imageUpload'
import type { ApiResponse, BusinessAboutSection } from '../types/api'

export type AboutSectionPayload = {
  title?: string | null
  description?: string | null
}

export async function getAboutSections(): Promise<BusinessAboutSection[]> {
  const response = await apiClient.get<ApiResponse<BusinessAboutSection[]>>('/dashboard/about-sections')
  return response.data.data
}

export async function createAboutSection(data: AboutSectionPayload): Promise<BusinessAboutSection> {
  const response = await apiClient.post<ApiResponse<BusinessAboutSection>>('/dashboard/about-sections', data)
  return response.data.data
}

export async function updateAboutSection(
  id: number,
  data: AboutSectionPayload,
): Promise<BusinessAboutSection> {
  const response = await apiClient.put<ApiResponse<BusinessAboutSection>>(
    `/dashboard/about-sections/${id}`,
    data,
  )
  return response.data.data
}

export async function deleteAboutSection(id: number): Promise<void> {
  await apiClient.delete(`/dashboard/about-sections/${id}`)
}

export async function uploadAboutSectionPhoto(id: number, photo: File): Promise<BusinessAboutSection> {
  const formData = new FormData()
  formData.append(
    'photo',
    await prepareImageForUpload(photo, {
      maxBytes: UPLOAD_MAX_BYTES.gallery,
      maxDimension: 2200,
      quality: 0.88,
    }),
  )
  const response = await apiClient.post<ApiResponse<BusinessAboutSection>>(
    `/dashboard/about-sections/${id}/photo`,
    formData,
  )
  return response.data.data
}

export async function deleteAboutSectionPhoto(id: number): Promise<BusinessAboutSection> {
  const response = await apiClient.delete<ApiResponse<BusinessAboutSection>>(
    `/dashboard/about-sections/${id}/photo`,
  )
  return response.data.data
}
