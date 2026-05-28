import axios from 'axios'
import type { RefObject } from 'react'
import type { ShowToast } from '../components/ui/toast-system/ToastContext'
import { readFileUploadApiError } from './imageUpload'

export const UPLOAD_ERROR_TOAST_DURATION_MS = 6000

export type ImageUploadArea = 'logo' | 'gallery' | 'cover' | 'about' | 'favicon'

const NETWORK_MESSAGE =
  'No se pudo subir la imagen. Comprueba tu conexión y vuelve a intentarlo.'

const FALLBACK_MESSAGE = 'Ha ocurrido un error al subir la imagen.'

export type ResolvedUploadError = {
  message: string
  retryable: boolean
}

export function resolveImageUploadError(err: unknown): ResolvedUploadError {
  if (err instanceof Error && err.message && !err.message.startsWith('validation.')) {
    const retryable = /conexión|network|fetch/i.test(err.message)
    return { message: err.message, retryable }
  }

  if (axios.isAxiosError(err)) {
    if (!err.response) {
      return { message: NETWORK_MESSAGE, retryable: true }
    }

    if (err.response.status === 422) {
      const data = err.response.data as {
        upgrade_required?: boolean
        message?: string
        errors?: Record<string, string[]>
      }
      if (data?.upgrade_required) {
        return {
          message:
            data.message ??
            'Has alcanzado el límite de fotos para tu plan.',
          retryable: false,
        }
      }
      const apiMsg = readFileUploadApiError(data)
      if (apiMsg) {
        return { message: apiMsg, retryable: false }
      }
      return {
        message: 'No se pudo procesar la imagen. Comprueba el tamaño (máx. 10 MB) y tu conexión.',
        retryable: false,
      }
    }
  }

  return { message: FALLBACK_MESSAGE, retryable: false }
}

export function scrollToUploadArea(ref: RefObject<HTMLElement | null>): void {
  ref.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
}

type ReportUploadErrorOptions = {
  area: ImageUploadArea
  message: string
  uploadRef: RefObject<HTMLElement | null>
  showToast: ShowToast
  setInlineError: (area: ImageUploadArea, message: string | null) => void
  retry?: () => void
}

/** Toast de error + scroll al área + mensaje inline persistente. */
export function reportImageUploadError({
  area,
  message,
  uploadRef,
  showToast,
  setInlineError,
  retry,
}: ReportUploadErrorOptions): void {
  setInlineError(area, message)

  showToast({
    type: 'error',
    title: 'Error al subir la imagen',
    description: message,
    duration: UPLOAD_ERROR_TOAST_DURATION_MS,
    action: retry
      ? {
          label: 'Reintentar',
          onClick: retry,
        }
      : undefined,
  })

  scrollToUploadArea(uploadRef)
}

export function clearImageUploadError(
  setInlineError: (area: ImageUploadArea, message: string | null) => void,
  area: ImageUploadArea,
): void {
  setInlineError(area, null)
}
