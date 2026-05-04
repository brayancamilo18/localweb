import { apiClient } from './client'
import type { ApiResponse, OnboardingStatus, Schedule, Step7Response, StepResponse, Template } from '../types/api'
import { compressImageForUpload, compressImagesForUpload } from '../utils/compressImageForUpload'

export async function fetchOnboardingTemplates(): Promise<Template[]> {
  const response = await apiClient.get<ApiResponse<Template[]>>('/onboarding/templates')
  return response.data.data
}

export async function getStatus(): Promise<OnboardingStatus> {
  const response = await apiClient.get<ApiResponse<OnboardingStatus>>('/onboarding/status')
  return response.data.data
}

export async function step1(data: { template_id: number; sector: string }): Promise<StepResponse> {
  const response = await apiClient.post<ApiResponse<StepResponse>>('/onboarding/step/1', data)
  return response.data.data
}

export async function step2(
  file: File,
  onProgress?: (pct: number) => void,
): Promise<StepResponse & { preview_url: string }> {
  const ready = await compressImageForUpload(file, { maxSide: 2560, quality: 0.88 })
  const formData = new FormData()
  formData.append('cover', ready)
  const response = await apiClient.post<ApiResponse<StepResponse & { preview_url: string }>>('/onboarding/step/2', formData, {
    onUploadProgress(progressEvent) {
      if (!onProgress || !progressEvent.total) return
      onProgress(Math.round((progressEvent.loaded * 100) / progressEvent.total))
    },
  })
  return response.data.data
}

export async function step3(data: {
  business_name: string
  tagline?: string
  description?: string
  about_photo?: File
}): Promise<StepResponse> {
  const formData = new FormData()
  formData.append('business_name', data.business_name)
  if (data.tagline) formData.append('tagline', data.tagline)
  if (data.description) formData.append('description', data.description)
  if (data.about_photo) {
    formData.append('about_photo', await compressImageForUpload(data.about_photo, { maxSide: 2200, quality: 0.88 }))
  }

  const response = await apiClient.post<ApiResponse<StepResponse>>('/onboarding/step/3', formData)
  return response.data.data
}

export async function step4(photos: File[]): Promise<StepResponse> {
  const ready = await compressImagesForUpload(photos, { maxSide: 2200, quality: 0.86 })
  const formData = new FormData()
  ready.forEach((photo) => formData.append('photos[]', photo))

  const response = await apiClient.post<ApiResponse<StepResponse>>('/onboarding/step/4', formData)
  return response.data.data
}

/**
 * Descarga las URLs de galería del status (borrador en caché o imágenes ya publicadas en R2)
 * y las convierte en `File[]` para rellenar el paso 4 sin perder fotos al volver de Stripe o recargar.
 */
export async function hydrateGalleryFromServerUrls(urls: string[]): Promise<File[]> {
  if (urls.length === 0) return []

  return Promise.all(
    urls.map(async (raw, i) => {
      const trimmed = raw.trim()
      if (/^https?:\/\//i.test(trimmed)) {
        const res = await fetch(trimmed)
        if (!res.ok) {
          throw new Error(`No se pudo cargar la imagen ${i + 1}`)
        }
        const blob = await res.blob()
        return new File([blob], `gallery-${i}.jpg`, { type: blob.type || 'image/jpeg' })
      }
      const path = trimmed.startsWith('/api/v1') ? trimmed.slice('/api/v1'.length) : trimmed
      const res = await apiClient.get(path.startsWith('/') ? path : `/${path}`, { responseType: 'blob' })
      const blob = res.data as Blob
      return new File([blob], `gallery-${i}.jpg`, { type: blob.type || 'image/jpeg' })
    }),
  )
}

export async function step5(schedule: Schedule): Promise<StepResponse> {
  const response = await apiClient.post<ApiResponse<StepResponse>>('/onboarding/step/5', { schedule })
  return response.data.data
}

export async function step6(data: {
  address: string
  phone: string
  email: string
}): Promise<StepResponse & { geocoded: boolean }> {
  const response = await apiClient.post<ApiResponse<StepResponse & { geocoded: boolean }>>('/onboarding/step/6', data)
  return response.data.data
}

export async function step7(data: {
  plan: 'free' | 'pro'
  subdomain?: string
}): Promise<Step7Response> {
  const response = await apiClient.post<ApiResponse<Step7Response>>('/onboarding/step/7', data)
  return response.data.data
}

export async function step8(): Promise<{ ok: boolean; public_url: string }> {
  const response = await apiClient.post<ApiResponse<{ ok: boolean; public_url: string }>>('/onboarding/step/8')
  return response.data.data
}
