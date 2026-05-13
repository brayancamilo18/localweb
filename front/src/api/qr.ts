import { apiClient } from './client'
import type { ApiResponse } from '../types/api'

export interface QrInfo {
  public_url: string
  is_pro: boolean
  business_name: string
  tagline: string | null
  has_logo: boolean
  default_color: string
  template_color: string | null
}

export async function getQrInfo(): Promise<QrInfo> {
  const res = await apiClient.get<ApiResponse<QrInfo>>('/qr/info')
  return res.data.data
}

/**
 * URL absoluta para descargar el PNG del QR. La GET la hace el navegador con cookies de Sanctum.
 * Si se pasa `color`, debe estar en formato #RRGGBB.
 */
export function getQrPngDownloadUrl(opts: { size?: number; color?: string } = {}): string {
  const base = (import.meta.env.VITE_API_URL ?? '/api/v1').replace(/\/$/, '')
  const params = new URLSearchParams()
  if (opts.size) params.set('size', String(opts.size))
  if (opts.color) params.set('color', opts.color)
  const qs = params.toString()
  return `${base}/qr/png${qs ? '?' + qs : ''}`
}

export interface QrPosterPayload {
  size?: 'a4' | 'a5' | 'square'
  message?: string
  include_logo?: boolean
  color?: string
  // Logo del negocio convertido a data URI base64 en el frontend.
  // Evita que dompdf intente hacer un fetch HTTP externo desde el servidor.
  logo_data_uri?: string
}

export async function postQrPoster(payload: QrPosterPayload): Promise<Blob> {
  const res = await apiClient.post('/qr/poster', payload, { responseType: 'blob' })
  return res.data as Blob
}

/**
 * Descarga la imagen del logo y la convierte a data URI base64.
 * Necesario para:
 *  1. Mostrarla en la previsualización (`QrPosterPreview`).
 *  2. Enviarla en el body del POST /qr/poster para que dompdf
 *     pueda incrustarla en el PDF sin hacer requests HTTP externos.
 *
 * Si la URL falla (CORS, 404, etc.) devuelve null silenciosamente.
 */
export async function fetchLogoAsDataUri(logoUrl: string): Promise<string | null> {
  try {
    const res = await fetch(logoUrl, { credentials: 'omit', mode: 'cors' })
    if (!res.ok) return null
    const blob = await res.blob()
    return await new Promise<string | null>((resolve) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(typeof reader.result === 'string' ? reader.result : null)
      reader.onerror = () => resolve(null)
      reader.readAsDataURL(blob)
    })
  } catch {
    return null
  }
}
