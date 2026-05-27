import { apiClient } from './client'
import type {
  ApiResponse,
  DashboardTemplatesResponse,
  OnboardingStatus,
  Schedule,
  Step7Response,
  StepResponse,
  Template,
} from '../types/api'
import { compressImageForUpload, compressImagesForUpload } from '../utils/compressImageForUpload'

function normalizeOnboardingTemplatesPayload(payload: unknown): Template[] {
  if (Array.isArray(payload)) return payload
  if (payload && typeof payload === 'object' && Array.isArray((payload as DashboardTemplatesResponse).templates)) {
    return (payload as DashboardTemplatesResponse).templates
  }
  return []
}

export async function fetchOnboardingTemplates(): Promise<Template[]> {
  const response = await apiClient.get<ApiResponse<Template[] | DashboardTemplatesResponse>>('/onboarding/templates')
  return normalizeOnboardingTemplatesPayload(response.data.data)
}

export async function getStatus(): Promise<OnboardingStatus> {
  const response = await apiClient.get<ApiResponse<OnboardingStatus>>('/onboarding/status')
  return response.data.data
}

/** Borra el progreso del onboarding (vuelve al paso 1). Se usa al cerrar sesión en el wizard. */
export async function resetOnboarding(): Promise<{ ok: boolean; step: number }> {
  const response = await apiClient.post<ApiResponse<{ ok: boolean; step: number }>>('/onboarding/reset')
  return response.data.data
}

export async function step1(data: {
  template_id: number
  sector: string
  logo?: File | null
  removeLogo?: boolean
}): Promise<StepResponse> {
  const formData = new FormData()
  formData.append('template_id', String(data.template_id))
  formData.append('sector', data.sector)
  if (data.removeLogo) {
    formData.append('remove_logo', '1')
  }
  if (data.logo) {
    const ready = await compressImageForUpload(data.logo, { maxSide: 1600, quality: 0.88 })
    formData.append('logo', ready)
  }

  const response = await apiClient.post<ApiResponse<StepResponse>>('/onboarding/step/1', formData)
  return response.data.data
}

export async function step2(
  data: {
    cover: File
    cover2?: File
    cover3?: File
    logo?: File | null
    removeLogo?: boolean
  },
  onProgress?: (pct: number) => void,
): Promise<StepResponse & { preview_url: string }> {
  const readyCover = await compressImageForUpload(data.cover, { maxSide: 2560, quality: 0.88 })
  const formData = new FormData()
  formData.append('cover', readyCover)
  if (data.cover2) {
    formData.append('cover2', await compressImageForUpload(data.cover2, { maxSide: 2560, quality: 0.88 }))
  }
  if (data.cover3) {
    formData.append('cover3', await compressImageForUpload(data.cover3, { maxSide: 2560, quality: 0.88 }))
  }
  if (data.removeLogo) {
    formData.append('remove_logo', '1')
  }
  if (data.logo) {
    formData.append('logo', await compressImageForUpload(data.logo, { maxSide: 1600, quality: 0.88 }))
  }
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
  const formData = new FormData()
  if (photos.length > 0) {
    const ready = await compressImagesForUpload(photos, { maxSide: 2200, quality: 0.86 })
    ready.forEach((photo) => formData.append('photos[]', photo))
  }

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
  city: string
  country: string
  country_code: string
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

/**
 * Cierra el onboarding (set onboarding_completed_at en backend). En Free lo dispara
 * step8; en Pro/Pending step8 publica pero no cierra, y este endpoint se llama desde
 * Step9 «Ir a mi dashboard». Idempotente: si ya estaba cerrado devuelve 200 igual.
 */
export async function finalizeOnboarding(): Promise<{ ok: boolean }> {
  const response = await apiClient.post<ApiResponse<{ ok: boolean }>>('/onboarding/finalize')
  return response.data.data
}
