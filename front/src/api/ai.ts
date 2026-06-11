import { apiClient } from './client'

export type AiQuota = {
  enabled: boolean
  remaining: {
    business_description: number
    service_description: number
    improve_text: number
    social_posts: number
    seo_meta: number
    about_block_description: number
  }
}

export type AiUsageHistoryEntry = {
  feature: string
  label: string
  created_at: string
}

export type AiUsage = {
  enabled: boolean
  used: number
  limit: number
  remaining: number
  resets_at: string
  history: AiUsageHistoryEntry[]
}

export type AiBusinessDescriptionResponse = {
  suggested_tagline: string
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

export async function getAiUsage(): Promise<AiUsage> {
  const res = await apiClient.get<{ data: AiUsage }>('/ai/usage')
  return res.data.data
}

/**
 * Marca que el usuario ya ha visto el modal informativo de la cuota de IA.
 * Idempotente en backend (setea `businesses.ai_intro_seen_at` la primera vez).
 */
export async function markAiIntroSeen(): Promise<void> {
  await apiClient.post('/ai/intro-seen')
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

export type AiAboutSectionResponse = {
  title: string
  description: string
}

export async function generateAboutSection(input: {
  business_name: string
  tagline?: string
  /** Al regenerar: título actual para que la IA proponga uno distinto. */
  current_title?: string
  /** Al regenerar: descripción actual para que la IA proponga una distinta. */
  current_description?: string
}): Promise<AiAboutSectionResponse> {
  const res = await apiClient.post<{ data: AiAboutSectionResponse }>(
    '/ai/about-section',
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

export type AiAboutBlockDescriptionResponse = {
  title: string
  description: string
}

export async function generateAboutBlockDescription(input: {
  block_title?: string
}): Promise<AiAboutBlockDescriptionResponse> {
  const res = await apiClient.post<{ data: AiAboutBlockDescriptionResponse }>(
    '/ai/about-block-description',
    input,
  )
  return res.data.data
}
