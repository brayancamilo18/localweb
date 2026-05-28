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
  current_password?: string
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

export type ActiveSession = {
  id: string
  ipAddress: string | null
  userAgentLabel: string
  lastActivity: string
  isCurrent: boolean
}

type ActiveSessionApi = {
  id: string
  ip_address: string | null
  user_agent_label: string
  last_activity: string
  is_current: boolean
}

function mapActiveSession(row: ActiveSessionApi): ActiveSession {
  return {
    id: row.id,
    ipAddress: row.ip_address,
    userAgentLabel: row.user_agent_label,
    lastActivity: row.last_activity,
    isCurrent: row.is_current,
  }
}

export async function getSessions(): Promise<ActiveSession[]> {
  const res = await apiClient.get<ApiResponse<{ sessions: ActiveSessionApi[] }>>('/account/sessions')
  return res.data.data.sessions.map(mapActiveSession)
}

export async function revokeOtherSessions(currentPassword: string): Promise<{ revoked: number }> {
  const res = await apiClient.post<ApiResponse<{ revoked: number }>>(
    '/account/sessions/revoke-others',
    { current_password: currentPassword },
  )
  return res.data.data
}

export type SecurityEventType = 'login' | 'password_changed' | 'email_changed' | 'sessions_revoked'

export type SecurityEvent = {
  type: SecurityEventType
  ipAddress: string | null
  userAgentLabel: string
  createdAt: string
}

type SecurityEventApi = {
  type: SecurityEventType
  ip_address: string | null
  user_agent_label: string
  created_at: string
}

function mapSecurityEvent(row: SecurityEventApi): SecurityEvent {
  return {
    type: row.type,
    ipAddress: row.ip_address,
    userAgentLabel: row.user_agent_label,
    createdAt: row.created_at,
  }
}

export async function getSecurityEvents(): Promise<SecurityEvent[]> {
  const res = await apiClient.get<ApiResponse<{ events: SecurityEventApi[] }>>('/account/security-events')
  return res.data.data.events.map(mapSecurityEvent)
}

export async function deleteAccount(currentPassword: string, confirmation: string): Promise<void> {
  await apiClient.delete('/account', {
    data: {
      current_password: currentPassword,
      confirmation,
    },
  })
}
