export interface User {
  id: number
  name: string
  email: string
  is_admin?: boolean
  /** ISO-8601 string si el correo está verificado, null si no. */
  email_verified_at?: string | null
}

/** GET /admin/stats/overview */
export interface AdminOverview {
  total_businesses: number
  total_published: number
  total_unpublished: number
  total_users: number
  plan_breakdown: { free: number; pro: number; pending: number }
  conversion_rate: number
  new_businesses_last_30d: number
  new_businesses_prev_30d: number
  total_visits_last_30d: number
  visits_prev_30d: number
  whatsapp_clicks_last_30d: number
  phone_clicks_last_30d: number
}

/** GET /admin/stats/timeseries */
export interface AdminTimeSeriesPoint {
  date: string
  value: number
}

export interface AdminTimeSeries {
  granularity: 'day' | 'week' | 'month' | string
  points: AdminTimeSeriesPoint[]
}

/** GET /admin/stats/sectors */
export interface AdminSectorRow {
  sector: string
  total: number
  published: number
  free: number
  pro: number
}

/** GET /admin/stats/templates (listado con uso) */
export interface AdminStatsTemplateItem {
  id: number
  name: string
  slug: string
  is_active: boolean
  requires_pro: boolean
  total_usage: number
}

/** Item en GET /admin/businesses */
export interface AdminBusinessListItem {
  id: number
  name: string
  subdomain: string
  sector: string
  plan: string
  is_published: boolean
  onboarding_completed_at: string | null
  deleted_at: string | null
  created_at: string | null
  owner_email: string | null
  total_visits: number
}

export interface AdminBusinessOwner {
  id: number
  name: string
  email: string
}

/** Respuesta detalle admin (merge con visit_counts en frontend). */
export interface AdminBusinessDetail {
  id: number
  name: string
  subdomain: string
  subdomain_type: string
  sector: string
  template_id: number | null
  logo_path: string | null
  logo_url: string | null
  description: string | null
  tagline: string | null
  phone: string | null
  address: string | null
  lat: number | null
  lng: number | null
  google_maps_url: string | null
  google_business_url: string | null
  booking_url: string | null
  instagram_url: string | null
  tiktok_url: string | null
  facebook_url: string | null
  vcard_enabled: boolean
  schedule: Schedule | null
  is_published: boolean
  plan: string
  plan_activated_at: string | null
  onboarding_completed_at: string | null
  deleted_at: string | null
  created_at: string | null
  updated_at: string | null
  owner: AdminBusinessOwner | null
  template?: Template & { is_active?: boolean }
  images?: Record<string, AdminBusinessImageRow[]>
  services?: AdminBusinessServiceRow[]
}

export interface AdminBusinessImageRow {
  id: number
  url: string
  section: string
  display_order: number
  width?: number
  height?: number
}

export interface AdminBusinessServiceRow {
  id: number
  name: string
  price: number | null
  description: string | null
  display_order: number
}

/** Respuesta GET/PATCH admin negocio + visit_counts agregados por el controlador. */
export type AdminBusinessShow = AdminBusinessDetail & {
  visit_counts?: Record<string, number>
}

export interface AdminPagination {
  current_page: number
  last_page: number
  per_page: number
  total: number
  from: number | null
  to: number | null
}

export interface AdminTemplateRow {
  id: number
  name: string
  slug: string
  primary_color: string
  is_active: boolean
  requires_pro: boolean
  total_usage: number
}

export interface AdminUserRow {
  id: number
  name: string
  email: string
  email_verified_at: string | null
  is_admin: boolean
  business: { id: number; name: string; subdomain: string } | null
  created_at: string | null
}

/** GET /admin/stats/top-pages */
export interface AdminTopPageRow {
  business_id: number
  name: string
  subdomain: string
  sector: string
  plan: string
  visits: number
  whatsapp_clicks: number
  phone_clicks: number
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
  instagram_url: string | null
  tiktok_url: string | null
  facebook_url: string | null
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

/**
 * Auth: Sanctum SPA mode. Tras login/register el backend NO devuelve token — la
 * autenticación viaja por la cookie HttpOnly de sesión. El SPA solo recibe el user
 * y el business (si existe) para hidratar la UI sin tener que esperar a /auth/me.
 */
export interface AuthResponse {
  user: User
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

/** Cada item lleva `bucket` (clave de agrupación: día o hora) y `date` (compat con consumidores antiguos). */
export interface StatsBucket {
  bucket: string
  date: string
  count: number
}

export interface StatsData {
  daily_visits: StatsBucket[]
  daily_whatsapp_clicks: StatsBucket[]
  daily_phone_clicks: StatsBucket[]
  total: number
  days_limit: number
  whatsapp_clicks: number
  phone_clicks: number
  from: string
  to: string
  granularity: 'day' | 'hour'
}
