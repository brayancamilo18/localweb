export interface User {
  id: number
  name: string
  email: string
}

export interface Template {
  id: number
  name: string
  slug: string
  primary_color: string
  requires_pro: boolean
}

export interface BusinessImage {
  id: number
  url: string
  section: 'cover' | 'gallery' | 'about'
  display_order: number
}

export interface BusinessService {
  id: number
  name: string
  price: number | null
  description: string | null
  display_order: number
}

export interface DaySchedule {
  open: string
  close: string
  closed: boolean
}

export interface Schedule {
  mon: DaySchedule
  tue: DaySchedule
  wed: DaySchedule
  thu: DaySchedule
  fri: DaySchedule
  sat: DaySchedule
  sun: DaySchedule
}

/** Weekly aggregates from GET /dashboard/business (controller-attached). */
export interface DashboardBusinessStats {
  visit?: number
  whatsapp_click?: number
  phone_click?: number
}

export interface Business {
  id: number
  name: string
  subdomain: string
  sector: string
  plan: 'free' | 'pro' | 'pending'
  /** ISO 8601; el usuario puede usar el dashboard solo tras publicar (paso 8). */
  onboarding_completed_at?: string | null
  tagline: string | null
  description: string | null
  phone: string | null
  address: string | null
  lat: number | null
  lng: number | null
  google_maps_url: string | null
  google_business_url: string | null
  booking_url: string | null
  vcard_enabled: boolean
  schedule: Schedule | null
  logo_url: string | null
  whatsapp_url: string | null
  is_published: boolean
  is_free: boolean
  is_pro: boolean
  template: Template
  images: {
    cover: BusinessImage[]
    gallery: BusinessImage[]
    about: BusinessImage[]
  }
  services: BusinessService[]
  stats?: DashboardBusinessStats | null
}

export type PublicBusiness = Business

export interface ApiResponse<T> {
  data: T
  message: string
}

export interface ApiError {
  message: string
  errors?: Record<string, string[]>
}

export interface AuthResponse {
  user: User
  token: string
  business: Business | null
}

export type LoginResponse = AuthResponse

export interface OnboardingStatus {
  is_complete: boolean
  step: number
  draft?: Record<string, unknown>
}

export interface StepResponse {
  ok: boolean
  next_step?: number
}

export interface Step7Response extends StepResponse {
  plan: 'free' | 'pro'
  public_url?: string
  checkout_url?: string
}

export interface StatsData {
  daily_visits: Array<{ date: string; count: number }>
  total: number
  days_limit: number
  whatsapp_clicks: number
  phone_clicks: number
}
