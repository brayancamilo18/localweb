import { apiClient } from './client'
import type { ApiResponse } from '../types/api'

export type BillingStatus = {
  plan: string
  is_pro: boolean
  is_free: boolean
  subscription_status?: string | null
  renewal_date?: number | null
  cancel_at_period_end?: boolean
}

export async function getBillingStatus(): Promise<BillingStatus> {
  const res = await apiClient.get<ApiResponse<BillingStatus>>('/billing/status')
  return res.data.data
}

export async function postCheckout(): Promise<string> {
  const res = await apiClient.post<ApiResponse<{ checkout_url: string }>>('/billing/checkout')
  return res.data.data.checkout_url
}

export async function postPortal(): Promise<string> {
  const res = await apiClient.post<ApiResponse<{ portal_url: string }>>('/billing/portal')
  return res.data.data.portal_url
}
