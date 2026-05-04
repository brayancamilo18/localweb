import {
  useContext,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import type { Schedule, Template } from '../../types/api'
import { geocodeAddress } from '../../lib/geocodeAddress'
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
import { buildPublicVcardUrl, resolvePublicApiBaseUrl } from '../public-page/publicTemplatePayload'
import { WizardNavContext, type WizardStepProps } from './wizardNavContext'

// LocalWeb — Onboarding wizard (8 pasos)
// Each step is a self-contained component returning a desktop split (form + preview).
// Mobile variants exposed separately.

export type { WizardNavValue } from './wizardNavContext'
export { WizardNavContext } from './wizardNavContext'
export type { WizardStepProps } from './wizardNavContext'

const ACCENT = "var(--lw-accent)";
const BORDER = "var(--lw-border)";

type Step1PreviewVariant = 'noir-elite' | 'bloom-studio'
type TemplatePreviewData = {
  businessName?: string
  tagline?: string
  phone?: string
  coverUrl?: string
  /** Texto “Sobre nosotros” / descripción del negocio */
  description?: string
  /** Imagen sección equipo (data URL) */
  aboutPhotoUrl?: string
  /** Dirección (paso ubicación) para pie de página en preview */
  address?: string
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
}

function resolveStep1PreviewVariant(template: Pick<Template, 'slug' | 'name'>, index = 0): Step1PreviewVariant {
  const slug = template.slug.toLowerCase()
  const name = template.name.toLowerCase()
  if (slug.includes('noir') || name.includes('noir') || slug.includes('soft')) {
    return 'noir-elite'
  }
  if (slug.includes('bloom') || name.includes('bloom') || slug.includes('aurora')) {
    return 'bloom-studio'
  }
  return index % 2 === 0 ? 'noir-elite' : 'bloom-studio'
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

  const src = useMemo(() => {
    const params = new URLSearchParams()
    if (embed) params.set('embed', '1')
    if (previewData) params.set('preview', '1')
    const qs = params.size > 0 ? `?${params.toString()}` : ''
    const hash = initialHash
      ? initialHash.startsWith('#')
        ? initialHash
        : `#${initialHash}`
      : ''
    return `${templatePath}${qs}${hash}`
  }, [templatePath, embed, variant, previewData, initialHash])

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
      frame.contentWindow.postMessage(
        {
          type: 'lw:onboarding-preview',
          /** Solo en la carga del iframe: centrar la sección del paso (p. ej. #horario). */
          alignToHash: options?.alignToHash === true,
          payload: {
            nombre: previewData.businessName ?? '',
            tagline: previewData.tagline ?? '',
            telefono: previewData.phone ?? '',
            portada: previewData.coverUrl ?? '',
            descripcion: previewData.description ?? '',
            foto_equipo: previewData.aboutPhotoUrl ?? '',
            direccion: previewData.address ?? '',
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
          },
        },
        '*',
      )
    },
    [previewData],
  )

  useEffect(() => {
    syncPreview({ alignToHash: false })
  }, [syncPreview])

  if (mode === 'thumb') {
    return (
      <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
        <iframe
          ref={iframeRef}
          title={`Plantilla ${variant} portada`}
          src={src}
          onLoad={() => syncPreview({ alignToHash: true })}
          sandbox="allow-scripts allow-popups allow-forms"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: 1280,
            height: 760,
            border: 'none',
            transform: 'scale(0.245)',
            transformOrigin: 'top left',
            pointerEvents: 'none',
            background: '#fff',
          }}
        />
      </div>
    )
  }

  return (
    <iframe
      ref={iframeRef}
      title={`Vista previa completa ${variant}`}
      src={src}
      onLoad={() => syncPreview({ alignToHash: true })}
      sandbox="allow-scripts allow-popups allow-forms"
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
    <div style={{
      borderBottom: `1px solid ${BORDER}`, background: "var(--lw-bg-elev)",
      padding: "clamp(12px, 2vw, 16px) clamp(16px, 4vw, 32px)",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <Logo size={20}/>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <span style={{ fontSize: 12, color: "var(--lw-text-3)", fontWeight: 500 }}>
            {isExtras ? (
              <>Paso extra · <span style={{ color: "var(--lw-text)" }}>Configura tu Pro</span></>
            ) : (
              <>Paso <span style={{ color: "var(--lw-text)", fontVariantNumeric: "tabular-nums" }}>{step}</span> de 8</>
            )}
          </span>
          <Btn kind="ghost" size="sm">Guardar y salir</Btn>
        </div>
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
          const clickable = typeof jump === "function";
          return (
            <span
              key={s}
              role={clickable ? "button" : undefined}
              tabIndex={clickable ? 0 : undefined}
              title={clickable ? `Ir al paso ${n}: ${s}` : undefined}
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
              cursor: clickable ? "pointer" : "default",
              userSelect: "none",
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
export function WizardLayout({
  step,
  children,
  preview,
  footer,
}: {
  step: number
  children: ReactNode
  preview: ReactNode
  footer?: ReactNode
}) {
  const nav = useContext(WizardNavContext);
  const [device, setDevice] = useState("desktop");

  const staticFooter = (
    <>
      <Btn kind="ghost" icon="chevronLeft" size="md">Atrás</Btn>
      <Btn kind="primary" iconRight="arrowRight" size="md">Continuar</Btn>
    </>
  );

  const resolvedFooter = footer !== undefined && footer !== null ? footer : (nav?.footer ?? staticFooter);

  return (
    <div className="lw-wizard-layout">
      <WizardHeader step={step}/>
      <div className="lw-wizard-split">
        {/* form */}
        <div className="lw-wizard-form lw-scroll">{children}</div>
        {/* preview */}
        <div className="lw-wizard-preview">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span className="lw-small" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <Icon name="eye" size={13}/> Vista previa en tiempo real
            </span>
            <Segmented size="sm" value={device} onChange={setDevice} options={[
              { value: "desktop", label: <Icon name="monitor" size={13}/> },
              { value: "mobile",  label: <Icon name="smartphone" size={13}/> },
            ]}/>
          </div>
          <div style={{
            flex: 1, minHeight: 0,
            display: "flex",
            justifyContent: device === "mobile" ? "center" : "stretch",
            alignItems: "flex-start",
            overflow: "hidden",
          }}>
            <div style={{
              width: device === "mobile" ? 320 : "100%",
              maxWidth: "100%",
              height: "100%",
              minHeight: 0,
            }}>{preview}</div>
          </div>
        </div>
      </div>
      {/* footer */}
      <div className="lw-wizard-footer">
        {resolvedFooter}
      </div>
    </div>
  );
}

const FALLBACK_TEMPLATES: Template[] = [
  { id: 1, name: 'Noir Elite', slug: 'noir-elite', primary_color: '#C9A84C', requires_pro: false },
  { id: 2, name: 'Bloom Studio', slug: 'bloom-studio', primary_color: '#E8572A', requires_pro: false },
]

// ─── Step 1 · Plantilla ──────────────────────────────────────
function Step1Plantilla({
  errors,
  isLoading: busy,
  templates = [],
  onTemplatePreviewChange,
}: WizardStepProps & { templates?: Template[]; onTemplatePreviewChange?: (variant: Step1PreviewVariant) => void }) {
  const nav = useContext(WizardNavContext)
  const list = useMemo(
    () => (templates.length > 0 ? templates : FALLBACK_TEMPLATES).slice(0, 2),
    [templates],
  )
  const [selectedId, setSelectedId] = useState<number | null>(list[0]?.id ?? null)
  const [sector, setSector] = useState('peluqueria')
  const [fullscreen, setFullscreen] = useState<{ variant: Step1PreviewVariant; label: string } | null>(null)

  // Keep selection in sync when API data replaces cache/fallback (IDs in DB may not match stale template_id).
  useEffect(() => {
    if (list.length === 0) return
    setSelectedId((prev) =>
      prev != null && list.some((t) => t.id === prev) ? prev : list[0]!.id,
    )
  }, [list])

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
      sector: sector.trim() || 'otros',
    }))
    return () => nav?.registerContinueHandler?.(null)
  }, [nav, selectedId, sector, list])

  useEffect(() => {
    const selected = list.find((t) => t.id === selectedId) ?? list[0]
    if (!selected) return
    const idx = Math.max(0, list.findIndex((t) => t.id === selected.id))
    onTemplatePreviewChange?.(resolveStep1PreviewVariant(selected, idx))
  }, [list, selectedId, onTemplatePreviewChange])

  return (
    <>
      <div>
        <h1 className="lw-h2">Elige tu plantilla</h1>
        <p className="lw-body" style={{ marginTop: 6, maxWidth: 540 }}>
          Empieza con un diseño hecho para tu sector. Podrás cambiarlo en cualquier momento, sin perder lo que ya hayas escrito.
        </p>
      </div>
      <Field label="Sector" hint="Ej. peluquería, taller, bienestar…" error={errors?.sector}>
        <Input
          value={sector}
          disabled={busy}
          onChange={(e) => setSector(e.target.value)}
          placeholder="peluqueria"
        />
      </Field>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 220px), 1fr))',
          gap: 16,
        }}
      >
        {list.map((t, idx) => {
          const isSel = t.id === selectedId
          const variant = resolveStep1PreviewVariant(t, idx)
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
              <div style={{ position: 'relative', height: 170, borderBottom: `1px solid ${BORDER}` }}>
                <TemplateIframe variant={variant} mode="thumb" />
                <div style={{ position: 'absolute', top: 8, left: 8 }}>
                  <Badge
                    tone={t.requires_pro ? 'pro' : 'success'}
                    size="sm"
                    style={
                      t.requires_pro
                        ? undefined
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
                <TemplateIframe variant={fullscreen.variant} mode="full" embed={false} />
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

function TplPreview({ variant = 'noir-elite' }: { variant?: Step1PreviewVariant }) {
  return (
    <PreviewBrowser url={variant === 'noir-elite' ? 'casa-lumen.localweb.es' : 'salon-margarita.localweb.es'}>
      <TemplateIframe variant={variant} mode="full" embed />
    </PreviewBrowser>
  )
}

// ─── Step 2 · Portada ────────────────────────────────────────
function Step2Portada({
  errors,
  isLoading: busy,
  currentCoverFile,
  onCoverChange,
  onBusinessMetaChange,
  initialBusinessName = '',
  initialTagline = '',
}: WizardStepProps & {
  currentCoverFile?: File | null
  onCoverChange?: (file: File | null) => void
  onBusinessMetaChange?: (payload: { businessName?: string; tagline?: string }) => void
  initialBusinessName?: string
  initialTagline?: string
}) {
  const nav = useContext(WizardNavContext)
  const fileRef = useRef<HTMLInputElement>(null)
  const file = currentCoverFile ?? null
  const [businessName, setBusinessName] = useState(initialBusinessName)
  const [tagline, setTagline] = useState(initialTagline)
  const [coverThumbUrl, setCoverThumbUrl] = useState<string | null>(null)
  const [coverMeta, setCoverMeta] = useState<{
    width: number
    height: number
    ratio: number
    ratioOk: boolean
    minSizeOk: boolean
  } | null>(null)

  useLayoutEffect(() => {
    nav?.registerContinueHandler?.(() => file as File)
    return () => nav?.registerContinueHandler?.(null)
  }, [nav, file])

  useEffect(() => {
    onCoverChange?.(file)
  }, [file, onCoverChange])

  useEffect(() => {
    onBusinessMetaChange?.({
      businessName: businessName.trim() || undefined,
      tagline: tagline.trim() || undefined,
    })
  }, [businessName, tagline, onBusinessMetaChange])

  useEffect(() => {
    if (!file) {
      setCoverMeta(null)
      setCoverThumbUrl(null)
      return
    }

    const objectUrl = URL.createObjectURL(file)
    setCoverThumbUrl(objectUrl)
    const img = new Image()
    img.onload = () => {
      const width = img.naturalWidth
      const height = img.naturalHeight
      const ratio = width / height
      const targetRatio = 16 / 9
      const ratioOk = Math.abs(ratio - targetRatio) <= 0.03
      const minSizeOk = width >= 1200 && height >= 675

      setCoverMeta({ width, height, ratio, ratioOk, minSizeOk })
    }
    img.onerror = () => {
      setCoverMeta(null)
    }
    img.src = objectUrl

    return () => {
      URL.revokeObjectURL(objectUrl)
    }
  }, [file])

  const isCoverSuitable = coverMeta ? coverMeta.ratioOk && coverMeta.minSizeOk : null

  return (
    <>
      <div>
        <h1 className="lw-h2">Tu portada</h1>
        <p className="lw-body" style={{ marginTop: 6 }}>
          Sube la foto principal de tu negocio. JPG o PNG, hasta 8 MB.
        </p>
      </div>
      <Field label="Nombre del negocio">
        <Input
          value={businessName}
          disabled={busy}
          onChange={(e) => setBusinessName(e.target.value)}
          placeholder="Estudio Marta"
        />
      </Field>
      <Field label="Tagline" hint="Se verá justo debajo del nombre en portada.">
        <Input
          value={tagline}
          disabled={busy}
          onChange={(e) => setTagline(e.target.value)}
          placeholder="Cortes con criterio en el corazón de Lavapiés"
        />
      </Field>
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        style={{ display: 'none' }}
        onChange={(e) => onCoverChange?.(e.target.files?.[0] ?? null)}
      />
      <Field label="Foto de portada" error={errors?.cover}>
        <div
          role="button"
          tabIndex={0}
          onClick={() => !busy && fileRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              fileRef.current?.click()
            }
          }}
          style={{
            border: `1.5px dashed var(--lw-border-2)`,
            borderRadius: 'var(--lw-r)',
            padding: 28,
            background: 'var(--lw-bg-elev)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 10,
            textAlign: 'center',
            cursor: busy ? 'not-allowed' : 'pointer',
            opacity: busy ? 0.6 : 1,
          }}
        >
          {coverThumbUrl ? (
            <div
              style={{
                width: '100%',
                borderRadius: 'var(--lw-r-sm)',
                overflow: 'hidden',
                border: `1px solid ${BORDER}`,
                background: '#0b1220',
              }}
            >
              <img
                src={coverThumbUrl}
                alt="Vista previa de portada seleccionada"
                style={{
                  width: '100%',
                  height: 170,
                  objectFit: 'cover',
                  display: 'block',
                }}
              />
            </div>
          ) : null}
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 999,
              background: 'var(--lw-accent-soft)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--lw-accent)',
            }}
          >
            <Icon name="upload" size={18} />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 500 }}>
              Pulsa para elegir archivo
              <span style={{ color: ACCENT, textDecoration: 'underline' }}> · portada 16:9</span>
            </div>
            <div className="lw-small" style={{ marginTop: 4 }}>
              {file ? file.name : 'Ningún archivo seleccionado'}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
            {coverMeta ? (
              <>
                <Badge tone="neutral" size="sm">
                  {coverMeta.width} × {coverMeta.height}
                </Badge>
                <Badge tone="neutral" size="sm">
                  {coverMeta.ratio.toFixed(2)}:1
                </Badge>
                <Badge tone={isCoverSuitable ? 'success' : 'pro'} size="sm">
                  {isCoverSuitable ? 'Apta para portada' : 'No apta (usa 16:9)'}
                </Badge>
              </>
            ) : (
              <>
                <Badge tone="neutral" size="sm">
                  Recomendado: 1920 × 1080
                </Badge>
                <Badge tone="neutral" size="sm">
                  Formato: 16:9
                </Badge>
              </>
            )}
          </div>
          {coverMeta ? (
            <div className="lw-small" style={{ color: isCoverSuitable ? 'var(--lw-success)' : 'var(--lw-danger)' }}>
              {isCoverSuitable
                ? 'La imagen encaja bien para portada.'
                : 'La imagen no cumple 16:9 o es muy pequeña (mínimo 1200×675).'}
            </div>
          ) : null}
          {file ? (
            <Btn
              kind="ghost"
              size="sm"
              icon="trash"
              type="button"
              disabled={busy}
              style={{ color: 'var(--lw-danger)' }}
              onClick={(e) => {
                e.stopPropagation()
                onCoverChange?.(null)
              }}
            >
              Quitar foto
            </Btn>
          ) : null}
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
function PortadaPreview({
  variant = 'noir-elite',
  previewData,
}: {
  variant?: Step1PreviewVariant
  previewData?: TemplatePreviewData
}) {
  return (
    <PreviewBrowser url={variant === 'noir-elite' ? 'casa-lumen.localweb.es' : 'salon-margarita.localweb.es'}>
      <TemplateIframe variant={variant} mode="full" embed previewData={previewData} />
    </PreviewBrowser>
  )
}

function SobrePreview({
  variant = 'noir-elite',
  previewData,
}: {
  variant?: Step1PreviewVariant
  previewData?: TemplatePreviewData
}) {
  return (
    <PreviewBrowser url={variant === 'noir-elite' ? 'casa-lumen.localweb.es' : 'salon-margarita.localweb.es'}>
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

// ─── Step 4 · Galería (con upsell Free → Pro) ────────────────
function Step4Galeria({
  pro = false,
  postCheckoutProBanner,
  errors,
  isLoading: busy,
  photos,
  onPhotosChange,
  onGalleryPreviewUrlsChange,
}: WizardStepProps & {
  pro?: boolean
  /** Tras volver de Stripe Pro: mensaje de celebración y límite ampliado. */
  postCheckoutProBanner?: boolean
  /** Estado elevado: se mantiene al ir al siguiente paso y volver atrás. */
  photos: File[]
  onPhotosChange: (files: File[]) => void
  onGalleryPreviewUrlsChange?: (urls: string[]) => void
}) {
  const nav = useContext(WizardNavContext)
  const galleryRef = useRef<HTMLInputElement>(null)
  const slots = pro ? 20 : 3
  const [thumbUrls, setThumbUrls] = useState<string[]>([])
  const [qualities, setQualities] = useState<GalleryImageQuality[]>([])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const urls = await filesToDataUrls(photos)
      if (!cancelled) {
        setThumbUrls(urls)
        onGalleryPreviewUrlsChange?.(urls)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [photos, onGalleryPreviewUrlsChange])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const scores = await Promise.all(photos.map((f) => evaluateGalleryImageQuality(f)))
      if (!cancelled) setQualities(scores.map((s) => s.quality))
    })()
    return () => {
      cancelled = true
    }
  }, [photos])

  useLayoutEffect(() => {
    nav?.registerContinueHandler?.(() => photos)
    return () => nav?.registerContinueHandler?.(null)
  }, [nav, photos])

  const removeAt = (idx: number) => onPhotosChange(photos.filter((_, i) => i !== idx))

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
          <span style={{ color: 'var(--lw-text)', fontWeight: 600 }}>{photos.length}</span>
          <span> de {slots} fotos</span>
        </div>
      </div>

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
          <Btn size="sm" kind="dark" iconRight="arrowRight" type="button">
            Mejorar a Pro
          </Btn>
        </div>
      )}

      <input
        ref={galleryRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        style={{ display: 'none' }}
        onChange={(e) => {
          const next = [...photos, ...(Array.from(e.target.files ?? []) as File[])].slice(0, slots)
          onPhotosChange(next)
          e.target.value = ''
        }}
      />

      <Field error={errors?.photos}>
        <Btn kind="outline" type="button" disabled={busy || photos.length >= slots} onClick={() => galleryRef.current?.click()}>
          Añadir fotos
        </Btn>
      </Field>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
        {photos.map((file, i) => (
          <div key={`gal-${i}-${file.lastModified}-${file.name}`} style={{ position: 'relative' }}>
            <div
              style={{
                aspectRatio: '1/1',
                borderRadius: 'var(--lw-r-sm)',
                overflow: 'hidden',
                border: `1px solid var(--lw-border)`,
                background: 'var(--lw-bg-elev)',
              }}
            >
              {thumbUrls[i] ? (
                <img src={thumbUrls[i]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
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
              onClick={() => removeAt(i)}
            >
              <Icon name="x" size={12} />
            </button>
          </div>
        ))}
        {Array.from({ length: Math.max(0, Math.min(slots, 9) - photos.length) }).map((_, i) => (
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
  variant = 'noir-elite',
  previewData,
}: {
  variant?: Step1PreviewVariant
  previewData?: TemplatePreviewData
}) {
  return (
    <PreviewBrowser url={variant === 'noir-elite' ? 'casa-lumen.localweb.es' : 'salon-margarita.localweb.es'}>
      <TemplateIframe variant={variant} mode="full" embed previewData={previewData} initialHash="#galeria" />
    </PreviewBrowser>
  )
}

function ServiciosPreview({
  variant = 'noir-elite',
  previewData,
}: {
  variant?: Step1PreviewVariant
  previewData?: TemplatePreviewData
}) {
  return (
    <PreviewBrowser url={variant === 'noir-elite' ? 'casa-lumen.localweb.es' : 'salon-margarita.localweb.es'}>
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
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '92px 1fr auto',
              alignItems: 'center',
              gap: 8,
              padding: '6px 12px',
              background: 'var(--lw-surface)',
              borderBottom: `1px solid ${BORDER}`,
            }}
          >
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
          {DAY_KEYS.map((key, i) => {
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
              <div
                key={key}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '92px 1fr auto',
                  alignItems: 'center',
                  gap: 8,
                  padding: '6px 12px',
                  borderBottom: i < DAY_KEYS.length - 1 ? `1px solid ${BORDER}` : 'none',
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--lw-text)' }}>{label}</div>
                {row.closed ? (
                  <div className="lw-small" style={{ color: 'var(--lw-text-4)', fontSize: 12 }}>
                    Cerrado
                  </div>
                ) : (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: 6,
                    }}
                  >
                    <Input
                      type="time"
                      value={row.open}
                      disabled={busy}
                      prefix={<Icon name="clock" size={14} />}
                      aria-label={`${label}: apertura`}
                      title="Hora de apertura"
                      onChange={(e) =>
                        onScheduleChange({ ...schedule, [key]: { ...schedule[key], open: e.target.value } })
                      }
                      style={timeInputStyle}
                    />
                    <span style={{ color: 'var(--lw-text-4)', fontSize: 13, userSelect: 'none' }} aria-hidden>
                      –
                    </span>
                    <Input
                      type="time"
                      value={row.close}
                      disabled={busy}
                      prefix={<Icon name="clock" size={14} />}
                      aria-label={`${label}: cierre`}
                      title="Hora de cierre"
                      onChange={(e) =>
                        onScheduleChange({ ...schedule, [key]: { ...schedule[key], close: e.target.value } })
                      }
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
  variant = 'noir-elite',
  previewData,
}: {
  variant?: Step1PreviewVariant
  previewData?: TemplatePreviewData
}) {
  return (
    <PreviewBrowser url={variant === 'noir-elite' ? 'casa-lumen.localweb.es' : 'salon-margarita.localweb.es'}>
      <TemplateIframe variant={variant} mode="full" embed previewData={previewData} initialHash="#horario" />
    </PreviewBrowser>
  )
}

// ─── Step 6 · Ubicación ──────────────────────────────────────
function Step6Ubicacion({
  errors,
  isLoading: busy,
  onPhoneChange,
  onAddressChange,
  onEmailChange,
  onMapCoordsChange,
  initialPhone = '',
  initialAddress = '',
  initialEmail = '',
  mapLat,
  mapLng,
}: WizardStepProps & {
  onPhoneChange?: (phone?: string) => void
  onAddressChange?: (address?: string) => void
  onEmailChange?: (email?: string) => void
  /** null borra coordenadas en la vista previa del mapa */
  onMapCoordsChange?: (lat: number | null, lng: number | null) => void
  initialPhone?: string
  initialAddress?: string
  initialEmail?: string
  mapLat?: number
  mapLng?: number
}) {
  const nav = useContext(WizardNavContext)
  const [address, setAddress] = useState(initialAddress)
  const [phone, setPhone] = useState(initialPhone)
  const [email, setEmail] = useState(initialEmail)
  const [geocodedLabel, setGeocodedLabel] = useState('')
  const [geoBusy, setGeoBusy] = useState(false)
  const [geoMessage, setGeoMessage] = useState<string | null>(null)

  useLayoutEffect(() => {
    nav?.registerContinueHandler?.(() => ({
      address: address.trim(),
      phone: phone.trim(),
      email: email.trim(),
    }))
    return () => nav?.registerContinueHandler?.(null)
  }, [nav, address, phone, email])

  useEffect(() => {
    onPhoneChange?.(phone.trim() || undefined)
  }, [phone, onPhoneChange])

  useEffect(() => {
    onAddressChange?.(address.trim() || undefined)
  }, [address, onAddressChange])

  useEffect(() => {
    onEmailChange?.(email.trim() || undefined)
  }, [email, onEmailChange])

  useEffect(() => {
    setAddress(initialAddress)
  }, [initialAddress])

  useEffect(() => {
    setPhone(initialPhone)
  }, [initialPhone])

  useEffect(() => {
    setEmail(initialEmail)
  }, [initialEmail])

  useEffect(() => {
    if (Number.isFinite(mapLat) && Number.isFinite(mapLng) && initialAddress.trim()) {
      setGeocodedLabel(initialAddress.trim())
    }
  }, [initialAddress, mapLat, mapLng])

  useEffect(() => {
    if (!geocodedLabel) return
    if (address.trim() !== geocodedLabel) {
      setGeocodedLabel('')
      onMapCoordsChange?.(null, null)
    }
  }, [address, geocodedLabel, onMapCoordsChange])

  const runAddressSearch = useCallback(async () => {
    const q = address.trim()
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
  }, [address, onMapCoordsChange])

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
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
          <Input
            value={address}
            disabled={busy}
            onChange={(e) => setAddress(e.target.value)}
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
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Field label="Teléfono" error={errors?.phone}>
          <Input
            value={phone}
            disabled={busy}
            onChange={(e) => setPhone(e.target.value)}
            prefix={<Icon name="phone" size={14} />}
            placeholder="+34 …"
          />
        </Field>
        <Field label="Email" error={errors?.email}>
          <Input
            value={email}
            disabled={busy}
            onChange={(e) => setEmail(e.target.value)}
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
  variant = 'noir-elite',
  previewData,
}: {
  variant?: Step1PreviewVariant
  previewData?: TemplatePreviewData
}) {
  const [fullscreen, setFullscreen] = useState(false)
  const previewUrl = variant === 'noir-elite' ? 'casa-lumen.localweb.es' : 'salon-margarita.localweb.es'

  useEffect(() => {
    if (!fullscreen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setFullscreen(false)
    }
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [fullscreen])

  return (
    <>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          minHeight: 0,
          gap: 8,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexShrink: 0 }}>
          <span className="lw-small" style={{ color: 'var(--lw-text-3)' }}>
            Vista completa con todo lo que has configurado
          </span>
          <Btn type="button" size="sm" kind="outline" icon="monitor" onClick={() => setFullscreen(true)}>
            Pantalla completa
          </Btn>
        </div>
        <div style={{ flex: 1, minHeight: 0 }}>
          <PreviewBrowser url={previewUrl}>
            <TemplateIframe variant={variant} mode="full" embed previewData={previewData} initialHash="" />
          </PreviewBrowser>
        </div>
      </div>
      {fullscreen
        ? createPortal(
            <div
              role="dialog"
              aria-modal="true"
              aria-label="Vista previa de tu web a pantalla completa"
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
              onClick={() => setFullscreen(false)}
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
                  <div style={{ fontSize: 15, fontWeight: 600, color: '#fff' }}>Tu web · revisión final</div>
                  <div className="lw-small" style={{ color: 'rgba(255,255,255,.75)', marginTop: 2 }}>
                    Desplázate por todas las secciones · Esc para cerrar
                  </div>
                </div>
                <Btn kind="ghost" size="md" type="button" icon="x" onClick={() => setFullscreen(false)} style={{ color: '#fff' }}>
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
                <PreviewBrowser url={previewUrl}>
                  <TemplateIframe variant={variant} mode="full" embed={false} previewData={previewData} initialHash="" />
                </PreviewBrowser>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  )
}

const DEFAULT_PUBLIC_PAGE_HOST = import.meta.env.VITE_PUBLIC_PAGE_HOST ?? 'localweb.es'

// ─── Step 8 · Publicar ───────────────────────────────────────
function Step8Publicar({ errors, reservedSubdomain }: WizardStepProps & { reservedSubdomain?: string }) {
  const nav = useContext(WizardNavContext)

  useLayoutEffect(() => {
    nav?.registerContinueHandler?.(() => undefined)
    return () => nav?.registerContinueHandler?.(null)
  }, [nav])

  const hostSlug = reservedSubdomain?.trim() || ''
  const displayUrl = hostSlug ? `${hostSlug}.${DEFAULT_PUBLIC_PAGE_HOST}` : null

  const checklist: { t: string; ok: boolean; hint?: string }[] = [
    { t: 'Plantilla elegida', ok: true },
    { t: 'Foto de portada subida', ok: true },
    { t: 'Sobre nosotros completo', ok: true },
    { t: 'Galería', ok: true },
    { t: 'Horarios configurados', ok: true },
    { t: 'Dirección y contacto', ok: true },
    { t: 'Plan elegido', ok: true },
    { t: 'Publicación', ok: true, hint: 'Pulsa Continuar para publicar' },
  ]

  return (
    <>
      <div>
        <h1 className="lw-h2">Listo para publicar</h1>
        <p className="lw-body" style={{ marginTop: 6 }}>
          Repasamos lo que has hecho. Al continuar, confirmas la publicación.
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
  type Step1PreviewVariant,
  type TemplatePreviewData,
}
