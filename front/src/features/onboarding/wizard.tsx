import {
  useContext,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import type { Schedule, Template } from '../../types/api'
import { geocodeAddress } from '../../lib/geocodeAddress'
import { getPublicPageHost } from '../../lib/tenant'
import {
  Icon,
  Btn,
  Field,
  Input,
  Textarea,
  Badge,
  Card,
  Logo,
  Placeholder,
  Segmented,
  Switch,
  MiniMap,
  BrowserChrome,
} from '../../components/primitives/primitives'
import Step7Plan from './steps/Step7Plan'
import { buildGoogleDirectionsUrl } from '../../lib/googleMapsDirectionsUrl'
import {
  buildPublicVcardUrl,
  defaultSocialUrls,
  resolvePublicApiBaseUrl,
} from '../public-page/publicTemplatePayload'
import { LocationPicker } from '../../components/location/LocationPicker'
import type { LocationValue } from '../../lib/location/locationTypes'
import { readSignupPrefill } from '../../lib/signupPrefill'
import { useAuthStore } from '../../store/authStore'
import { WizardNavContext, type WizardStepProps } from './wizardNavContext'

// ONEZ — Onboarding wizard (8 pasos)
// Each step is a self-contained component returning a desktop split (form + preview).
// Mobile variants exposed separately.

export type { WizardNavValue } from './wizardNavContext'
export { WizardNavContext } from './wizardNavContext'
export type { WizardStepProps } from './wizardNavContext'

const ACCENT = "var(--lw-accent)";
const BORDER = "var(--lw-border)";

export type Step1PreviewVariant =
  | 'noir-elite'
  | 'bloom-studio'
  | 'urban-bold'
  | 'coastal-calm'
  | 'craft-pro'
  | 'tavola-warm'
  | 'tech-sleek'
  | 'trust-clinic'
  | 'versa-studio'
  | 'mono-edito'
  | 'luxe-atelier'

export const STEP1_PREVIEW_VARIANTS: Step1PreviewVariant[] = [
  'noir-elite',
  'bloom-studio',
  'urban-bold',
  'coastal-calm',
  'craft-pro',
  'tavola-warm',
  'tech-sleek',
  'trust-clinic',
  'versa-studio',
  'mono-edito',
  'luxe-atelier',
]

function isStep1PreviewVariant(value: unknown): value is Step1PreviewVariant {
  return typeof value === 'string' && (STEP1_PREVIEW_VARIANTS as string[]).includes(value)
}
type TemplatePreviewData = {
  /** Data URL o URL absoluta del logo (solo navbar). */
  logoUrl?: string
  /** Escala visual del logo en la barra (≈0.55–1.35); 1 = tamaño base del diseño. */
  logoScale?: number
  businessName?: string
  tagline?: string
  phone?: string
  coverUrl?: string
  coverUrl2?: string
  coverUrl3?: string
  /** Texto “Sobre nosotros” / descripción del negocio */
  description?: string
  /** Imagen sección equipo (data URL) */
  aboutPhotoUrl?: string
  /** Dirección (paso ubicación) para pie de página en preview */
  address?: string
  city?: string
  country?: string
  foundedYear?: string
  /** Email de contacto (paso ubicación), enviado a la plantilla como `correo` */
  email?: string
  /** Fotos de galería (data URLs) para vista previa en plantilla */
  galleryUrls?: string[]
  /** Horario semanal (paso 5) para vista previa en plantilla */
  schedule?: Schedule
  /** Coordenadas tras geocodificar la dirección (mapa en plantilla) */
  mapLat?: number
  mapLng?: number
  /** Paso 9 Pro: servicios persistidos en API para la plantilla */
  templateServices?: Array<{ name: string; price: number | null; description: string | null }>
  googleBusinessUrl?: string
  vcardEnabled?: boolean
  isProCustomer?: boolean
  customerSubdomain?: string
  /** Opcional; vacío → URLs por defecto de la app en el pie. */
  instagramUrl?: string
  tiktokUrl?: string
  facebookUrl?: string
}

/** Calidad orientativa para fotos de galería web (resolución). */
type GalleryImageQuality = 'excelente' | 'buena' | 'aceptable' | 'baja'

async function evaluateGalleryImageQuality(file: File): Promise<{
  quality: GalleryImageQuality
  width: number
  height: number
}> {
  let width = 0
  let height = 0
  try {
    if (typeof createImageBitmap === 'function') {
      const bmp = await createImageBitmap(file)
      width = bmp.width
      height = bmp.height
      bmp.close?.()
    } else {
      const url = URL.createObjectURL(file)
      const img = new Image()
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve()
        img.onerror = () => reject(new Error('decode'))
        img.src = url
      })
      width = img.naturalWidth
      height = img.naturalHeight
      URL.revokeObjectURL(url)
    }
  } catch {
    return { quality: 'aceptable', width: 0, height: 0 }
  }

  const shortSide = Math.min(width, height)
  const megapixels = (width * height) / 1_000_000

  let quality: GalleryImageQuality
  if (shortSide >= 1600 && megapixels >= 2) quality = 'excelente'
  else if (shortSide >= 1200 && megapixels >= 1) quality = 'buena'
  else if (shortSide >= 800 && megapixels >= 0.45) quality = 'aceptable'
  else quality = 'baja'

  return { quality, width, height }
}

async function filesToDataUrls(files: File[]): Promise<string[]> {
  const out: string[] = []
  for (const file of files) {
    const url = await new Promise<string>((resolve) => {
      const r = new FileReader()
      r.onload = () => resolve(typeof r.result === 'string' ? r.result : '')
      r.onerror = () => resolve('')
      r.readAsDataURL(file)
    })
    if (url) out.push(url)
  }
  return out
}

const TEMPLATE_URL_BY_VARIANT: Record<Step1PreviewVariant, string> = {
  'noir-elite': '/templates/noir-elite.html',
  'bloom-studio': '/templates/bloom-studio.html',
  'urban-bold': '/templates/urban-bold.html',
  'coastal-calm': '/templates/coastal-calm.html',
  'craft-pro': '/templates/craft-pro.html',
  'tavola-warm': '/templates/tavola-warm.html',
  'tech-sleek': '/templates/tech-sleek.html',
  'trust-clinic': '/templates/trust-clinic.html',
  'versa-studio': '/templates/versa-studio.html',
  'mono-edito': '/templates/mono-edito.html',
  'luxe-atelier': '/templates/luxe-atelier.html',
}

/** Texto de ejemplo para miniaturas y vista previa del paso 1 (sin portada, galería ni foto «Sobre nosotros»). */
const STEP1_TEMPLATE_PREVIEW_DEMO_BY_VARIANT: Record<Step1PreviewVariant, TemplatePreviewData> = {
  'noir-elite': {
    businessName: 'Casa Lumen',
    tagline: 'Lámparas y luminarias de diseño en el centro de Madrid',
    description:
      'Selección curada de piezas contemporáneas y clásicas renovadas, con asesoramiento para hogar y espacios comerciales.',
    phone: '+34 910 00 11 22',
  },
  'bloom-studio': {
    businessName: 'Salón Margarita',
    tagline: 'Color, brillo y cuidado capilar con cita previa',
    description:
      'Equipo especializado en coloración, tratamientos de recuperación y cortes a medida en un salón tranquilo y luminoso.',
    phone: '+34 913 00 44 55',
  },
  'urban-bold': {
    businessName: 'Studio Barber',
    tagline: 'Cortes precisos y barba a navaja con cita previa',
    description:
      'Barbería urbana: fades, degradados y perfilado de barba en un espacio directo y sin rodeos.',
    phone: '+34 914 00 55 66',
  },
  'coastal-calm': {
    businessName: 'Hotel Marea',
    tagline: 'Hotel boutique frente al mar',
    description:
      'Habitaciones con vistas, desayuno casero y una experiencia tranquila a pocos metros de la playa.',
    phone: '+34 968 00 22 33',
  },
  'craft-pro': {
    businessName: 'Construcciones Lanza',
    tagline: 'Reformas integrales y oficios profesionales',
    description:
      'Equipo certificado para reformas, fontanería y electricidad. Presupuesto sin compromiso y plazos claros.',
    phone: '+34 911 22 33 44',
  },
  'tavola-warm': {
    businessName: 'Tavola Roma',
    tagline: 'Cocina italiana, vinos y barra de autor',
    description:
      'Pasta fresca, vinos por copa y un menú de mediodía pensado para disfrutar sin prisa en pleno barrio.',
    phone: '+34 915 34 21 09',
  },
  'tech-sleek': {
    businessName: 'Atlas Studio',
    tagline: 'Estudio digital · diseño y producto',
    description:
      'Diseñamos productos digitales y branding para startups y equipos que quieren lanzarse rápido y bien.',
    phone: '+34 600 12 34 56',
  },
  'trust-clinic': {
    businessName: 'Clínica Vega',
    tagline: 'Fisioterapia y rehabilitación de confianza',
    description:
      'Profesionales colegiados, sesiones personalizadas y seguimiento continuo para volver a moverte sin dolor.',
    phone: '+34 912 99 88 77',
  },
  'versa-studio': {
    businessName: 'Estudio Versa',
    tagline: 'un espacio de trabajo compartido y creativo en el corazón del barrio',
    description:
      'Abrimos sin grandes planes, sin diseñador, sin marketing. Hoy seguimos siendo nosotros: si pides algo que no sabemos, te lo decimos.',
    phone: '+34 911 23 45 67',
  },
  'mono-edito': {
    businessName: 'Taller Línea',
    tagline: 'editorial · oficio y detalle en cada encargo',
    description:
      'Un estudio donde el trabajo manual y el criterio editorial marcan cada proyecto. Sin atajos: conversamos, proponemos y entregamos con nombre propio.',
    phone: '+34 915 12 34 56',
  },
  'luxe-atelier': {
    businessName: 'Maison Éclat',
    tagline: 'atelier de lujo · piezas únicas y atención personal',
    description:
      'Una maison donde cada visita es una experiencia. Materiales escogidos, oficio impecable y el tiempo necesario para que cada pieza pueda firmarse.',
    phone: '+34 914 88 77 66',
  },
}

/** URL ficticia en la barra del navegador simulado del preview (solo cosmética). */
/**
 * Combina el demo de la plantilla con datos reales del negocio.
 * Si hay `businessName` (u otros) en overrides, sustituyen al texto demo fijo.
 */
export function mergeStep1TemplatePreview(
  variant: Step1PreviewVariant,
  overrides?: TemplatePreviewData,
): TemplatePreviewData {
  const demo = STEP1_TEMPLATE_PREVIEW_DEMO_BY_VARIANT[variant]
  if (!overrides) return { ...demo }
  const name = overrides.businessName?.trim()
  const tagline = overrides.tagline?.trim()
  const phone = overrides.phone?.trim()
  const description = overrides.description?.trim()
  return {
    ...demo,
    ...overrides,
    businessName: name || demo.businessName,
    tagline: tagline || demo.tagline,
    phone: phone || demo.phone,
    description: description || demo.description,
  }
}

function previewDemoHostForVariant(variant: Step1PreviewVariant): string {
  switch (variant) {
    case 'noir-elite':
      return 'casa-lumen.localweb.es'
    case 'bloom-studio':
      return 'salon-margarita.localweb.es'
    case 'urban-bold':
      return 'studio-barber.localweb.es'
    case 'coastal-calm':
      return 'hotel-marea.localweb.es'
    case 'craft-pro':
      return 'construcciones-lanza.localweb.es'
    case 'tavola-warm':
      return 'tavola-roma.localweb.es'
    case 'tech-sleek':
      return 'atlas-studio.localweb.es'
    case 'trust-clinic':
      return 'clinica-vega.localweb.es'
    case 'versa-studio':
      return 'estudio-versa.localweb.es'
    case 'mono-edito':
      return 'taller-linea.localweb.es'
    case 'luxe-atelier':
      return 'maison-eclat.localweb.es'
    default:
      return 'studio-barber.localweb.es'
  }
}

/** Iframe “thumb” del paso plantilla: documento renderizado a esta resolución y escalado al ancho real de la tarjeta. */
const TEMPLATE_THUMB_DOC_W = 1280
const TEMPLATE_THUMB_DOC_H = 760

/** Color de marca por variante: se usa como fondo del placeholder mientras el iframe carga. */
const TEMPLATE_THUMB_PLACEHOLDER_COLOR: Record<Step1PreviewVariant, string> = {
  'noir-elite': '#0A0A0A',
  'bloom-studio': '#F5E6D3',
  'urban-bold': '#0F0F0F',
  'coastal-calm': '#E8DFD3',
  'craft-pro': '#1A1A1A',
  'tavola-warm': '#F4EDE0',
  'tech-sleek': '#0EA5E9',
  'trust-clinic': '#F8FAFC',
  'versa-studio': '#FAF7F2',
  'mono-edito': '#FAFAF7',
  'luxe-atelier': '#1C1814',
}

function resolveStep1PreviewVariant(template: Pick<Template, 'slug' | 'name'>): Step1PreviewVariant {
  const slug = template.slug.toLowerCase().trim()
  if (isStep1PreviewVariant(slug)) return slug
  const name = template.name.toLowerCase()
  if (slug.includes('coastal') || name.includes('coastal') || slug.includes('hotel')) return 'coastal-calm'
  if (slug.includes('craft') || name.includes('craft') || slug.includes('oficio')) return 'craft-pro'
  if (slug.includes('tavola') || name.includes('tavola') || slug.includes('restaur')) return 'tavola-warm'
  if (slug.includes('tech') || name.includes('tech') || slug.includes('digital')) return 'tech-sleek'
  if (slug.includes('trust') || name.includes('trust') || slug.includes('clinic')) return 'trust-clinic'
  if (slug.includes('urban') || slug.includes('bold') || name.includes('urban')) return 'urban-bold'
  if (slug.includes('noir') || name.includes('noir') || slug.includes('soft')) return 'noir-elite'
  if (slug.includes('bloom') || name.includes('bloom') || slug.includes('aurora')) return 'bloom-studio'
  if (slug.includes('versa') || name.includes('versa')) return 'versa-studio'
  if (slug.includes('mono') || slug.includes('edito') || name.includes('edito') || name.includes('editorial')) return 'mono-edito'
  if (slug.includes('luxe') || slug.includes('atelier') || name.includes('luxe') || name.includes('atelier') || name.includes('maison')) return 'luxe-atelier'
  return 'urban-bold'
}

function TemplateIframe({
  variant,
  mode = 'full',
  embed = true,
  previewData,
  initialHash = '',
}: {
  variant: Step1PreviewVariant
  mode?: 'full' | 'thumb'
  /** En preview embebido usamos ?embed=1 para forzar layout desktop dentro del panel. */
  embed?: boolean
  previewData?: TemplatePreviewData
  /** Ej. #sobre-nosotros para centrar la vista previa en esa sección */
  initialHash?: string
}) {
  const templatePath = TEMPLATE_URL_BY_VARIANT[variant]
  const iframeRef = useRef<HTMLIFrameElement | null>(null)
  const thumbWrapRef = useRef<HTMLDivElement | null>(null)
  const [thumbScale, setThumbScale] = useState(0.25)
  const loadedRef = useRef(false)

  useLayoutEffect(() => {
    if (mode !== 'thumb') return
    const el = thumbWrapRef.current
    if (!el) return
    const update = () => {
      const w = el.getBoundingClientRect().width
      if (w > 0) setThumbScale(w / TEMPLATE_THUMB_DOC_W)
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [mode])

  const [isVisible, setIsVisible] = useState(mode !== 'thumb')

  useEffect(() => {
    if (mode !== 'thumb') return
    // Si el navegador no soporta IntersectionObserver, montamos directamente.
    if (typeof IntersectionObserver === 'undefined') {
      setIsVisible(true)
      return
    }
    const el = thumbWrapRef.current
    if (!el) return
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setIsVisible(true)
            io.disconnect()
            break
          }
        }
      },
      { rootMargin: '200px 0px', threshold: 0.01 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [mode])

  const [hasLoaded, setHasLoaded] = useState(false)

  const src = useMemo(() => {
    const params = new URLSearchParams()
    params.set('v', '2')
    if (embed) params.set('embed', '1')
    if (mode === 'thumb') params.set('thumb', '1')
    if (previewData) {
      params.set('preview', '1')
    }
    if (typeof window !== 'undefined') params.set('parentOrigin', window.location.origin)
    const qs = params.size > 0 ? `?${params.toString()}` : ''
    const hash = initialHash
      ? initialHash.startsWith('#')
        ? initialHash
        : `#${initialHash}`
      : ''
    return `${templatePath}${qs}${hash}`
  }, [templatePath, embed, variant, initialHash, mode])

  const syncPreview = useCallback(
    (options?: { alignToHash?: boolean }) => {
      const frame = iframeRef.current
      if (!frame?.contentWindow || !previewData) return
      const apiBase = resolvePublicApiBaseUrl()
      const sub = (previewData.customerSubdomain ?? '').trim()
      const vcardOn = previewData.vcardEnabled === true
      const mapsUrl = buildGoogleDirectionsUrl({
        lat: previewData.mapLat,
        lng: previewData.mapLng,
        address: previewData.address,
      })
      const rawLogo = (previewData.logoUrl ?? '').trim()
      /** Los blob: solo son válidos en el documento que los creó; el iframe es otro contexto. */
      const logoUrlForIframe = rawLogo.startsWith('blob:') ? '' : rawLogo
      const rawScale = Number(previewData.logoScale)
      const logoScale =
        Number.isFinite(rawScale) ? Math.min(1.5, Math.max(0.45, rawScale)) : 1
      const socialDef = defaultSocialUrls()
      frame.contentWindow.postMessage(
        {
          type: 'lw:onboarding-preview',
          /** Solo en la carga del iframe: centrar la sección del paso (p. ej. #horario). */
          alignToHash: options?.alignToHash === true,
          payload: {
            logo_url: logoUrlForIframe,
            logo_scale: logoScale,
            nombre: previewData.businessName ?? '',
            tagline: previewData.tagline ?? '',
            telefono: previewData.phone ?? '',
            portada: previewData.coverUrl ?? '',
            portada_2: previewData.coverUrl2 ?? '',
            portada_3: previewData.coverUrl3 ?? '',
            descripcion: previewData.description ?? '',
            foto_equipo: previewData.aboutPhotoUrl ?? '',
            direccion: previewData.address ?? '',
            ciudad: previewData.city ?? '',
            pais: previewData.country ?? '',
            anio_fundacion: previewData.foundedYear ?? '',
            correo: previewData.email ?? '',
            galeria: previewData.galleryUrls ?? [],
            horario: previewData.schedule ?? null,
            ...(Number.isFinite(previewData.mapLat) && Number.isFinite(previewData.mapLng)
              ? { map_lat: previewData.mapLat, map_lon: previewData.mapLng }
              : {}),
            services: previewData.templateServices ?? [],
            google_maps_url: mapsUrl,
            google_business_url: (previewData.googleBusinessUrl ?? '').trim(),
            booking_url: '',
            vcard_enabled: vcardOn,
            is_pro: previewData.isProCustomer === true,
            subdomain: sub,
            api_base_url: apiBase,
            vcard_download_url: vcardOn && sub ? buildPublicVcardUrl(apiBase, sub) : '',
            instagram_url: (previewData.instagramUrl ?? '').trim() || socialDef.instagram,
            tiktok_url: (previewData.tiktokUrl ?? '').trim() || socialDef.tiktok,
            facebook_url: (previewData.facebookUrl ?? '').trim() || socialDef.facebook,
          },
        },
        // targetOrigin: el iframe se sirve desde la misma carpeta `/templates/` del SPA,
        // así que el origin del documento del iframe coincide con window.location.origin.
        // Usamos la whitelist explícita en lugar de '*' para evitar que el navegador entregue
        // este mensaje a un documento que se haya redirigido a otro origin.
        window.location.origin,
      )
    },
    [previewData],
  )

  useEffect(() => {
    if (loadedRef.current) syncPreview({ alignToHash: false })
  }, [syncPreview])

  if (mode === 'thumb') {
    const thumbAspectPct = (TEMPLATE_THUMB_DOC_H / TEMPLATE_THUMB_DOC_W) * 100
    const placeholderColor = TEMPLATE_THUMB_PLACEHOLDER_COLOR[variant] ?? '#FAFAFA'
    return (
      <div
        ref={thumbWrapRef}
        className="lw-template-thumb-wrap"
        style={{ position: 'relative', width: '100%', overflow: 'hidden' }}
      >
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: 0,
            paddingBottom: `${thumbAspectPct}%`,
            background: placeholderColor,
          }}
        >
          {isVisible ? (
            <iframe
              ref={iframeRef}
              title={`Plantilla ${variant} portada`}
              src={src}
              loading="lazy"
              onLoad={() => {
                loadedRef.current = true
                setHasLoaded(true)
                syncPreview({ alignToHash: true })
              }}
              sandbox="allow-scripts allow-popups allow-forms allow-same-origin"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: TEMPLATE_THUMB_DOC_W,
                height: TEMPLATE_THUMB_DOC_H,
                border: 'none',
                transform: `scale(${thumbScale})`,
                transformOrigin: 'top left',
                pointerEvents: 'none',
                background: '#fff',
                opacity: hasLoaded ? 1 : 0,
                transition: 'opacity 200ms ease-out',
              }}
            />
          ) : null}
        </div>
      </div>
    )
  }

  return (
    <iframe
      ref={iframeRef}
      title={`Vista previa completa ${variant}`}
      src={src}
      onLoad={() => {
        loadedRef.current = true
        syncPreview({ alignToHash: true })
      }}
      sandbox="allow-scripts allow-popups allow-forms allow-same-origin"
      style={{
        width: '100%',
        height: '100%',
        border: 'none',
        background: '#fff',
        display: 'block',
      }}
    />
  )
}

// ─── Wizard chrome (header + step pills + progress) ──────────
function WizardHeader({ step }: { step: number }) {
  const nav = useContext(WizardNavContext);
  const jump = nav?.onJumpToStep;
  const steps = [
    "Plantilla", "Portada", "Sobre nosotros", "Galería",
    "Horarios", "Ubicación", "Plan", "Publicar",
  ];
  const isExtras = step === 9;
  const pct = isExtras ? 100 : (Math.min(step, 8) / steps.length) * 100;
  return (
    <div
      className="lw-wizard-header"
      style={{
        borderBottom: `1px solid ${BORDER}`,
        background: "var(--lw-bg-elev)",
        padding: "clamp(12px, 2vw, 16px) clamp(16px, 4vw, 32px)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <Logo size={140}/>
        <span style={{ fontSize: 12, color: "var(--lw-text-3)", fontWeight: 500 }}>
          {isExtras ? (
            <>Paso extra · <span style={{ color: "var(--lw-text)" }}>Configura tu Pro</span></>
          ) : (
            <>Paso <span style={{ color: "var(--lw-text)", fontVariantNumeric: "tabular-nums" }}>{step}</span> de 8</>
          )}
        </span>
      </div>
      {/* progress bar */}
      <div style={{ height: 3, background: "var(--lw-surface)", borderRadius: 2, overflow: "hidden", marginBottom: 14 }}>
        <div style={{ width: `${pct}%`, height: "100%", background: ACCENT,
          transition: "width .3s" }}/>
      </div>
      {/* step pills */}
      {!isExtras ? (<div className="lw-wizard-steps lw-scroll">
        {steps.map((s, i) => {
          const n = i + 1;
          const state = n < step ? "done" : n === step ? "active" : "todo";
          const styles = {
            done:   { bg: "var(--lw-accent-soft)",  color: "var(--lw-accent-hover)", border: "transparent" },
            active: { bg: "var(--lw-text)",         color: "#fff",                   border: "transparent" },
            todo:   { bg: "transparent",            color: "var(--lw-text-4)",       border: "var(--lw-border)" },
          }[state];
          const locked = step === 8;
          const clickable = typeof jump === "function" && !locked;
          return (
            <span
              key={s}
              role={clickable ? "button" : undefined}
              tabIndex={clickable ? 0 : undefined}
              title={locked ? 'Tu página ya está creada. Edita desde el dashboard.' : (clickable ? `Ir al paso ${n}: ${s}` : undefined)}
              onClick={clickable ? () => jump(n) : undefined}
              onKeyDown={clickable ? (e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  jump(n);
                }
              } : undefined}
              style={{
              flex: "0 0 auto",
              minWidth: "min-content",
              padding: "6px 10px",
              fontSize: 11.5, fontWeight: 500,
              borderRadius: 6, textAlign: "center", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
              background: styles.bg, color: styles.color,
              border: `1px solid ${styles.border}`,
              display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 5,
              cursor: clickable ? "pointer" : (locked ? "not-allowed" : "default"),
              userSelect: "none",
              opacity: locked && state !== "active" ? 0.55 : 1,
            }}>
              {state === "done" ? <Icon name="check" size={11}/> : <span style={{ opacity: state === "todo" ? .6 : 1, fontVariantNumeric: "tabular-nums" }}>{n}</span>}
              {s}
            </span>
          );
        })}
      </div>) : null}
    </div>
  );
}

// ─── Wizard layout: split 52 / 48 ────────────────────────────
const WIZARD_NARROW_PREVIEW_BP = "(max-width: 900px)";

function subscribeWizardNarrowPreview(onChange: () => void) {
  const mq = window.matchMedia(WIZARD_NARROW_PREVIEW_BP);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

function getWizardNarrowPreviewSnapshot() {
  return window.matchMedia(WIZARD_NARROW_PREVIEW_BP).matches;
}

export function WizardLayout({
  step,
  children,
  renderPreview,
  previewTitle,
  previewFocusDescription,
  footer,
}: {
  step: number
  children: ReactNode
  /** Misma factoría que la vista en rail y en el modal (evita dos árboles desincronizados). */
  renderPreview: () => ReactNode
  /** Nombre de la plantilla en la cabecera del modal de vista completa. */
  previewTitle: string
  /** En viewport estrecho: texto del CTA y del modal (sección que enfoca la vista previa al abrirla). */
  previewFocusDescription?: string
  footer?: ReactNode
}) {
  const nav = useContext(WizardNavContext);
  const [device, setDevice] = useState<"desktop" | "mobile">(() => {
    if (typeof window === "undefined") return "desktop";
    return window.matchMedia(WIZARD_NARROW_PREVIEW_BP).matches ? "mobile" : "desktop";
  });
  const narrowViewport = useSyncExternalStore(
    subscribeWizardNarrowPreview,
    getWizardNarrowPreviewSnapshot,
    () => false,
  );
  const [previewModalOpen, setPreviewModalOpen] = useState(false);

  useEffect(() => {
    if (!previewModalOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPreviewModalOpen(false);
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [previewModalOpen]);

  const staticFooter = (
    <>
      <Btn kind="ghost" icon="chevronLeft" size="md">Atrás</Btn>
      <Btn kind="primary" iconRight="arrowRight" size="md">Continuar</Btn>
    </>
  );

  const resolvedFooter = footer !== undefined && footer !== null ? footer : (nav?.footer ?? staticFooter);

  const mobilePreviewCta = narrowViewport && step > 1;
  const focusHint = (previewFocusDescription ?? "").trim();

  /** En vista completa (modal) solo escritorio; en el panel lateral respeta `device`. */
  const renderPreviewFrame = (placement: "rail" | "modal") => {
    const effectiveDevice = placement === "modal" ? "desktop" : device;
    return (
      <div
        style={{
          /* Móvil: no ocupar todo el alto del rail con un bloque vacío (menos gris bajo el teléfono). */
          flex: effectiveDevice === "mobile" ? "0 1 auto" : 1,
          minHeight: 0,
          display: "flex",
          justifyContent: effectiveDevice === "mobile" ? "center" : "stretch",
          /* Móvil: no estirar el marco en vertical (evita “bezel” inferior enorme al cargar logo / iframe). */
          alignItems: "flex-start",
          overflow: effectiveDevice === "mobile" ? "auto" : "hidden",
        }}
      >
        {effectiveDevice === "mobile" ? (
          <div className="lw-preview-phone-shell">
            <div className="lw-preview-phone-notch" aria-hidden />
            <div className="lw-preview-phone-screen">{renderPreview()}</div>
          </div>
        ) : (
          <div
            style={{
              width: "100%",
              height: "100%",
              minHeight: 0,
              display: "flex",
              flexDirection: "column",
            }}
          >
            {renderPreview()}
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      className={`lw-wizard-layout${device === "mobile" ? " lw-wizard-layout--preview-mobile" : ""}${step === 1 ? " lw-wizard-layout--step1" : ""}${mobilePreviewCta ? " lw-wizard-layout--compact-preview-rail" : ""}`}
    >
      <WizardHeader step={step}/>
      <div className="lw-wizard-split">
        {/* form */}
        <div className="lw-wizard-form lw-scroll">{children}</div>
        {/*
          Paso 1 («biblioteca de plantillas»): no montamos el rail de preview.
          Cada tarjeta abre su propio modal a pantalla completa con el botón «Ver»,
          así evitamos el coste de un iframe extra y dejamos al usuario ver mejor
          la galería. El form ocupa el 100 % gracias a `.lw-wizard-layout--step1`.
        */}
        {step !== 1 ? (
        <div className="lw-wizard-preview">
          {mobilePreviewCta ? (
            <div className="lw-wizard-mobile-preview-cta">
              <p className="lw-wizard-mobile-preview-cta-title">
                <Icon name="eye" size={18} color="var(--lw-accent)" />
                Vista previa
              </p>
              {focusHint ? (
                <p className="lw-small lw-wizard-mobile-preview-cta-desc">{focusHint}</p>
              ) : null}
              <Btn
                kind="primary"
                size="md"
                type="button"
                fullWidth
                iconRight="arrowRight"
                onClick={() => setPreviewModalOpen(true)}
              >
                Ver mi página a pantalla completa
              </Btn>
            </div>
          ) : (
            <>
              <div className="lw-wizard-preview-toolbar">
                <span className="lw-small" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                  <Icon name="eye" size={13}/> Vista previa en tiempo real
                </span>
                <div className="lw-wizard-preview-toolbar-actions">
                  <Btn
                    kind="ghost"
                    size="sm"
                    type="button"
                    onClick={() => setPreviewModalOpen(true)}
                  >
                    Vista completa
                  </Btn>
                  <Segmented
                    size="sm"
                    value={device}
                    onChange={(v) => setDevice(v === "mobile" ? "mobile" : "desktop")}
                    options={[
                      { value: "desktop", label: <Icon name="monitor" size={13}/> },
                      { value: "mobile", label: <Icon name="smartphone" size={13}/> },
                    ]}
                  />
                </div>
              </div>
              {renderPreviewFrame("rail")}
            </>
          )}
        </div>
        ) : null}
      </div>
      {/* footer */}
      <div className="lw-wizard-footer">
        {resolvedFooter}
      </div>
      {previewModalOpen
        ? createPortal(
            <div
              role="dialog"
              aria-modal="true"
              aria-label={`Vista previa a pantalla completa: ${previewTitle}`}
              style={{
                position: "fixed",
                inset: 0,
                zIndex: 9999,
                background: "rgba(15, 23, 42, 0.55)",
                backdropFilter: "blur(6px)",
                display: "flex",
                flexDirection: "column",
                padding: "clamp(12px, 3vw, 24px)",
              }}
              onClick={() => setPreviewModalOpen(false)}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                  marginBottom: 12,
                  flexShrink: 0,
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: "#fff" }}>{previewTitle}</div>
                  <div className="lw-small" style={{ color: "rgba(255,255,255,.75)", marginTop: 2 }}>
                    {focusHint
                      ? `${focusHint} Pulsa fuera o Esc para cerrar.`
                      : "Vista a pantalla completa · Esc para cerrar"}
                  </div>
                </div>
                <Btn
                  kind="ghost"
                  size="md"
                  type="button"
                  icon="x"
                  onClick={() => setPreviewModalOpen(false)}
                  style={{ color: "#fff" }}
                >
                  Cerrar
                </Btn>
              </div>
              <div
                className="lw-modal-preview"
                style={{
                  flex: 1,
                  minHeight: 0,
                  borderRadius: "var(--lw-r)",
                  overflow: "hidden",
                  border: "1px solid rgba(255,255,255,.2)",
                  boxShadow: "0 24px 80px rgba(0,0,0,.35)",
                  background: "#fff",
                  display: "flex",
                  flexDirection: "column",
                }}
                onClick={(e) => e.stopPropagation()}
              >
                {renderPreviewFrame("modal")}
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}

/** Coincide con `TemplateSeeder`: si la API falla, mostramos al menos Urban Bold. */
const FALLBACK_TEMPLATES: Template[] = [
  {
    id: 1,
    name: 'Urban Bold',
    slug: 'urban-bold',
    primary_color: '#D4FF3A',
    requires_pro: false,
    hero_photo_slots: 1,
    thumbnail_url: null,
    category: null,
    suitable_sectors: [],
    sort_order: 10,
    featured: false,
  },
]

// ─── Step 1 · Plantilla ──────────────────────────────────────
/**
 * Tope visual de tarjetas por página en el selector de plantilla. El usuario navega
 * entre páginas con los puntos inferiores; mantenemos el mismo patrón que el selector
 * de sectores en `RegisterPage` para coherencia (dots + slide horizontal de 220 ms).
 */
const TEMPLATES_PAGE_SIZE = 8
const LOGO_SCALE_MIN = 0.55
const LOGO_SCALE_MAX = 1.35

function clampStep1LogoScale(n: number): number {
  if (!Number.isFinite(n)) return 1
  return Math.min(LOGO_SCALE_MAX, Math.max(LOGO_SCALE_MIN, n))
}

function Step1Logo({
  errors,
  isLoading: busy,
  variant = 'intro',
  previewUrl,
  onPreviewUrlChange,
  logoScale,
  onLogoScaleChange,
  onLogoFileChange,
  onPendingRemoveLogoChange,
}: WizardStepProps & {
  /** `embedded`: sin título de paso (p. ej. dentro de Portada). */
  variant?: 'intro' | 'embedded'
  previewUrl?: string
  onPreviewUrlChange?: (url: string | undefined) => void
  logoScale?: number
  onLogoScaleChange?: (scale: number) => void
  onLogoFileChange?: (file: File | null) => void
  onPendingRemoveLogoChange?: (v: boolean) => void
}) {
  const logoInputRef = useRef<HTMLInputElement>(null)
  const resolvedLogoScale = clampStep1LogoScale(logoScale ?? 1)
  const [logoNatural, setLogoNatural] = useState<{ w: number; h: number } | null>(null)

  useEffect(() => {
    const src = previewUrl
    if (!src?.trim()) {
      setLogoNatural(null)
      return
    }
    const img = new Image()
    img.onload = () =>
      setLogoNatural({
        w: img.naturalWidth,
        h: img.naturalHeight,
      })
    img.onerror = () => setLogoNatural(null)
    img.src = src
  }, [previewUrl])

  const logoUpscaleHint =
    logoNatural &&
    resolvedLogoScale > 1.02 &&
    Math.min(logoNatural.w, logoNatural.h) < 180
      ? 'Al aumentar el tamaño, una imagen de pocos píxeles puede verse menos nítida. Para máxima calidad usa PNG/WebP de al menos ~240–400 px en el lado mayor.'
      : null

  const hasLogoPreview = Boolean(previewUrl?.trim())

  return (
    <>
      {variant === 'intro' ? (
        <div>
          <h1 className="lw-h2">Tu logo</h1>
          <p className="lw-body" style={{ marginTop: 6, maxWidth: 540 }}>
            Opcional: súbelo ahora o más adelante. Aparecerá en la barra superior de tu web publicada.
          </p>
        </div>
      ) : (
        <div style={{ marginTop: 8 }}>
          <p className="lw-body" style={{ margin: 0, maxWidth: 540, color: 'var(--lw-text-3)', fontSize: 14, lineHeight: 1.45 }}>
            Logo opcional en la barra superior. Si no lo subiste al elegir plantilla, puedes hacerlo aquí.
          </p>
        </div>
      )}
      <Field
        label="Logo del negocio (opcional)"
        hint="Se muestra en la barra superior. Recomendado ≥240 px en el lado mayor para buena nitidez. JPG, PNG o WebP (máx. 2 MB)."
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 12,
              background: 'var(--lw-bg-elev)',
              border: '1px solid var(--lw-border)',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              fontSize: 11,
              color: 'var(--lw-text-3)',
              textAlign: 'center',
              padding: 8,
            }}
          >
            {hasLogoPreview ? (
              <img
                src={previewUrl ?? ''}
                alt=""
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  imageRendering: 'auto',
                }}
              />
            ) : (
              <span>Sin logo</span>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <input
              ref={logoInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              style={{ display: 'none' }}
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (!f) {
                  return
                }
                onPendingRemoveLogoChange?.(false)
                onLogoFileChange?.(f)
                onLogoScaleChange?.(1)
                const reader = new FileReader()
                reader.onload = () => {
                  const r = reader.result
                  if (typeof r !== 'string') return
                  onPreviewUrlChange?.(r)
                }
                reader.readAsDataURL(f)
              }}
            />
            <Btn type="button" size="sm" kind="outline" disabled={busy} onClick={() => logoInputRef.current?.click()}>
              Subir logo
            </Btn>
            {hasLogoPreview ? (
              <Btn
                type="button"
                size="sm"
                kind="ghost"
                disabled={busy}
                onClick={() => {
                  onLogoFileChange?.(null)
                  onPendingRemoveLogoChange?.(true)
                  if (logoInputRef.current) logoInputRef.current.value = ''
                  onPreviewUrlChange?.(undefined)
                  onLogoScaleChange?.(1)
                }}
              >
                Quitar logo
              </Btn>
            ) : null}
          </div>
        </div>
        {hasLogoPreview ? (
          <div style={{ marginTop: 14, maxWidth: 420 }}>
            <div
              className="lw-small"
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                gap: 8,
                marginBottom: 6,
              }}
            >
              <span style={{ fontWeight: 600, color: 'var(--lw-text-2)' }}>Tamaño en la barra</span>
              <span style={{ color: 'var(--lw-text-3)', fontVariantNumeric: 'tabular-nums' }}>
                {Math.round(resolvedLogoScale * 100)}%
              </span>
            </div>
            <input
              type="range"
              min={LOGO_SCALE_MIN}
              max={LOGO_SCALE_MAX}
              step={0.05}
              value={resolvedLogoScale}
              disabled={busy || !onLogoScaleChange}
              onChange={(e) => onLogoScaleChange?.(clampStep1LogoScale(Number(e.target.value)))}
              style={{ width: '100%', accentColor: 'var(--lw-accent)' }}
              aria-valuemin={LOGO_SCALE_MIN}
              aria-valuemax={LOGO_SCALE_MAX}
              aria-valuenow={resolvedLogoScale}
            />
            <p className="lw-small" style={{ margin: '8px 0 0', color: 'var(--lw-text-3)', lineHeight: 1.45 }}>
              Escala el hueco del logo en la navegación (como en la web publicada). El navegador usa interpolación
              suavizada; evita subir mucho el tamaño si la imagen es muy pequeña.
            </p>
            {logoUpscaleHint ? (
              <p className="lw-small" style={{ margin: '8px 0 0', color: 'var(--lw-warning)', lineHeight: 1.45 }}>
                {logoUpscaleHint}
              </p>
            ) : null}
          </div>
        ) : null}
      </Field>
      {variant === 'intro' && errors?.message ? (
        <div className="lw-small" style={{ color: 'var(--lw-danger)' }}>
          {errors.message}
        </div>
      ) : null}
    </>
  )
}

function Step1Plantilla({
  errors,
  isLoading: busy,
  templates = [],
  onTemplatePreviewChange,
  logoFile,
  pendingRemoveLogo,
  previewOverrides,
}: WizardStepProps & {
  templates?: Template[]
  onTemplatePreviewChange?: (variant: Step1PreviewVariant) => void
  /** Estado del logo elevado al padre (logo antes que plantilla). */
  logoFile?: File | null
  pendingRemoveLogo?: boolean
  /** Nombre/tagline reales (borrador o BD); si faltan, se usa el demo de la plantilla. */
  previewOverrides?: TemplatePreviewData
}) {
  const nav = useContext(WizardNavContext)
  const list = useMemo(() => (templates.length > 0 ? templates : FALLBACK_TEMPLATES), [templates])
  const [selectedId, setSelectedId] = useState<number | null>(list[0]?.id ?? null)
  /*
   * Paginación visual del grid (no toca la lista canónica de plantillas).
   *  - `templatePage`  : página actual, 0-indexada.
   *  - `animKey` + `animDir`: replicamos el truco de RegisterPage — al cambiar de página
   *    bumpamos `animKey` para forzar un remount del contenedor interior y disparamos
   *    el keyframe que toque (entra desde la derecha o desde la izquierda).
   *  - `animKey > 0` : evitamos animar la primera renderización (sería un slide-in
   *    espurio al hidratar el wizard).
   */
  const [templatePage, setTemplatePage] = useState(0)
  const [animKey, setAnimKey] = useState(0)
  const [animDir, setAnimDir] = useState<1 | -1>(1)
  const pageCount = Math.max(1, Math.ceil(list.length / TEMPLATES_PAGE_SIZE))
  const visibleList = useMemo(
    () =>
      list.slice(
        templatePage * TEMPLATES_PAGE_SIZE,
        templatePage * TEMPLATES_PAGE_SIZE + TEMPLATES_PAGE_SIZE,
      ),
    [list, templatePage],
  )
  const businessSector = useAuthStore((s) => s.business?.sector)
  const signupSector = useMemo(() => {
    if (typeof businessSector === 'string' && businessSector.trim()) {
      return businessSector.trim()
    }
    const parsed = readSignupPrefill()
    if (parsed && typeof parsed.sector === 'string' && parsed.sector.trim()) {
      return parsed.sector.trim()
    }
    return 'otros'
  }, [businessSector])
  const [fullscreen, setFullscreen] = useState<{ variant: Step1PreviewVariant; label: string } | null>(null)

  // Keep selection in sync when API data replaces cache/fallback (IDs in DB may not match stale template_id).
  useEffect(() => {
    if (list.length === 0) return
    setSelectedId((prev) =>
      prev != null && list.some((t) => t.id === prev) ? prev : list[0]!.id,
    )
  }, [list])

  /*
   * Si el negocio ya tenía una plantilla elegida en otra página (p. ej. el server
   * devuelve un `template_id` que cae en la página 2) saltamos a esa página sin
   * animación al montar; cualquier cambio posterior por dot click sí anima.
   */
  useEffect(() => {
    if (selectedId == null) return
    const idx = list.findIndex((t) => t.id === selectedId)
    if (idx < 0) return
    const targetPage = Math.floor(idx / TEMPLATES_PAGE_SIZE)
    setTemplatePage((prev) => (prev === targetPage ? prev : targetPage))
  }, [selectedId, list])

  /*
   * Si la lista se acorta (p. ej. el admin retira una plantilla mientras estoy en
   * la última página) recortamos `templatePage` para no quedarnos en una página vacía.
   */
  useEffect(() => {
    if (templatePage > 0 && templatePage >= pageCount) {
      setTemplatePage(pageCount - 1)
    }
  }, [pageCount, templatePage])

  useEffect(() => {
    if (!fullscreen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setFullscreen(null)
    }
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [fullscreen])

  useLayoutEffect(() => {
    nav?.registerContinueHandler?.(() => ({
      template_id: selectedId ?? list[0]?.id ?? 1,
      sector: signupSector,
      logo: logoFile ?? undefined,
      removeLogo: Boolean(pendingRemoveLogo && !logoFile),
    }))
    return () => nav?.registerContinueHandler?.(null)
  }, [nav, selectedId, signupSector, list, logoFile, pendingRemoveLogo])

  useEffect(() => {
    const selected = list.find((t) => t.id === selectedId) ?? list[0]
    if (!selected) return
    onTemplatePreviewChange?.(resolveStep1PreviewVariant(selected))
  }, [list, selectedId, onTemplatePreviewChange])

  const previewByVariant = useMemo(() => {
    const out: Partial<Record<Step1PreviewVariant, TemplatePreviewData>> = {}
    for (const t of visibleList) {
      const v = resolveStep1PreviewVariant(t)
      if (!out[v]) out[v] = mergeStep1TemplatePreview(v, previewOverrides)
    }
    return out
  }, [visibleList, previewOverrides])

  return (
    <>
      <div>
        <h1 className="lw-h2">Elige tu plantilla</h1>
        <p className="lw-body" style={{ marginTop: 6, maxWidth: 540 }}>
          Empieza con un diseño hecho para tu sector. Podrás cambiarlo en cualquier momento, sin perder lo que ya hayas escrito.
        </p>
      </div>
      <style>
        {`
@keyframes lw-tpl-slide-in-right {
  from { transform: translateX(100%); opacity: 0; }
  to   { transform: translateX(0);    opacity: 1; }
}
@keyframes lw-tpl-slide-in-left {
  from { transform: translateX(-100%); opacity: 0; }
  to   { transform: translateX(0);     opacity: 1; }
}
@media (prefers-reduced-motion: reduce) {
  /* Respeta el OS: cambio instantáneo de página, sin slide. */
  .lw-step1-template-grid-anim { animation: none !important; }
}
`}
      </style>
      {/*
        El grid real va dentro de un wrapper con `overflow:hidden` para que el slide
        horizontal no provoque scroll lateral en el panel del wizard. Cambiar `key`
        del hijo fuerza un remount y reinicia el keyframe sin necesidad de Web Animations.
      */}
      <div style={{ overflow: 'hidden' }}>
        <div
          key={animKey}
          className={`lw-step1-template-grid${animKey > 0 ? ' lw-step1-template-grid-anim' : ''}`}
          style={{
            ...(animKey > 0
              ? {
                  animation: `${
                    animDir === 1 ? 'lw-tpl-slide-in-right' : 'lw-tpl-slide-in-left'
                  } 220ms ease-out`,
                }
              : {}),
          }}
        >
        {visibleList.map((t) => {
          const isSel = t.id === selectedId
          const variant = resolveStep1PreviewVariant(t)
          return (
            <Card
              key={t.id}
              padding={0}
              style={{
                overflow: 'hidden',
                padding: 0,
                borderColor: isSel ? ACCENT : BORDER,
                boxShadow: isSel ? '0 0 0 3px var(--lw-accent-ring), var(--lw-shadow-1)' : 'var(--lw-shadow-1)',
              }}
            >
              <div
                className="lw-template-card-preview"
                style={{ position: 'relative', width: '100%', borderBottom: `1px solid ${BORDER}` }}
              >
                <TemplateIframe
                  variant={variant}
                  mode="thumb"
                  previewData={previewByVariant[variant]}
                />
                <div style={{ position: 'absolute', top: 8, left: 8 }}>
                  <Badge
                    tone={t.requires_pro ? 'pro' : 'success'}
                    size="sm"
                    style={
                      t.requires_pro
                        ? {
                            background:
                              'linear-gradient(135deg, #78350f 0%, #92400e 22%, #b45309 48%, #d97706 72%, #f59e0b 100%)',
                            color: '#fefce8',
                            border: '1px solid rgba(253, 224, 71, 0.55)',
                            boxShadow: '0 1px 3px rgba(120, 53, 15, 0.4)',
                            fontWeight: 700,
                            letterSpacing: '0.06em',
                          }
                        : {
                            background:
                              'linear-gradient(135deg, #065f46 0%, #047857 28%, #059669 55%, #10b981 82%, #34d399 100%)',
                            color: '#ecfdf5',
                            border: '1px solid rgba(167, 243, 208, 0.65)',
                            boxShadow: '0 1px 3px rgba(6, 78, 59, 0.35)',
                            fontWeight: 700,
                            letterSpacing: '0.06em',
                          }
                    }
                  >
                    {t.requires_pro ? 'PRO' : 'FREE'}
                  </Badge>
                </div>
                {isSel && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      width: 22,
                      height: 22,
                      background: ACCENT,
                      borderRadius: 999,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      boxShadow: '0 0 0 3px #fff',
                    }}
                  >
                    <Icon name="check" size={13} />
                  </div>
                )}
              </div>
              <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{t.name}</div>
                  <div className="lw-small">{t.slug}</div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <Btn
                    size="sm"
                    kind="outline"
                    fullWidth
                    type="button"
                    disabled={busy}
                    onClick={() => setFullscreen({ variant, label: t.name })}
                  >
                    Ver
                  </Btn>
                  <Btn
                    size="sm"
                    kind={isSel ? 'dark' : 'primary'}
                    fullWidth
                    type="button"
                    disabled={busy}
                    onClick={() => setSelectedId(t.id)}
                  >
                    {isSel ? 'Elegida' : 'Elegir'}
                  </Btn>
                </div>
              </div>
            </Card>
          )
        })}
        </div>
      </div>
      {pageCount > 1 ? (
        <div
          role="tablist"
          aria-label="Páginas de plantillas"
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 8,
            marginTop: 4,
          }}
        >
          {Array.from({ length: pageCount }).map((_, pi) => {
            const active = pi === templatePage
            return (
              <button
                key={pi}
                type="button"
                role="tab"
                aria-selected={active}
                aria-label={`Ir a la página ${pi + 1} de ${pageCount}`}
                onClick={() => {
                  if (pi === templatePage) return
                  /* `animDir` decide si el grid entra desde la derecha (avance) o
                     desde la izquierda (retroceso); el remount via `animKey` lo
                     dispara en el siguiente render. */
                  setAnimDir(pi > templatePage ? 1 : -1)
                  setAnimKey((k) => k + 1)
                  setTemplatePage(pi)
                }}
                style={{
                  padding: 0,
                  border: 'none',
                  cursor: 'pointer',
                  height: 8,
                  borderRadius: 999,
                  background: active ? 'var(--lw-accent)' : 'var(--lw-border-2)',
                  width: active ? 22 : 8,
                  transition: 'width .25s ease, background .25s ease',
                }}
              />
            )
          })}
        </div>
      ) : null}
      {errors?.template_id ? (
        <div className="lw-small" style={{ color: 'var(--lw-danger)' }}>
          {errors.template_id}
        </div>
      ) : null}
      {errors?.message ? (
        <div className="lw-small" style={{ color: 'var(--lw-danger)' }}>
          {errors.message}
        </div>
      ) : null}
      {fullscreen
        ? createPortal(
            <div
              role="dialog"
              aria-modal="true"
              aria-label={`Vista previa a pantalla completa: ${fullscreen.label}`}
              style={{
                position: 'fixed',
                inset: 0,
                zIndex: 9999,
                background: 'rgba(15, 23, 42, 0.55)',
                backdropFilter: 'blur(6px)',
                display: 'flex',
                flexDirection: 'column',
                padding: 'clamp(12px, 3vw, 24px)',
              }}
              onClick={() => setFullscreen(null)}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                  marginBottom: 12,
                  flexShrink: 0,
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: '#fff' }}>{fullscreen.label}</div>
                  <div className="lw-small" style={{ color: 'rgba(255,255,255,.75)', marginTop: 2 }}>
                    Vista a pantalla completa · Esc para cerrar
                  </div>
                </div>
                <Btn kind="ghost" size="md" type="button" icon="x" onClick={() => setFullscreen(null)} style={{ color: '#fff' }}>
                  Cerrar
                </Btn>
              </div>
              <div
                style={{
                  flex: 1,
                  minHeight: 0,
                  borderRadius: 'var(--lw-r)',
                  overflow: 'hidden',
                  border: '1px solid rgba(255,255,255,.2)',
                  boxShadow: '0 24px 80px rgba(0,0,0,.35)',
                  background: '#fff',
                  display: 'flex',
                  flexDirection: 'column',
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <TemplateIframe
                  variant={fullscreen.variant}
                  mode="full"
                  embed={false}
                  previewData={mergeStep1TemplatePreview(fullscreen.variant, previewOverrides)}
                />
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  )
}

// Preview rail used across most steps — small fake browser
function PreviewBrowser({
  children,
  url = 'estudio-marta.localweb.es',
}: {
  children: ReactNode
  url?: string
}) {
  return (
    <BrowserChrome url={url} style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <div className="lw-scroll" style={{ flex: 1, overflow: "auto", background: "#fff" }}>
        {children}
      </div>
    </BrowserChrome>
  );
}

function TplPreview({
  variant = 'urban-bold',
  previewData,
}: {
  variant?: Step1PreviewVariant
  previewData?: TemplatePreviewData
}) {
  const mergedPreview = useMemo(
    () => mergeStep1TemplatePreview(variant, previewData),
    [variant, previewData],
  )
  return (
    <PreviewBrowser url={previewDemoHostForVariant(variant)}>
      <TemplateIframe variant={variant} mode="full" embed previewData={mergedPreview} />
    </PreviewBrowser>
  )
}

function CoverDropzone({
  file: externalFile = null,
  busy,
  onFileChange,
  placeholder = 'Pulsa para elegir foto de portada',
}: {
  file?: File | null
  busy: boolean
  onFileChange: (file: File | null) => void
  placeholder?: string
}) {
  const ref = useRef<HTMLInputElement>(null)
  const [localFile, setLocalFile] = useState<File | null>(externalFile)
  const [thumbUrl, setThumbUrl] = useState<string | null>(null)

  useEffect(() => {
    setLocalFile(externalFile)
  }, [externalFile])

  useEffect(() => {
    if (!localFile) { setThumbUrl(null); return }
    const u = URL.createObjectURL(localFile)
    setThumbUrl(u)
    return () => URL.revokeObjectURL(u)
  }, [localFile])

  const handlePick = useCallback((f: File | null) => {
    setLocalFile(f)
    onFileChange(f)
  }, [onFileChange])

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => !busy && ref.current?.click()}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          ref.current?.click()
        }
      }}
      style={{
        border: '1.5px dashed var(--lw-border-2)',
        borderRadius: 'var(--lw-r)',
        padding: 0,
        background: 'var(--lw-bg-elev)',
        cursor: busy ? 'not-allowed' : 'pointer',
        opacity: busy ? 0.6 : 1,
        overflow: 'hidden',
      }}
    >
      <input
        ref={ref}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        style={{ display: 'none' }}
        onChange={(e) => {
          handlePick(e.target.files?.[0] ?? null)
          e.target.value = ''
        }}
      />
      {thumbUrl ? (
        <div style={{ position: 'relative', width: '100%' }}>
          <img
            src={thumbUrl}
            alt="Vista previa de portada seleccionada"
            style={{ width: '100%', height: 220, objectFit: 'cover', display: 'block' }}
          />
          <Btn
            kind="ghost"
            size="sm"
            icon="trash"
            type="button"
            disabled={busy}
            style={{
              position: 'absolute',
              top: 10,
              right: 10,
              color: '#fff',
              background: 'rgba(15,23,42,.65)',
            }}
            onClick={(e) => {
              e.stopPropagation()
              handlePick(null)
            }}
          >
            Quitar
          </Btn>
        </div>
      ) : (
        <div style={{ padding: 28, textAlign: 'center' }}>
          <Icon name="upload" size={22} />
          <div style={{ fontSize: 14, fontWeight: 500, marginTop: 8 }}>
            {placeholder}
            <span style={{ color: ACCENT, textDecoration: 'underline' }}> · 16:9</span>
          </div>
          <div className="lw-small" style={{ marginTop: 4 }}>
            JPG o PNG · recomendado 1920 × 1080
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Step 2 · Portada ────────────────────────────────────────
//
// IMPORTANTE: este paso replica EXACTAMENTE el patrón de `Step3Sobre` para la subida de imagen
// (el que funciona sin congelarse). Mismo `useState<string | null>` + `useEffect` con
// `createObjectURL`/`revokeObjectURL` síncronos, mismo dropzone, mismo botón "Quitar"
// superpuesto sobre la imagen. Sin URL gestionadas por el padre, sin probes, sin reset de input,
// sin `useEffect` que reenvía `file` al padre. Si en otros pasos funciona, aquí también.
function Step2Portada({
  errors,
  isLoading: busy,
  currentCoverFile,
  onCoverChange,
  currentCoverFile2,
  onCoverChange2,
  currentCoverFile3,
  onCoverChange3,
  heroPhotoSlots = 1,
  businessName,
  onBusinessNameChange,
  tagline,
  onTaglineChange,
  logoPreviewUrl,
  onLogoPreviewUrlChange,
  logoScale,
  onLogoScaleChange,
  logoFile,
  onLogoFileChange,
  pendingRemoveLogo,
  onPendingRemoveLogoChange,
}: WizardStepProps & {
  currentCoverFile?: File | null
  onCoverChange?: (file: File | null) => void
  currentCoverFile2?: File | null
  onCoverChange2?: (file: File | null) => void
  currentCoverFile3?: File | null
  onCoverChange3?: (file: File | null) => void
  heroPhotoSlots?: number
  businessName: string
  onBusinessNameChange: (value: string) => void
  tagline: string
  onTaglineChange: (value: string) => void
  logoPreviewUrl?: string
  onLogoPreviewUrlChange?: (url: string | undefined) => void
  logoScale?: number
  onLogoScaleChange?: (scale: number) => void
  logoFile?: File | null
  onLogoFileChange?: (file: File | null) => void
  pendingRemoveLogo?: boolean
  onPendingRemoveLogoChange?: (v: boolean) => void
}) {
  const nav = useContext(WizardNavContext)
  const file = currentCoverFile ?? null
  const file2 = currentCoverFile2 ?? null
  const file3 = currentCoverFile3 ?? null
  useLayoutEffect(() => {
    nav?.registerContinueHandler?.(() => ({
      cover: file as File,
      cover2: heroPhotoSlots >= 2 ? (file2 as File) : undefined,
      cover3: heroPhotoSlots >= 3 ? (file3 as File) : undefined,
      logo: logoFile ?? undefined,
      removeLogo: Boolean(pendingRemoveLogo && !logoFile),
    }))
    return () => nav?.registerContinueHandler?.(null)
  }, [nav, file, file2, file3, heroPhotoSlots, logoFile, pendingRemoveLogo])

  return (
    <>
      <div>
        <h1 className="lw-h2">Tu portada</h1>
        <p className="lw-body" style={{ marginTop: 6 }}>
          {heroPhotoSlots > 1
            ? `Sube hasta ${heroPhotoSlots} fotos de portada para tu collage. JPG o PNG, hasta 8 MB cada una.`
            : 'Sube la foto principal de tu negocio. JPG o PNG, hasta 8 MB. Recomendado 16:9 (p. ej. 1920\u00d71080).'}
        </p>
      </div>
      <Field label="Nombre del negocio">
        <Input
          value={businessName}
          disabled={busy}
          onChange={(e) => onBusinessNameChange(e.target.value)}
          placeholder="Estudio Marta"
        />
      </Field>
      <Field label="Tagline" hint="Se verá justo debajo del nombre en portada.">
        <Input
          value={tagline}
          disabled={busy}
          onChange={(e) => onTaglineChange(e.target.value)}
          placeholder="Cortes con criterio en el corazón de Lavapiés"
        />
      </Field>
      <Step1Logo
        variant="embedded"
        errors={errors}
        isLoading={busy}
        previewUrl={logoPreviewUrl}
        onPreviewUrlChange={onLogoPreviewUrlChange}
        logoScale={logoScale}
        onLogoScaleChange={onLogoScaleChange}
        onLogoFileChange={onLogoFileChange}
        onPendingRemoveLogoChange={onPendingRemoveLogoChange}
      />
      <Field label={heroPhotoSlots > 1 ? 'Foto principal' : 'Foto de portada'} error={errors?.cover}>
        <CoverDropzone
          file={file}
          busy={busy ?? false}
          onFileChange={(f) => onCoverChange?.(f)}
          placeholder="Pulsa para elegir foto de portada"
        />
      </Field>
      {heroPhotoSlots >= 2 && (
        <Field label="Foto 2" error={errors?.cover2}>
          <CoverDropzone
            file={file2}
            busy={busy ?? false}
            onFileChange={(f) => onCoverChange2?.(f)}
            placeholder="Pulsa para elegir la segunda foto"
          />
        </Field>
      )}
      {heroPhotoSlots >= 3 && (
        <Field label="Foto 3" error={errors?.cover3}>
          <CoverDropzone
            file={file3}
            busy={busy ?? false}
            onFileChange={(f) => onCoverChange3?.(f)}
            placeholder="Pulsa para elegir la tercera foto"
          />
        </Field>
      )}
      {errors?.message ? (
        <div className="lw-small" style={{ color: 'var(--lw-danger)' }}>
          {errors.message}
        </div>
      ) : null}
    </>
  )
}
function PortadaPreview({
  variant = 'urban-bold',
  previewData,
}: {
  variant?: Step1PreviewVariant
  previewData?: TemplatePreviewData
}) {
  return (
    <PreviewBrowser url={previewDemoHostForVariant(variant)}>
      <TemplateIframe variant={variant} mode="full" embed previewData={previewData} />
    </PreviewBrowser>
  )
}

function SobrePreview({
  variant = 'urban-bold',
  previewData,
}: {
  variant?: Step1PreviewVariant
  previewData?: TemplatePreviewData
}) {
  /** Vista previa del paso 3: el iframe carga `#sobre-nosotros`; cada plantilla debe exponer ese id. */
  return (
    <PreviewBrowser url={previewDemoHostForVariant(variant)}>
      <TemplateIframe
        variant={variant}
        mode="full"
        embed
        previewData={previewData}
        initialHash="#sobre-nosotros"
      />
    </PreviewBrowser>
  )
}

// ─── Step 3 · Sobre nosotros ─────────────────────────────────
function Step3Sobre({
  errors,
  isLoading: busy,
  initialBusinessName = '',
  initialTagline = '',
  description,
  onDescriptionChange,
  contactPhone,
  onContactPhoneChange,
  currentAboutPhotoFile,
  onAboutPhotoChange,
}: WizardStepProps & {
  /** Nombre y tagline vienen del paso Portada; se reenvían al API sin volver a pedirlos. */
  initialBusinessName?: string
  initialTagline?: string
  description: string
  onDescriptionChange: (value: string) => void
  contactPhone: string
  onContactPhoneChange: (value: string) => void
  currentAboutPhotoFile: File | null
  onAboutPhotoChange: (file: File | null) => void
}) {
  const nav = useContext(WizardNavContext)
  const aboutRef = useRef<HTMLInputElement>(null)
  const [aboutThumbUrl, setAboutThumbUrl] = useState<string | null>(null)
  const descMax = 300
  // Si por lo que sea (paso 2 saltado, borrador antiguo, etc.) llegamos aquí sin nombre, el
  // backend devuelve 422 en business_name y goNext setea ese error: tenemos que mostrarlo
  // explícitamente porque este paso no expone su input para Nombre/Tagline.
  const missingMetaError = errors?.business_name ?? errors?.tagline ?? null

  useLayoutEffect(() => {
    nav?.registerContinueHandler?.(() => ({
      business_name: initialBusinessName.trim(),
      tagline: initialTagline.trim() || undefined,
      description: description.trim() || undefined,
      about_photo: currentAboutPhotoFile ?? undefined,
    }))
    return () => nav?.registerContinueHandler?.(null)
  }, [nav, initialBusinessName, initialTagline, description, currentAboutPhotoFile])

  useEffect(() => {
    if (!currentAboutPhotoFile) {
      setAboutThumbUrl(null)
      return
    }
    const u = URL.createObjectURL(currentAboutPhotoFile)
    setAboutThumbUrl(u)
    return () => URL.revokeObjectURL(u)
  }, [currentAboutPhotoFile])

  return (
    <>
      <div>
        <h1 className="lw-h2">Sobre vosotros</h1>
        <p className="lw-body" style={{ marginTop: 6 }}>
          Cuenta brevemente a qué os dedicáis y qué os hace especiales. Funciona mejor si suena a vosotros, no a
          folleto.
        </p>
      </div>
      {missingMetaError ? (
        <div
          role="alert"
          style={{
            border: '1px solid var(--lw-danger)',
            borderRadius: 'var(--lw-r)',
            padding: '10px 12px',
            background: 'rgba(239, 68, 68, 0.06)',
            color: 'var(--lw-danger)',
            fontSize: 14,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <span>
            Falta el nombre del negocio (lo escribes en el paso anterior, "Tu portada").
          </span>
          <Btn
            kind="ghost"
            size="sm"
            type="button"
            disabled={busy}
            onClick={() => nav?.onJumpToStep?.(2)}
          >
            Volver al paso 2
          </Btn>
        </div>
      ) : null}
      <Field
        label="Descripción"
        error={errors?.description}
        counter={`${description.length} / ${descMax}`}
      >
        <Textarea
          rows={10}
          value={description}
          disabled={busy}
          maxLength={descMax}
          onChange={(e) => onDescriptionChange(e.target.value)}
          placeholder="Historia breve de tu negocio…"
          style={{
            minHeight: 200,
            resize: 'vertical' as const,
          }}
        />
      </Field>
      <Field label="Teléfono de contacto" hint="Aparecerá como botón clicable en tu web.">
        <Input
          value={contactPhone}
          disabled={busy}
          onChange={(e) => onContactPhoneChange(e.target.value)}
          prefix={<Icon name="phone" size={14} />}
          placeholder="+34 …"
        />
      </Field>
      <input
        ref={aboutRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        style={{ display: 'none' }}
        onChange={(e) => onAboutPhotoChange(e.target.files?.[0] ?? null)}
      />
      <Field label="Foto del equipo (opcional)" hint="Vertical 3:4, buena luz. Aparece en Sobre nosotros." error={errors?.about_photo}>
        <div
          role="button"
          tabIndex={0}
          onClick={() => !busy && aboutRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              aboutRef.current?.click()
            }
          }}
          style={{
            border: `1.5px dashed var(--lw-border-2)`,
            borderRadius: 'var(--lw-r)',
            padding: 0,
            background: 'var(--lw-bg-elev)',
            cursor: busy ? 'not-allowed' : 'pointer',
            opacity: busy ? 0.6 : 1,
            overflow: 'hidden',
          }}
        >
          {aboutThumbUrl ? (
            <div style={{ position: 'relative', width: '100%' }}>
              <img
                src={aboutThumbUrl}
                alt=""
                style={{ width: '100%', height: 220, objectFit: 'cover', display: 'block' }}
              />
              <Btn
                kind="ghost"
                size="sm"
                icon="trash"
                type="button"
                disabled={busy}
                style={{
                  position: 'absolute',
                  top: 10,
                  right: 10,
                  color: '#fff',
                  background: 'rgba(15,23,42,.65)',
                }}
                onClick={(e) => {
                  e.stopPropagation()
                  onAboutPhotoChange(null)
                }}
              >
                Quitar
              </Btn>
            </div>
          ) : (
            <div style={{ padding: 28, textAlign: 'center' }}>
              <Icon name="upload" size={22} />
              <div style={{ fontSize: 14, fontWeight: 500, marginTop: 8 }}>Pulsa para elegir foto del equipo</div>
              <div className="lw-small" style={{ marginTop: 4 }}>JPG o PNG · recomendado vertical</div>
            </div>
          )}
        </div>
      </Field>
      {errors?.message ? (
        <div className="lw-small" style={{ color: 'var(--lw-danger)' }}>
          {errors.message}
        </div>
      ) : null}
    </>
  )
}

/** Resultado del paso 4 para `goNext`: borrador (todas las fotos) o solo nuevas tras Pro (append en BD). */
export type Step4ContinueResult = File[] | { __step4Append: true; newPhotos: File[] }

// ─── Step 4 · Galería (con upsell Free → Pro) ────────────────
function Step4Galeria({
  pro = false,
  postCheckoutProBanner,
  galleryAppendMode = false,
  existingPhotoUrls = [],
  newPhotos = [],
  onNewPhotosChange,
  errors,
  isLoading: busy,
  photos,
  onPhotosChange,
  onGalleryPreviewUrlsChange,
}: WizardStepProps & {
  pro?: boolean
  /** Tras volver de Stripe Pro: mensaje de celebración y límite ampliado. */
  postCheckoutProBanner?: boolean
  /**
   * Modo append: la galería ya está en R2/`business_images`. `existingPhotoUrls` son solo vista;
   * solo `newPhotos` se envían en step4.
   */
  galleryAppendMode?: boolean
  existingPhotoUrls?: string[]
  newPhotos?: File[]
  onNewPhotosChange?: (files: File[]) => void
  /** Modo borrador (pre-business): todas las fotos en un solo array. */
  photos: File[]
  onPhotosChange: (files: File[]) => void
  onGalleryPreviewUrlsChange?: (urls: string[]) => void
}) {
  const nav = useContext(WizardNavContext)
  const galleryRef = useRef<HTMLInputElement>(null)
  const slots = pro ? 20 : 3
  const [thumbUrls, setThumbUrls] = useState<string[]>([])
  const [qualities, setQualities] = useState<GalleryImageQuality[]>([])

  const existingCount = galleryAppendMode ? existingPhotoUrls.length : 0
  const localFiles = galleryAppendMode ? (newPhotos ?? []) : photos
  const totalCount = existingCount + localFiles.length

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      if (galleryAppendMode) {
        const newThumbs = await filesToDataUrls(newPhotos ?? [])
        if (!cancelled) {
          setThumbUrls([...(existingPhotoUrls ?? []), ...newThumbs])
          onGalleryPreviewUrlsChange?.([])
        }
      } else {
        const urls = await filesToDataUrls(photos)
        if (!cancelled) {
          setThumbUrls(urls)
          onGalleryPreviewUrlsChange?.(urls)
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [galleryAppendMode, existingPhotoUrls, newPhotos, photos, onGalleryPreviewUrlsChange])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const scores = await Promise.all(localFiles.map((f) => evaluateGalleryImageQuality(f)))
      if (!cancelled) setQualities(scores.map((s) => s.quality))
    })()
    return () => {
      cancelled = true
    }
  }, [localFiles])

  useLayoutEffect(() => {
    if (galleryAppendMode) {
      nav?.registerContinueHandler?.(
        () => ({ __step4Append: true as const, newPhotos: newPhotos ?? [] }) satisfies Step4ContinueResult,
      )
      return () => nav?.registerContinueHandler?.(null)
    }
    nav?.registerContinueHandler?.(() => photos)
    return () => nav?.registerContinueHandler?.(null)
  }, [nav, galleryAppendMode, newPhotos, photos])

  const removeAt = (idx: number) => {
    if (galleryAppendMode) {
      if (idx < existingCount) return
      const j = idx - existingCount
      onNewPhotosChange?.((newPhotos ?? []).filter((_, i) => i !== j))
      return
    }
    onPhotosChange(photos.filter((_, i) => i !== idx))
  }

  const qualityBadge = (q: GalleryImageQuality | undefined) => {
    if (!q) return null
    const styles: Record<GalleryImageQuality, { bg: string; fg: string; label: string }> = {
      excelente: { bg: 'var(--lw-success-soft)', fg: 'var(--lw-success)', label: 'Excelente para web' },
      buena: { bg: 'rgba(59,130,246,.12)', fg: '#2563eb', label: 'Buena calidad' },
      aceptable: { bg: 'rgba(245,158,11,.15)', fg: '#b45309', label: 'Aceptable · podría mejorarse' },
      baja: { bg: 'rgba(248,113,113,.15)', fg: 'var(--lw-danger)', label: 'Baja resolución · mejor otra foto' },
    }
    const s = styles[q]
    return (
      <span
        style={{
          display: 'inline-block',
          marginTop: 6,
          padding: '4px 8px',
          borderRadius: 6,
          fontSize: 11,
          fontWeight: 600,
          background: s.bg,
          color: s.fg,
        }}
      >
        {s.label}
      </span>
    )
  }

  return (
    <>
      {postCheckoutProBanner ? (
        <div
          style={{
            marginBottom: 16,
            padding: 14,
            borderRadius: 'var(--lw-r-sm)',
            border: '1px solid var(--lw-success)',
            background: 'var(--lw-success-soft)',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <Icon name="sparkle" size={20} color="var(--lw-success)" />
          <div style={{ fontSize: 14, fontWeight: 600, color: '#14532d' }}>¡Ya eres Pro! Ahora puedes añadir hasta 20 fotos</div>
        </div>
      ) : null}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 16 }}>
        <div>
          <h1 className="lw-h2">Tu galería</h1>
          <p className="lw-body" style={{ marginTop: 6 }}>
            Sube fotos de tu local, tu equipo o tu trabajo. Para pantallas grandes conviene al menos unos 1200 px en el
            lado más corto; te indicamos la calidad de cada imagen.
          </p>
        </div>
        <div className="lw-small" style={{ whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>
          <span style={{ color: 'var(--lw-text)', fontWeight: 600 }}>{totalCount}</span>
          <span> de {slots} fotos</span>
        </div>
      </div>

      {galleryAppendMode ? (
        <p className="lw-small" style={{ marginTop: -8, color: 'var(--lw-text-3)' }}>
          Las fotos que ya estaban en tu web se muestran arriba; solo las nuevas se suben al continuar.
        </p>
      ) : null}

      {!pro && (
        <div
          style={{
            padding: 12,
            paddingLeft: 14,
            background: 'var(--lw-pro-soft)',
            border: '1px solid #FCD34D',
            borderRadius: 'var(--lw-r-sm)',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <Icon name="sparkle" size={18} color="var(--lw-pro)" />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#78350F' }}>Pro incluye hasta 17 fotos más</div>
            <div className="lw-small" style={{ color: '#92400E' }}>
              Una galería más rica convierte mejor las visitas.
            </div>
          </div>
        </div>
      )}

      <input
        ref={galleryRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        style={{ display: 'none' }}
        onChange={(e) => {
          const picked = Array.from(e.target.files ?? []) as File[]
          const room = Math.max(0, slots - existingCount)
          const nextLocal = [...localFiles, ...picked].slice(0, room)
          if (galleryAppendMode) {
            onNewPhotosChange?.(nextLocal)
          } else {
            onPhotosChange(nextLocal)
          }
          e.target.value = ''
        }}
      />

      <Field error={errors?.photos}>
        <Btn
          kind="outline"
          type="button"
          disabled={busy || totalCount >= slots}
          onClick={() => galleryRef.current?.click()}
        >
          Añadir fotos
        </Btn>
      </Field>

      <div className="lw-wizard-gallery-grid">
        {galleryAppendMode
          ? (existingPhotoUrls ?? []).map((url, i) => (
              <div key={`gal-existing-${i}-${url.slice(-24)}`} style={{ position: 'relative' }}>
                <div
                  style={{
                    aspectRatio: '1/1',
                    borderRadius: 'var(--lw-r-sm)',
                    overflow: 'hidden',
                    border: `1px solid var(--lw-border)`,
                    background: 'var(--lw-bg-elev)',
                  }}
                >
                  <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                </div>
                <button
                  type="button"
                  title="Ya publicadas · gestiona la galería desde el panel cuando termines"
                  disabled
                  aria-label="Foto ya en tu web"
                  style={{
                    position: 'absolute',
                    top: 6,
                    right: 6,
                    width: 28,
                    height: 28,
                    borderRadius: 999,
                    background: 'rgba(15,23,42,.45)',
                    color: '#fff',
                    border: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'not-allowed',
                    opacity: 0.85,
                  }}
                >
                  <Icon name="lock" size={12} />
                </button>
              </div>
            ))
          : null}
        {localFiles.map((file, i) => {
          const gridIndex = existingCount + i
          return (
            <div key={`gal-${gridIndex}-${file.lastModified}-${file.name}`} style={{ position: 'relative' }}>
              <div
                style={{
                  aspectRatio: '1/1',
                  borderRadius: 'var(--lw-r-sm)',
                  overflow: 'hidden',
                  border: `1px solid var(--lw-border)`,
                  background: 'var(--lw-bg-elev)',
                }}
              >
                {thumbUrls[gridIndex] ? (
                  <img
                    src={thumbUrls[gridIndex]}
                    alt=""
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                ) : (
                  <Placeholder ratio="1:1" label={file.name.slice(0, 12)} />
                )}
              </div>
              {qualityBadge(qualities[i])}
              <button
                type="button"
                aria-label="Quitar foto"
                style={{
                  position: 'absolute',
                  top: 6,
                  right: 6,
                  width: 28,
                  height: 28,
                  borderRadius: 999,
                  background: 'rgba(15,23,42,.75)',
                  color: '#fff',
                  border: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
                onClick={() => removeAt(gridIndex)}
              >
                <Icon name="x" size={12} />
              </button>
            </div>
          )
        })}
        {Array.from({ length: Math.max(0, Math.min(slots, 9) - totalCount) }).map((_, i) => (
          <div
            key={`empty-${i}`}
            style={{
              aspectRatio: '1/1',
              border: `1.5px dashed var(--lw-border-2)`,
              borderRadius: 'var(--lw-r-sm)',
              background: 'var(--lw-bg-elev)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
              color: 'var(--lw-text-3)',
            }}
          >
            <Icon name="plus" size={18} />
            <span style={{ fontSize: 11, fontWeight: 500 }}>Hueco</span>
          </div>
        ))}
      </div>
      {errors?.message ? (
        <div className="lw-small" style={{ color: 'var(--lw-danger)' }}>
          {errors.message}
        </div>
      ) : null}
    </>
  )
}
function GaleriaPreview({
  variant = 'urban-bold',
  previewData,
}: {
  variant?: Step1PreviewVariant
  previewData?: TemplatePreviewData
}) {
  return (
    <PreviewBrowser url={previewDemoHostForVariant(variant)}>
      <TemplateIframe variant={variant} mode="full" embed previewData={previewData} initialHash="#galeria" />
    </PreviewBrowser>
  )
}

function ServiciosPreview({
  variant = 'urban-bold',
  previewData,
}: {
  variant?: Step1PreviewVariant
  previewData?: TemplatePreviewData
}) {
  return (
    <PreviewBrowser url={previewDemoHostForVariant(variant)}>
      <TemplateIframe variant={variant} mode="full" embed previewData={previewData} initialHash="#servicios" />
    </PreviewBrowser>
  )
}

type HorarioDay = { d: string; o?: string; c?: string; closed?: boolean }

export const DEFAULT_SCHEDULE: Schedule = {
  mon: { open: '10:00', close: '20:00', closed: false },
  tue: { open: '10:00', close: '20:00', closed: false },
  wed: { open: '10:00', close: '20:00', closed: false },
  thu: { open: '10:00', close: '20:00', closed: false },
  fri: { open: '10:00', close: '21:00', closed: false },
  sat: { open: '10:00', close: '14:00', closed: false },
  sun: { open: '10:00', close: '14:00', closed: true },
}

const DAY_KEYS: (keyof Schedule)[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']
const DAY_LABEL_ES: Record<keyof Schedule, string> = {
  mon: 'Lunes',
  tue: 'Martes',
  wed: 'Miércoles',
  thu: 'Jueves',
  fri: 'Viernes',
  sat: 'Sábado',
  sun: 'Domingo',
}

export function scheduleToPreviewRows(s: Schedule): HorarioDay[] {
  return DAY_KEYS.map((k) => ({
    d: DAY_LABEL_ES[k],
    o: s[k].open,
    c: s[k].close,
    closed: s[k].closed,
  }))
}

export function applyScheduleTemplate(s: Schedule, kind: 'lv' | 'ls' | 'all'): Schedule {
  const next: Schedule = JSON.parse(JSON.stringify(s))
  if (kind === 'lv') {
    ;(['mon', 'tue', 'wed', 'thu', 'fri'] as const).forEach((d) => {
      next[d] = { open: '09:00', close: '20:00', closed: false }
    })
    next.sat = { ...next.sat, closed: true }
    next.sun = { ...next.sun, closed: true }
  }
  if (kind === 'ls') {
    ;(['mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const).forEach((d) => {
      next[d] = { open: '10:00', close: '21:00', closed: false }
    })
    next.sun = { ...next.sun, closed: true }
  }
  if (kind === 'all') {
    DAY_KEYS.forEach((d) => {
      next[d] = { open: '10:00', close: '20:00', closed: false }
    })
  }
  return next
}

// ─── Step 5 · Horarios ───────────────────────────────────────
function Step5Horarios({
  errors,
  isLoading: busy,
  schedule,
  onScheduleChange,
}: WizardStepProps & {
  schedule: Schedule
  onScheduleChange: (s: Schedule) => void
}) {
  const nav = useContext(WizardNavContext)

  useLayoutEffect(() => {
    nav?.registerContinueHandler?.(() => schedule)
    return () => nav?.registerContinueHandler?.(null)
  }, [nav, schedule])

  const presets: { label: string; kind: 'lv' | 'ls' | 'all' }[] = [
    { label: 'Lun – Vie', kind: 'lv' },
    { label: 'Lun – Sáb', kind: 'ls' },
    { label: 'Todos los días', kind: 'all' },
  ]

  return (
    <>
      <div>
        <h1 className="lw-h2">Vuestros horarios</h1>
        <p className="lw-body" style={{ marginTop: 4, fontSize: 14, color: 'var(--lw-text-2)' }}>
          Plantilla rápida y ajusta horas. <strong>Pulsa el reloj</strong> para editar; el interruptor abre o cierra el día.
        </p>
      </div>

      <div>
        <div className="lw-small" style={{ marginBottom: 6, color: 'var(--lw-text-3)', fontWeight: 500 }}>
          Plantillas
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {presets.map((p) => (
            <Btn
              key={p.label}
              type="button"
              size="sm"
              kind="outline"
              disabled={busy}
              onClick={() => onScheduleChange(applyScheduleTemplate(schedule, p.kind))}
            >
              {p.label}
            </Btn>
          ))}
        </div>
      </div>

      <Field error={errors?.schedule} hint="Horas en una fila; el interruptor marca si abre ese día.">
        <Card padding={0}>
          <div className="lw-schedule-table-header">
            <span className="lw-small" style={{ fontWeight: 600, color: 'var(--lw-text-3)', fontSize: 11 }}>
              Día
            </span>
            <span className="lw-small" style={{ fontWeight: 600, color: 'var(--lw-text-3)', fontSize: 11 }}>
              Apertura · cierre
            </span>
            <span
              className="lw-small"
              style={{ fontWeight: 600, color: 'var(--lw-text-3)', fontSize: 11, textAlign: 'right', whiteSpace: 'nowrap' }}
              title="Abre ese día"
            >
              Abierto
            </span>
          </div>
          {DAY_KEYS.map((key) => {
            const row = schedule[key]
            const label = DAY_LABEL_ES[key]
            const timeInputStyle = {
              width: 142,
              minWidth: 142,
              height: 34,
              minHeight: 34,
              cursor: 'pointer' as const,
            }
            return (
              <div key={key} className="lw-schedule-day-row">
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--lw-text)' }}>{label}</div>
                {row.closed ? (
                  <div className="lw-small" style={{ color: 'var(--lw-text-4)', fontSize: 12 }}>
                    Cerrado
                  </div>
                ) : (
                  <div className="lw-schedule-times-row">
                    <Input
                      type="time"
                      value={row.open}
                      disabled={busy}
                      fullWidth={false}
                      prefix={<Icon name="clock" size={14} />}
                      aria-label={`${label}: apertura`}
                      title="Hora de apertura"
                      onChange={(e) =>
                        onScheduleChange({ ...schedule, [key]: { ...schedule[key], open: e.target.value } })
                      }
                      className="lw-schedule-time-field"
                      style={timeInputStyle}
                    />
                    <span className="lw-schedule-times-sep" aria-hidden>
                      –
                    </span>
                    <Input
                      type="time"
                      value={row.close}
                      disabled={busy}
                      fullWidth={false}
                      prefix={<Icon name="clock" size={14} />}
                      aria-label={`${label}: cierre`}
                      title="Hora de cierre"
                      onChange={(e) =>
                        onScheduleChange({ ...schedule, [key]: { ...schedule[key], close: e.target.value } })
                      }
                      className="lw-schedule-time-field"
                      style={timeInputStyle}
                    />
                  </div>
                )}
                <div
                  style={{ display: 'flex', justifyContent: 'flex-end' }}
                  title={row.closed ? 'Abrir este día' : 'Cerrar este día'}
                >
                  <Switch
                    checked={!row.closed}
                    size="sm"
                    disabled={busy}
                    onChange={(open) =>
                      onScheduleChange({ ...schedule, [key]: { ...schedule[key], closed: !open } })
                    }
                  />
                </div>
              </div>
            )
          })}
        </Card>
      </Field>
      {errors?.message ? (
        <div className="lw-small" style={{ color: 'var(--lw-danger)' }}>
          {errors.message}
        </div>
      ) : null}
    </>
  )
}
function HorariosPreview({
  variant = 'urban-bold',
  previewData,
}: {
  variant?: Step1PreviewVariant
  previewData?: TemplatePreviewData
}) {
  return (
    <PreviewBrowser url={previewDemoHostForVariant(variant)}>
      <TemplateIframe variant={variant} mode="full" embed previewData={previewData} initialHash="#horario" />
    </PreviewBrowser>
  )
}

// ─── Step 6 · Ubicación ──────────────────────────────────────
//
// IMPORTANTE: este paso es 100% controlado.
// La fuente de verdad de `address`, `phone` y `email` está en el padre
// (`OnboardingPage`: `previewAddress`, `previewPhone`, `previewEmail`).
//
// Antes manteníamos estado local + sincronización bidireccional con las props
// `initial*`. Esa duplicidad genera un feedback loop (parent->child->parent)
// y al pulsar dos teclas seguidas cae en `Maximum update depth exceeded`.
function Step6Ubicacion({
  errors,
  isLoading: busy,
  onPhoneChange,
  onAddressChange,
  onLocationChange,
  onEmailChange,
  onMapCoordsChange,
  initialPhone = '',
  initialAddress = '',
  initialLocation,
  initialEmail = '',
  mapLat,
  mapLng,
}: WizardStepProps & {
  onPhoneChange?: (phone?: string) => void
  onAddressChange?: (address?: string) => void
  onLocationChange?: (location: LocationValue) => void
  onEmailChange?: (email?: string) => void
  /** null borra coordenadas en la vista previa del mapa */
  onMapCoordsChange?: (lat: number | null, lng: number | null) => void
  initialPhone?: string
  initialAddress?: string
  initialLocation?: LocationValue
  initialEmail?: string
  mapLat?: number
  mapLng?: number
}) {
  const nav = useContext(WizardNavContext)
  // El nombre `initialAddress`/`initialPhone`/`initialEmail` se mantiene por compatibilidad,
  // pero aquí los tratamos como las props controladas (`address`, `phone`, `email`).
  const address = initialAddress
  const location = initialLocation ?? { countryCode: 'ES', country: 'España', city: '' }
  const phone = initialPhone
  const email = initialEmail
  const [geocodedLabel, setGeocodedLabel] = useState('')
  const [geoBusy, setGeoBusy] = useState(false)
  const [geoMessage, setGeoMessage] = useState<string | null>(null)

  // Mantenemos refs siempre con el último valor para que el handler de "Continuar"
  // (que se registra una sola vez con [nav]) lea siempre los valores frescos.
  const addressRef = useRef(address)
  const locationRef = useRef(location)
  const phoneRef = useRef(phone)
  const emailRef = useRef(email)
  useEffect(() => {
    addressRef.current = address
  }, [address])
  useEffect(() => {
    locationRef.current = location
  }, [location])
  useEffect(() => {
    phoneRef.current = phone
  }, [phone])
  useEffect(() => {
    emailRef.current = email
  }, [email])

  useLayoutEffect(() => {
    nav?.registerContinueHandler?.(() => ({
      address: addressRef.current.trim(),
      city: locationRef.current.city.trim(),
      country: locationRef.current.country.trim(),
      country_code: locationRef.current.countryCode.trim().toUpperCase(),
      phone: phoneRef.current.trim(),
      email: emailRef.current.trim(),
    }))
    return () => nav?.registerContinueHandler?.(null)
  }, [nav])

  useEffect(() => {
    if (Number.isFinite(mapLat) && Number.isFinite(mapLng) && address.trim()) {
      setGeocodedLabel((prev) => (prev === address.trim() ? prev : address.trim()))
    }
    // Solo nos interesa volver a marcar `geocodedLabel` si el padre nos pasa
    // coords nuevas con una dirección concreta. No dependemos de `address` aquí
    // para no resetearlo cada tecla.
  }, [mapLat, mapLng, address])

  useEffect(() => {
    if (!geocodedLabel) return
    if (address.trim() !== geocodedLabel) {
      setGeocodedLabel('')
      onMapCoordsChange?.(null, null)
    }
  }, [address, geocodedLabel, onMapCoordsChange])

  const handleAddressInput = useCallback(
    (next: string) => {
      onAddressChange?.(next ? next : undefined)
    },
    [onAddressChange],
  )

  const handlePhoneInput = useCallback(
    (next: string) => {
      onPhoneChange?.(next ? next : undefined)
    },
    [onPhoneChange],
  )

  const handleEmailInput = useCallback(
    (next: string) => {
      onEmailChange?.(next ? next : undefined)
    },
    [onEmailChange],
  )

  const runAddressSearch = useCallback(async () => {
    const q = addressRef.current.trim()
    if (!q) {
      setGeoMessage('Escribe una dirección o lugar.')
      return
    }
    setGeoBusy(true)
    setGeoMessage(null)
    try {
      const hit = await geocodeAddress(q)
      if (!hit) {
        setGeoMessage('No encontramos esa dirección. Prueba con más detalle (calle, ciudad).')
        setGeocodedLabel('')
        onMapCoordsChange?.(null, null)
        return
      }
      setGeocodedLabel(q)
      onMapCoordsChange?.(hit.lat, hit.lng)
      setGeoMessage(`Ubicación encontrada: ${hit.displayName.split(',').slice(0, 2).join(',')}`)
    } catch {
      setGeoMessage('No pudimos consultar el mapa. Comprueba tu conexión e inténtalo de nuevo.')
      onMapCoordsChange?.(null, null)
    } finally {
      setGeoBusy(false)
    }
  }, [onMapCoordsChange])

  return (
    <>
      <div>
        <h1 className="lw-h2">Dónde os encuentran</h1>
        <p className="lw-body" style={{ marginTop: 6 }}>
          Tu dirección aparece con un mapa para que llegar sea fácil.
        </p>
      </div>
      <Field
        label="Dirección"
        error={errors?.address}
        hint="Escribe tu dirección y pulsa «Buscar» para situarla en el mapa. Puedes cambiarla cuando quieras."
      >
        <div className="lw-wizard-address-row" style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
          <Input
            value={address}
            disabled={busy}
            onChange={(e) => handleAddressInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                void runAddressSearch()
              }
            }}
            prefix={<Icon name="search" size={14} />}
            style={{ flex: 1 }}
            placeholder="Calle, número, ciudad"
          />
          <Btn
            type="button"
            kind="outline"
            size="sm"
            className="lw-wizard-address-search-btn"
            disabled={busy || geoBusy}
            loading={geoBusy}
            onClick={() => void runAddressSearch()}
            style={{ marginTop: 3, flexShrink: 0 }}
          >
            Buscar
          </Btn>
        </div>
      </Field>
      {geoMessage ? (
        <div className="lw-small" style={{ color: geoMessage.startsWith('Ubicación') ? 'var(--lw-success)' : 'var(--lw-text-3)' }}>
          {geoMessage}
        </div>
      ) : null}
      <LocationPicker
        value={location}
        onChange={(next) => onLocationChange?.(next)}
        disabled={busy}
        cityError={errors?.city}
        countryError={errors?.country}
      />
      <Card padding={14} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 999,
            background: 'var(--lw-success-soft)',
            color: 'var(--lw-success)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name="check" size={16} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 500 }}>Vista previa de ubicación</div>
          <div className="lw-small">El mismo mapa aparece en la plantilla al buscar.</div>
        </div>
        <MiniMap
          h={70}
          style={{ width: 120 }}
          address={geocodedLabel ? address.trim() : undefined}
          lat={mapLat}
          lng={mapLng}
        />
      </Card>
      <div className="lw-wizard-two-col">
        <Field label="Teléfono" error={errors?.phone}>
          <Input
            value={phone}
            disabled={busy}
            onChange={(e) => handlePhoneInput(e.target.value)}
            prefix={<Icon name="phone" size={14} />}
            placeholder="+34 …"
          />
        </Field>
        <Field label="Email" error={errors?.email}>
          <Input
            value={email}
            disabled={busy}
            onChange={(e) => handleEmailInput(e.target.value)}
            prefix={<Icon name="mail" size={14} />}
            placeholder="hola@…"
          />
        </Field>
      </div>
      {errors?.message ? (
        <div className="lw-small" style={{ color: 'var(--lw-danger)' }}>
          {errors.message}
        </div>
      ) : null}
    </>
  )
}
function UbicacionPreview({
  variant,
  previewData,
}: {
  variant: Step1PreviewVariant
  previewData?: TemplatePreviewData
}) {
  return (
    <TemplateIframe variant={variant} mode="full" embed previewData={previewData} initialHash="#contacto" />
  )
}

function PlanPreview({
  variant = 'urban-bold',
  previewData,
}: {
  variant?: Step1PreviewVariant
  previewData?: TemplatePreviewData
}) {
  const previewUrl = previewDemoHostForVariant(variant)

  return (
    <PreviewBrowser url={previewUrl}>
      <TemplateIframe variant={variant} mode="full" embed previewData={previewData} initialHash="" />
    </PreviewBrowser>
  )
}

// ─── Step 8 · Publicar ───────────────────────────────────────
function Step8Publicar({ errors, reservedSubdomain }: WizardStepProps & { reservedSubdomain?: string }) {
  const nav = useContext(WizardNavContext)

  useLayoutEffect(() => {
    nav?.registerContinueHandler?.(() => undefined)
    return () => nav?.registerContinueHandler?.(null)
  }, [nav])

  const hostSlug = reservedSubdomain?.trim() || ''
  const displayUrl = hostSlug ? `${hostSlug}.${getPublicPageHost()}` : null

  const checklist: { t: string; ok: boolean; hint?: string }[] = [
    { t: 'Plantilla elegida', ok: true },
    { t: 'Foto de portada subida', ok: true },
    { t: 'Sobre nosotros completo', ok: true },
    { t: 'Galería', ok: true },
    { t: 'Horarios configurados', ok: true },
    { t: 'Dirección y contacto', ok: true },
    { t: 'Plan elegido', ok: true },
    { t: 'Publicación', ok: true },
  ]

  return (
    <>
      <div>
        <h1 className="lw-h2">¡Tu página está lista!</h1>
        <p className="lw-body" style={{ marginTop: 6 }}>
          Echa un vistazo a la vista previa y, cuando estés, entra al dashboard.
        </p>
      </div>

      <Card padding={18} style={{ background: 'var(--lw-accent-soft)', borderColor: 'transparent' }}>
        <div className="lw-small" style={{ color: 'var(--lw-accent-hover)', marginBottom: 6, letterSpacing: '.05em' }}>
          TU URL
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span className="lw-mono" style={{ fontSize: 14, color: 'var(--lw-text)', wordBreak: 'break-all' }}>
            {displayUrl ?? '(se asignará al publicar)'}
          </span>
          <Badge tone="ghost" size="sm">
            Subdominio
          </Badge>
        </div>
      </Card>

      <Card padding={16} style={{ background: 'var(--lw-warning-soft)', borderColor: 'transparent' }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <Icon name="info" size={18} />
          <div>
            <div style={{ fontWeight: 600, fontSize: 14 }}>¿Quieres cambiar algo?</div>
            <div className="lw-small" style={{ marginTop: 4, color: 'var(--lw-text-2)' }}>
              Desde tu dashboard podrás editar fotos, textos, horarios, ubicación y todo lo demás cuando quieras.
            </div>
          </div>
        </div>
      </Card>

      <Card padding={0}>
        {checklist.map((c, i) => (
          <div
            key={c.t}
            style={{
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              borderBottom: i < checklist.length - 1 ? `1px solid ${BORDER}` : 'none',
            }}
          >
            <span
              style={{
                width: 22,
                height: 22,
                borderRadius: 999,
                background: c.ok ? 'var(--lw-success-soft)' : 'var(--lw-warning-soft)',
                color: c.ok ? 'var(--lw-success)' : 'var(--lw-warning)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Icon name={c.ok ? 'check' : 'alert'} size={12} />
            </span>
            <span style={{ flex: 1, fontSize: 13.5, fontWeight: 500 }}>{c.t}</span>
            {c.hint ? <span className="lw-small" style={{ color: 'var(--lw-warning)' }}>{c.hint}</span> : null}
          </div>
        ))}
      </Card>
      {errors?.message ? (
        <div className="lw-small" style={{ color: 'var(--lw-danger)' }}>
          {errors.message}
        </div>
      ) : null}
    </>
  )
}
function PublicarPreview() {
  return (
    <PreviewBrowser url="estudio-marta.localweb.es">
      <div style={{ position: "relative", height: 220 }}>
        <Placeholder ratio="16:9" h={220} dark style={{ borderRadius: 0 }} label="portada"/>
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, transparent 35%, rgba(0,0,0,.6))" }}/>
        <div style={{ position: "absolute", left: 18, bottom: 16, color: "#fff" }}>
          <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: "-0.02em" }}>Estudio Marta</div>
          <div style={{ fontSize: 12, opacity: .9, marginTop: 2 }}>Cortes con criterio en Lavapiés</div>
        </div>
      </div>
      <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
        <Badge tone="success" dot>Abierto ahora · cierra a las 20:00</Badge>
        <div className="lw-shimmer" style={{ height: 8, borderRadius: 4, width: "70%" }}/>
        <div className="lw-shimmer" style={{ height: 8, borderRadius: 4, width: "85%" }}/>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginTop: 6 }}>
          <Placeholder ratio="1:1"/><Placeholder ratio="1:1"/><Placeholder ratio="1:1"/>
        </div>
      </div>
    </PreviewBrowser>
  );
}

export {
  Step1Logo,
  Step1Plantilla,
  Step2Portada,
  Step3Sobre,
  Step4Galeria,
  Step5Horarios,
  Step6Ubicacion,
  Step7Plan,
  Step8Publicar,
  PreviewBrowser,
  TplPreview,
  PortadaPreview,
  SobrePreview,
  GaleriaPreview,
  ServiciosPreview,
  HorariosPreview,
  UbicacionPreview,
  PlanPreview,
  PublicarPreview,
  evaluateGalleryImageQuality,
  resolveStep1PreviewVariant,
  type GalleryImageQuality,
  type TemplatePreviewData,
}
