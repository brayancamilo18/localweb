import { apiClient } from './client'
import type { ApiResponse, AuthResponse, Business, LoginResponse, User } from '../types/api'

export interface ReferralContext {
  referrer_name: string
  promo_code_first_free: string
}

export interface MeData {
  user: User
  business: Business | null
  referral_context?: ReferralContext | null
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  const response = await apiClient.post<ApiResponse<LoginResponse>>('/auth/login', { email, password })
  return response.data.data
}

export async function register(
  name: string,
  email: string,
  password: string,
  password_confirmation: string,
  business: {
    business_name: string
    sector: string
    city: string
    country: string
    country_code: string
  },
  referral_code?: string,
  marketing_consent?: boolean,
  accept_terms?: boolean,
): Promise<AuthResponse> {
  const payload: Record<string, string | boolean> = {
    name,
    email,
    password,
    password_confirmation,
    business_name: business.business_name,
    sector: business.sector,
    city: business.city,
    country: business.country,
    country_code: business.country_code,
    accept_terms: accept_terms === true,
  }
  if (referral_code) {
    payload.referral_code = referral_code
  }
  if (marketing_consent) {
    payload.marketing_consent = true
  }
  const response = await apiClient.post<ApiResponse<AuthResponse>>('/auth/register', payload)
  return response.data.data
}

export async function logout(): Promise<void> {
  await apiClient.post('/auth/logout')
}

export async function me(): Promise<MeData> {
  const response = await apiClient.get<ApiResponse<MeData>>('/auth/me')
  return response.data.data
}

export async function resendEmailVerification(): Promise<{ message: string; alreadyVerified: boolean }> {
  const response = await apiClient.post<{ message: string }>('/auth/email/verification-notification')
  return {
    message: response.data?.message ?? '',
    alreadyVerified: response.status === 200,
  }
}

export async function forgotPassword(email: string): Promise<{ message: string }> {
  const response = await apiClient.post<{ message: string }>('/auth/forgot-password', { email })
  return { message: response.data?.message ?? '' }
}

export async function resetPassword(
  token: string,
  email: string,
  password: string,
  password_confirmation: string,
): Promise<{ message: string }> {
  const response = await apiClient.post<{ message: string }>('/auth/reset-password', {
    token,
    email,
    password,
    password_confirmation,
  })
  return { message: response.data?.message ?? '' }
}

export interface SocialMe {
  id?: number
  name: string
  email: string
  provider: string | null
  avatar_url: string | null
  business_id: number | null
  terms_accepted_at: string | null
}

export async function socialMe(): Promise<SocialMe> {
  const response = await apiClient.get<ApiResponse<SocialMe>>('/auth/social/me')
  return response.data.data
}

export async function completeSocialRegistration(
  business: {
    business_name: string
    sector: string
    city: string
    country: string
    country_code: string
  },
  accept_terms: boolean,
  marketing_consent: boolean,
  referral_code?: string,
): Promise<AuthResponse> {
  const payload: Record<string, string | boolean> = {
    business_name: business.business_name,
    sector: business.sector,
    city: business.city,
    country: business.country,
    country_code: business.country_code,
    accept_terms,
  }
  if (marketing_consent) payload.marketing_consent = true
  if (referral_code) payload.referral_code = referral_code
  const response = await apiClient.post<ApiResponse<AuthResponse>>(
    '/auth/social/complete-registration',
    payload,
  )
  return response.data.data
}
