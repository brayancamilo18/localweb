import { apiClient } from './client'

export type AiQuota = {
  enabled: boolean
  remaining: {
    business_description: number
    service_description: number
    improve_text: number
    social_posts: number
    seo_meta: number
  }
}

export type AiBusinessDescriptionResponse = {
  variants: string[]
}

export type AiServiceDescriptionResponse = {
  description: string
  suggested_price_min: number | null
  suggested_price_max: number | null
}

export async function getAiQuota(): Promise<AiQuota> {
  const res = await apiClient.get<{ data: AiQuota }>('/ai/quota')
  return res.data.data
}

export async function generateBusinessDescription(input: {
  business_name: string
  tagline?: string
}): Promise<AiBusinessDescriptionResponse> {
  const res = await apiClient.post<{ data: AiBusinessDescriptionResponse }>(
    '/ai/business-description',
    input,
  )
  return res.data.data
}

export async function generateServiceDescription(input: {
  service_name: string
}): Promise<AiServiceDescriptionResponse> {
  const res = await apiClient.post<{ data: AiServiceDescriptionResponse }>(
    '/ai/service-description',
    input,
  )
  return res.data.data
}

export type AiImproveTone = 'profesional' | 'cercano' | 'vendedor'
export type AiImproveField = 'tagline' | 'description'

export type AiImproveTextResponse = {
  text: string
}

export async function improveText(input: {
  text: string
  tone: AiImproveTone
  field: AiImproveField
}): Promise<AiImproveTextResponse> {
  const res = await apiClient.post<{ data: AiImproveTextResponse }>(
    '/ai/improve-text',
    input,
  )
  return res.data.data
}

export type SocialNetwork = 'instagram' | 'facebook' | 'google_my_business'

export type AiSocialPostResponse = {
  text: string
}

export async function generateSocialPost(input: {
  network: SocialNetwork
  tone: AiImproveTone
  topic?: string
}): Promise<AiSocialPostResponse> {
  const res = await apiClient.post<{ data: AiSocialPostResponse }>(
    '/ai/social-post',
    input,
  )
  return res.data.data
}
