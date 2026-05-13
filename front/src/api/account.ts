import { apiClient } from './client'
import type { ApiResponse, User } from '../types/api'

/**
 * API client de la sección «Mi cuenta». De momento solo expone el perfil:
 * los endpoints de billing extendido (facturas, payment-method, upcoming,
 * cancel/resume) se conectarán en los próximos prompts.
 */
export interface AccountProfile {
  user: User
  business_name: string | null
}

export interface UpdateProfilePayload {
  name?: string
  email?: string
}

export interface UpdateProfileResponse extends AccountProfile {
  /**
   * `true` si el PATCH cambió `email`. La UI lo usa para mostrar el aviso de
   * «hemos enviado un correo de verificación» y para invalidar caches que
   * dependen del estado verificado del usuario.
   */
  email_changed: boolean
}

export async function getAccountProfile(): Promise<AccountProfile> {
  const res = await apiClient.get<ApiResponse<AccountProfile>>('/account/profile')
  return res.data.data
}

export async function updateAccountProfile(
  payload: UpdateProfilePayload,
): Promise<UpdateProfileResponse> {
  const res = await apiClient.patch<ApiResponse<UpdateProfileResponse>>('/account/profile', payload)
  return res.data.data
}

export async function updateAccountPassword(payload: {
  current_password: string
  password: string
  password_confirmation: string
}): Promise<{ message: string }> {
  const res = await apiClient.post<ApiResponse<{ message: string }>>('/account/password', payload)
  return res.data.data
}
