import { apiClient } from './client'
import type { ApiResponse } from '../types/api'

export type ReferralStatus = 'registered' | 'paid' | 'rewarded' | 'expired'

export interface ReferralRow {
  id: number
  status: ReferralStatus
  email_masked: string
  registered_at: number | null
  first_payment_at: number | null
}

export interface ReferralsData {
  code: string
  link: string
  counts: { total: number; paid: number; rewarded: number; pending: number }
  threshold: number
  max: number
  template_gift_at: number
  referrals: ReferralRow[]
}

export async function getReferrals(): Promise<ReferralsData> {
  const res = await apiClient.get<ApiResponse<ReferralsData>>('/account/referrals')
  return res.data.data
}
