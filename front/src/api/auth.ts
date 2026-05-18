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
  referral_code?: string,
): Promise<AuthResponse> {
  const payload: Record<string, string> = {
    name,
    email,
    password,
    password_confirmation,
  }
  if (referral_code) {
    payload.referral_code = referral_code
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
