import { apiClient } from './client'
import type { ApiResponse, AuthResponse, Business, LoginResponse, User } from '../types/api'

export async function login(email: string, password: string): Promise<LoginResponse> {
  const response = await apiClient.post<ApiResponse<LoginResponse>>('/auth/login', { email, password })
  return response.data.data
}

export async function register(
  name: string,
  email: string,
  password: string,
  password_confirmation: string,
): Promise<AuthResponse> {
  const response = await apiClient.post<ApiResponse<AuthResponse>>('/auth/register', {
    name,
    email,
    password,
    password_confirmation,
  })
  return response.data.data
}

export async function logout(): Promise<void> {
  await apiClient.post('/auth/logout')
}

export async function me(): Promise<{ user: User; business: Business | null }> {
  const response = await apiClient.get<ApiResponse<{ user: User; business: Business | null }>>('/auth/me')
  return response.data.data
}

export async function resendEmailVerification(): Promise<{ message: string; alreadyVerified: boolean }> {
  const response = await apiClient.post<{ message: string }>('/auth/email/verification-notification')
  return {
    message: response.data?.message ?? '',
    alreadyVerified: response.status === 200,
  }
}
