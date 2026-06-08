import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from 'react'
import { createPortal } from 'react-dom'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Badge, Btn, Card, Icon } from '../../../components/primitives/primitives'
import { useToast } from '../../../components/ui/Toast'
import {
  changeBusinessTemplate,
  getDashboardTemplates,
  previewTemplateChange,
  type ChangeBusinessTemplatePayload,
  type TemplateChangePreview,
} from '../../../api/dashboard'
import TemplateChangeConfirmModal, {
  type BrandColorChoice,
} from '../templates/TemplateChangeConfirmModal'
import { keys } from '../../../api/queryKeys'
import type { ApiError, Business, Template } from '../../../types/api'
import PublicHtmlTemplateFrame from '../../public-page/PublicHtmlTemplateFrame'
import { publicBusinessToTemplatePayload } from '../../public-page/publicTemplatePayload'
import { useDashboard } from '../context/DashboardContext'
import DisenoPagination from './DisenoPagination'
import DashboardSectionHeader from '../components/DashboardSectionHeader'
import {
  TEMPLATE_THUMB_DOC_H,
  TEMPLATE_THUMB_DOC_W,
  templateThumbAspectPadding,
  usePreferStaticThumb,
} from '../../shared/templateThumb'
import '../components/dashboardSectionHeader.css'

const PAGE_SIZE = 9

function formatAvailableAt(iso: string | null | undefined): string | null {
  if (!iso) return null
  try {
    return new Intl.DateTimeFormat('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date(iso))
  } catch {
    return null
  }
}

function getApiErrorMessage(err: unknown): string | undefined {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as ApiError | undefined
    return data?.message
  }
  return undefined
}

export function buildTemplateChangePayload(
  templateId: number,
  choice: BrandColorChoice,
): ChangeBusinessTemplatePayload {
  const payload: ChangeBusinessTemplatePayload = { template_id: templateId }
  if (choice !== 'omit') {
    payload.brand_color = choice
  }
  return payload
}

function businessWithTemplate(business: Business, template: Template): Business {
  return {
    ...business,
    template: {
      ...business.template,
      ...template,
    },
  }
}

function TemplateThumbPreview({
  slug,
  business,
  primaryColor,
}: {
  slug: string
  business: Business
  primaryColor: string
}) {
  const mobile = usePreferStaticThumb()
  const iframeRef = useRef<HTMLIFrameElement | null>(null)
  const thumbWrapRef = useRef<HTMLDivElement | null>(null)
  const [thumbScale, setThumbScale] = useState(0.25)
  const [isMounted, setIsMounted] = useState(false)
  const [hasLoaded, setHasLoaded] = useState(false)
  const loadedRef = useRef(false)

  useLayoutEffect(() => {
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
  }, [])

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') {
      setIsMounted(true)
      return
    }
    const el = thumbWrapRef.current
    if (!el) return
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setIsMounted(true)
            io.disconnect()
            break
          }
        }
      },
      // Primera vez visible: monta. Luego queda en caché aunque salga de pantalla.
      { rootMargin: mobile ? '0px' : '80px 0px', threshold: 0 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [mobile])

  const src = useMemo(() => {
    const params = new URLSearchParams()
    params.set('v', '4')
    params.set('embed', '1')
    params.set('thumb', '1')
    params.set('preview', '1')
    params.set('parentOrigin', window.location.origin)
    return `/templates/${slug}.html?${params.toString()}`
  }, [slug])

  const syncPreview = useCallback(() => {
    const frame = iframeRef.current
    if (!frame?.contentWindow) return
    frame.contentWindow.postMessage(
      {
        type: 'lw:onboarding-preview',
        alignToHash: true,
        payload: publicBusinessToTemplatePayload(business),
      },
      window.location.origin,
    )
  }, [business])

  useEffect(() => {
    if (loadedRef.current) syncPreview()
  }, [syncPreview])

  const thumbAspectPct = templateThumbAspectPadding()
  const placeholderColor = primaryColor || business.template.primary_color || '#FAFAFA'
  const placeholderBg = mobile
    ? `linear-gradient(160deg, ${placeholderColor} 0%, color-mix(in srgb, ${placeholderColor} 50%, #1a1a1a) 100%)`
    : placeholderColor

  return (
    <div
      ref={thumbWrapRef}
      className="lw-template-thumb-wrap"
      style={{
        position: 'relative',
        width: '100%',
        maxWidth: '100%',
        minWidth: 0,
        overflow: 'hidden',
        contain: 'layout paint',
      }}
    >
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: 0,
          paddingBottom: thumbAspectPct,
          background: placeholderBg,
        }}
      >
        {isMounted ? (
          <>
            <iframe
              ref={iframeRef}
              title={`Vista previa ${slug}`}
              src={src}
              loading="lazy"
              onLoad={() => {
                loadedRef.current = true
                setHasLoaded(true)
                syncPreview()
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
            <div className="lw-template-thumb-shield" aria-hidden="true" />
          </>
        ) : null}
      </div>
    </div>
  )
}

function TemplatePreviewModal({
  template,
  business,
  meta,
  onClose,
  onApply,
  applying,
}: {
  template: Template
  business: Business
  meta: {
    can_change: boolean
    current_template_id: number | null
    on_cooldown: boolean
    available_at: string | null
  }
  onClose: () => void
  onApply: () => void
  applying: boolean
}) {
  const navigate = useNavigate()
  const previewBusiness = useMemo(() => businessWithTemplate(business, template), [business, template])
  const isCurrent = template.id === meta.current_template_id
  const availableLabel = formatAvailableAt(meta.available_at)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  return createPortal(
    <>
      <PublicHtmlTemplateFrame templateSlug={template.slug} business={previewBusiness} zIndex={1990} />
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 2000,
          pointerEvents: 'none',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
      >
        <div
          style={{
            pointerEvents: 'auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            padding: '16px 20px',
            background: 'linear-gradient(to bottom, rgba(0,0,0,.72), transparent)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Badge tone="accent" size="sm">
              Vista previa
            </Badge>
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#fff' }}>{template.name}</div>
              <div className="lw-small" style={{ color: 'rgba(255,255,255,.75)', marginTop: 2 }}>
                Aún no aplicada · Esc para cerrar
              </div>
            </div>
          </div>
          <Btn kind="ghost" size="md" type="button" icon="x" onClick={onClose} style={{ color: '#fff' }}>
            Cerrar
          </Btn>
        </div>

        <Card
          padding={16}
          style={{
            pointerEvents: 'auto',
            margin: '0 16px 16px',
            maxWidth: 560,
            alignSelf: 'center',
            width: 'calc(100% - 32px)',
            boxShadow: 'var(--lw-shadow-2)',
          }}
        >
          {!meta.can_change ? (
            <div style={{ display: 'grid', gap: 10, textAlign: 'center' }}>
              <p className="lw-small" style={{ margin: 0 }}>
                Cambiar de plantilla es una función PRO.
              </p>
              <Btn
                kind="primary"
                fullWidth
                onClick={() => {
                  onClose()
                  navigate('/dashboard/account?tab=plan')
                }}
              >
                Pasar a PRO
              </Btn>
            </div>
          ) : meta.on_cooldown ? (
            <p className="lw-small" style={{ margin: 0, textAlign: 'center' }}>
              Podrás cambiar de plantilla de nuevo el {availableLabel ?? 'próximamente'}.
            </p>
          ) : isCurrent ? (
            <Btn kind="outline" fullWidth disabled>
              Esta es tu plantilla actual
            </Btn>
          ) : (
            <Btn kind="primary" fullWidth loading={applying} onClick={onApply}>
              Aplicar esta plantilla
            </Btn>
          )}
        </Card>
      </div>
    </>,
    document.body,
  )
}

export default function Diseno() {
  const { business, refetch } = useDashboard()
  const { showToast } = useToast()
  const location = useLocation()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null)
  const [changePreview, setChangePreview] = useState<TemplateChangePreview | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [page, setPage] = useState(1)
  const pageRef = useRef<HTMLDivElement | null>(null)
  const gridRef = useRef<HTMLDivElement | null>(null)
  const templatesBlockRef = useRef<HTMLDivElement | null>(null)

  const templatesQ = useQuery({
    queryKey: keys.dashboard.templates,
    queryFn: getDashboardTemplates,
  })

  const applyMutation = useMutation({
    mutationFn: (payload: ChangeBusinessTemplatePayload) => changeBusinessTemplate(payload),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: keys.dashboard.business })
      await qc.invalidateQueries({ queryKey: keys.dashboard.templates })
      await qc.invalidateQueries({ queryKey: keys.dashboard.brandColor })
      refetch()
      setPreviewTemplate(null)
      setConfirmOpen(false)
      setChangePreview(null)
      showToast({
        type: 'success',
        title: 'Plantilla actualizada',
        description: 'Tu diseño público se ha actualizado.',
      })
    },
    onError: (err: unknown) => {
      const status = axios.isAxiosError(err) ? err.response?.status : undefined
      const message = getApiErrorMessage(err)
      if (status === 429 || status === 403) {
        showToast({
          type: 'error',
          title: message ?? 'No se pudo cambiar la plantilla',
        })
        return
      }
      showToast({
        type: 'error',
        title: 'No se pudo cambiar la plantilla',
      })
    },
  })

  const templates = templatesQ.data?.templates ?? []
  const meta = templatesQ.data?.meta
  const totalPages = Math.max(1, Math.ceil(templates.length / PAGE_SIZE))
  const pageTemplates = useMemo(
    () => templates.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [templates, page],
  )

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages)
    }
  }, [page, totalPages])

  useEffect(() => {
    if (location.hash !== '#plantillas') return
    if (templatesQ.isLoading || templatesQ.isError) return

    templatesBlockRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    navigate({ pathname: location.pathname, search: location.search }, { replace: true })
  }, [
    location.hash,
    location.pathname,
    location.search,
    navigate,
    templatesQ.isLoading,
    templatesQ.isError,
    pageTemplates.length,
  ])

  useLayoutEffect(() => {
    const pageEl = pageRef.current
    const gridEl = gridRef.current
    const mainEl = pageEl?.closest('.lw-dashboard-main') as HTMLElement | null
    if (!pageEl || !gridEl || !mainEl) return

    const syncTopToGrid = () => {
      const mainTop = mainEl.getBoundingClientRect().top
      const gridTop = gridEl.getBoundingClientRect().top
      const topToGrid = Math.max(0, Math.round(gridTop - mainTop))
      mainEl.style.setProperty('--lw-diseno-top-to-grid', `${topToGrid}px`)
    }

    syncTopToGrid()
    const ro = new ResizeObserver(syncTopToGrid)
    ro.observe(pageEl)
    window.addEventListener('resize', syncTopToGrid)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', syncTopToGrid)
      mainEl.style.removeProperty('--lw-diseno-top-to-grid')
    }
  }, [
    templatesQ.isLoading,
    templatesQ.isError,
    page,
    meta?.can_change,
    pageTemplates.length,
  ])

  const goToPage = useCallback(
    (next: number) => {
      const clamped = Math.min(Math.max(1, next), totalPages)
      setPage(clamped)
      gridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      window.scrollTo({ top: 0, behavior: 'smooth' })
    },
    [totalPages],
  )

  const handleCardClick = useCallback((template: Template) => {
    // Permitimos previsualizar siempre (escaparate); aplicar se controla dentro del modal según el plan.
    setPreviewTemplate(template)
  }, [])

  const showTemplateChangeError = useCallback(
    (err: unknown) => {
      const status = axios.isAxiosError(err) ? err.response?.status : undefined
      const message = getApiErrorMessage(err)
      if (status === 403) {
        showToast({
          type: 'error',
          title: message ?? 'Cambiar plantilla requiere plan Pro',
        })
        return
      }
      if (status === 429) {
        showToast({
          type: 'error',
          title: message ?? 'Solo puedes cambiar de plantilla cada 30 días',
        })
        return
      }
      if (status === 422) {
        showToast({
          type: 'error',
          title: message ?? 'No se pudo cambiar la plantilla',
        })
        return
      }
      showToast({
        type: 'error',
        title: 'No se pudo cambiar la plantilla',
      })
    },
    [showToast],
  )

  const handleApplyTemplate = useCallback(
    async (templateId: number) => {
      if (previewLoading || applyMutation.isPending) return
      setPreviewLoading(true)
      try {
        const preview = await previewTemplateChange(templateId)
        if (preview.same_template) {
          showToast({
            type: 'info',
            title: 'Ya estás en esta plantilla',
          })
          return
        }
        if (!preview.brand_color?.has_current) {
          applyMutation.mutate({ template_id: templateId })
          return
        }
        setChangePreview(preview)
        setConfirmOpen(true)
      } catch (err) {
        showTemplateChangeError(err)
      } finally {
        setPreviewLoading(false)
      }
    },
    [previewLoading, applyMutation, showToast, showTemplateChangeError],
  )

  const handleConfirmTemplateChange = useCallback(
    (choice: BrandColorChoice) => {
      if (!previewTemplate) return
      applyMutation.mutate(buildTemplateChangePayload(previewTemplate.id, choice))
    },
    [previewTemplate, applyMutation],
  )

  const handleCloseConfirm = useCallback(() => {
    if (applyMutation.isPending) return
    setConfirmOpen(false)
    setChangePreview(null)
  }, [applyMutation.isPending])

  const gridStyle: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 260px), 1fr))',
    gap: 16,
  }

  return (
    <div ref={pageRef} className="lw-dash-section-page lw-dash-section-page--wide" data-tour="diseno-main">
      <DashboardSectionHeader
        badgeIcon="layout"
        badgeLabel="Plantilla"
        title="Diseño"
        subtitle="Elige una plantilla para tu página pública. Los cambios usan tus datos actuales."
      />

      {meta && !meta.can_change ? (
        <Card
          padding={14}
          style={{
            marginBottom: 20,
            border: '1px solid #FCD34D',
            background: 'var(--lw-pro-soft)',
            display: 'flex',
            gap: 12,
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
        >
          <Icon name="lock" size={18} color="#92400E" />
          <div style={{ flex: 1, minWidth: 200, fontSize: 13, fontWeight: 600, color: '#78350F' }}>
            Cambiar de plantilla está disponible en el plan Pro
          </div>
          <Link to="/dashboard/account?tab=plan" style={{ textDecoration: 'none' }}>
            <Btn type="button" kind="primary" size="sm">
              Ver planes
            </Btn>
          </Link>
        </Card>
      ) : null}

      {templatesQ.isLoading ? (
        <p className="lw-small">Cargando plantillas…</p>
      ) : templatesQ.isError ? (
        <p className="lw-small" style={{ color: 'var(--lw-danger)' }}>
          No se pudieron cargar las plantillas.
        </p>
      ) : (
        <>
          <div className="lw-diseno-templates-block" id="plantillas" ref={templatesBlockRef}>
          <div ref={gridRef} style={gridStyle}>
            {pageTemplates.map((template) => {
              const isCurrent = template.id === meta?.current_template_id
              return (
                <Card
                  key={template.id}
                  padding={0}
                  hover
                  onClick={() => handleCardClick(template)}
                  style={{
                    cursor: 'pointer',
                    overflow: 'hidden',
                    minWidth: 0,
                    isolation: 'isolate',
                  }}
                >
                  <div style={{ position: 'relative' }}>
                    <TemplateThumbPreview
                      slug={template.slug}
                      business={business}
                      primaryColor={template.primary_color}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        top: 8,
                        left: 8,
                        display: 'flex',
                        gap: 6,
                        flexWrap: 'wrap',
                        zIndex: 1,
                      }}
                    >
                      {template.requires_pro ? (
                        <Badge tone="pro" size="sm">
                          PRO
                        </Badge>
                      ) : null}
                      {isCurrent ? (
                        <Badge tone="success" size="sm">
                          Actual
                        </Badge>
                      ) : null}
                    </div>
                    {template.locked ? (
                      <div
                        style={{
                          position: 'absolute',
                          inset: 0,
                          background: 'rgba(0,0,0,0.45)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          zIndex: 2,
                        }}
                        aria-hidden
                      >
                        <Icon name="lock" size={28} color="#fff" />
                      </div>
                    ) : null}
                  </div>
                  <div style={{ padding: '12px 14px' }}>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{template.name}</div>
                  </div>
                </Card>
              )
            })}
          </div>
          <DisenoPagination page={page} totalPages={totalPages} onPageChange={goToPage} />
          </div>
        </>
      )}

      {previewTemplate && meta ? (
        <TemplatePreviewModal
          template={previewTemplate}
          business={business}
          meta={meta}
          applying={previewLoading || applyMutation.isPending}
          onClose={() => setPreviewTemplate(null)}
          onApply={() => void handleApplyTemplate(previewTemplate.id)}
        />
      ) : null}

      <TemplateChangeConfirmModal
        open={confirmOpen}
        onClose={handleCloseConfirm}
        preview={changePreview}
        onConfirm={handleConfirmTemplateChange}
        isPending={applyMutation.isPending}
      />
    </div>
  )
}
