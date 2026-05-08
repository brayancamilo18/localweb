import type { PublicBusiness, Schedule } from '../../types/api'
import { buildGoogleDirectionsUrl } from '../../lib/googleMapsDirectionsUrl'

/** Servicios serializados para las plantillas HTML. */
export type TemplateServicePayload = {
  name: string
  price: number | null
  description: string | null
}

/** Misma forma que usa `TemplateIframe` / las plantillas `.html` vía `lw:onboarding-preview`. */
export type HtmlTemplatePreviewPayload = {
  /** URL absoluta o relativa del logo (navbar); vacío = nombre en texto. */
  logo_url: string
  /** Escala del logo en la barra (1 = diseño base). Solo usada en plantillas con `nav` + CSS var. */
  logo_scale?: number
  nombre: string
  tagline: string
  telefono: string
  portada: string
  descripcion: string
  foto_equipo: string
  direccion: string
  correo: string
  galeria: string[]
  horario: Schedule | null
  map_lat?: number | null
  map_lon?: number | null
  services: TemplateServicePayload[]
  google_maps_url: string
  google_business_url: string
  booking_url: string
  vcard_enabled: boolean
  is_pro: boolean
  subdomain: string
  /** Origen absoluto de la API (p. ej. https://midominio.com) para construir URLs públicas. */
  api_base_url: string
  /** URL lista para descargar la vCard (`GET …/public/{subdomain}/vcard`). */
  vcard_download_url: string
  instagram_url: string
  tiktok_url: string
  facebook_url: string
}

/** URLs por defecto del pie (plan gratis / sin enlaces propios). Sobrescribibles con VITE_DEFAULT_* */
export function defaultSocialUrls(): { instagram: string; tiktok: string; facebook: string } {
  const ig = (import.meta.env.VITE_DEFAULT_INSTAGRAM_URL as string | undefined)?.trim()
  const tt = (import.meta.env.VITE_DEFAULT_TIKTOK_URL as string | undefined)?.trim()
  const fb = (import.meta.env.VITE_DEFAULT_FACEBOOK_URL as string | undefined)?.trim()
  return {
    instagram: ig || 'https://www.instagram.com/localweb.es',
    tiktok: tt || 'https://www.tiktok.com/@localweb',
    facebook: fb || 'https://www.facebook.com/localweb',
  }
}

export function resolveTemplateSocialUrls(
  business: Partial<Pick<PublicBusiness, 'instagram_url' | 'tiktok_url' | 'facebook_url'>>,
): { instagram_url: string; tiktok_url: string; facebook_url: string } {
  const d = defaultSocialUrls()
  return {
    instagram_url: business.instagram_url?.trim() || d.instagram,
    tiktok_url: business.tiktok_url?.trim() || d.tiktok,
    facebook_url: business.facebook_url?.trim() || d.facebook,
  }
}

function imageList(section: unknown): Array<{ url?: string }> {
  if (!Array.isArray(section)) return []
  return section as Array<{ url?: string }>
}

function phoneForTemplate(b: PublicBusiness): string {
  const p = b.phone?.trim()
  if (p) return p
  const w = b.whatsapp_url?.trim()
  if (!w) return ''
  const digits = w.replace(/\D/g, '')
  return digits
}

/** Origen HTTP de la API (sin path), para URLs públicas en plantillas estáticas. */
export function resolvePublicApiBaseUrl(): string {
  const env = import.meta.env.VITE_API_URL as string | undefined
  const base = env && env.length > 0 ? env : '/api/v1'
  if (base.startsWith('http')) {
    try {
      const u = new URL(base)
      const path = u.pathname.replace(/\/+$/, '')
      if (path === '/api/v1' || path.endsWith('/api/v1')) {
        return u.origin
      }
      return u.origin
    } catch {
      return typeof window !== 'undefined' ? window.location.origin : ''
    }
  }
  return typeof window !== 'undefined' ? window.location.origin : ''
}

export function buildPublicVcardUrl(apiBase: string, subdomain: string): string {
  const origin = apiBase.replace(/\/+$/, '')
  const sub = encodeURIComponent(subdomain.trim())
  return `${origin}/api/v1/public/${sub}/vcard`
}

function servicesPayload(business: PublicBusiness): TemplateServicePayload[] {
  const list = business.services
  if (!Array.isArray(list)) return []
  return list.map((s) => ({
    name: s.name,
    price: s.price,
    description: s.description,
  }))
}

export function publicBusinessToTemplatePayload(business: PublicBusiness): HtmlTemplatePreviewPayload {
  const raw = business.images as
    | { cover?: unknown; gallery?: unknown; about?: unknown }
    | undefined
  const cover = imageList(raw?.cover)
  const gallery = imageList(raw?.gallery)
  const about = imageList(raw?.about)
  const apiBase = resolvePublicApiBaseUrl()
  const sub = business.subdomain?.trim() ?? ''
  const social = resolveTemplateSocialUrls(business)
  const directionsUrl =
    buildGoogleDirectionsUrl({
      lat: business.lat,
      lng: business.lng,
      address: business.address,
    }) || (business.google_maps_url?.trim() ?? '')

  return {
    logo_url: (business.logo_url ?? '').trim(),
    logo_scale: 1,
    nombre: business.name,
    tagline: business.tagline ?? '',
    telefono: phoneForTemplate(business),
    portada: cover[0]?.url ?? '',
    descripcion: business.description ?? '',
    foto_equipo: about[0]?.url ?? '',
    direccion: business.address ?? '',
    correo: '',
    galeria: gallery.map((g) => g.url).filter((u): u is string => Boolean(u)),
    horario: business.schedule ?? null,
    map_lat: business.lat,
    map_lon: business.lng,
    services: servicesPayload(business),
    google_maps_url: directionsUrl,
    google_business_url: business.google_business_url?.trim() ?? '',
    booking_url: '',
    vcard_enabled: Boolean(business.vcard_enabled),
    is_pro: Boolean(business.is_pro),
    subdomain: sub,
    api_base_url: apiBase,
    vcard_download_url: sub ? buildPublicVcardUrl(apiBase, sub) : '',
    instagram_url: social.instagram_url,
    tiktok_url: social.tiktok_url,
    facebook_url: social.facebook_url,
  }
}
