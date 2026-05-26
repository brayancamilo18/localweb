import { useEffect, useMemo, useRef, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { QRCodeCanvas } from 'qrcode.react'
import QrPosterPreview, { QR_POSTER_DIMENSIONS } from './QrPosterPreview'
import { Badge, Btn, Card, Field, Icon, Input } from '../../../components/primitives/primitives'
import Select from '../../../components/primitives/Select'
import { useToast } from '../../../components/ui/Toast'
import {
  fetchLogoAsDataUri,
  getQrInfo,
  getQrPngDownloadUrl,
  postQrPoster,
  type QrPosterPayload,
} from '../../../api/qr'
import { postCheckout } from '../../../api/billing'
import { keys } from '../../../api/queryKeys'
import { useDashboard } from '../context/DashboardContext'
import './mipagina-qr.css'

type PosterSize = 'a4' | 'a5' | 'square'

const POSTER_SIZE_OPTIONS: Array<{ value: PosterSize; label: string }> = [
  { value: 'a4', label: 'A4 (210 × 297 mm)' },
  { value: 'a5', label: 'A5 (148 × 210 mm)' },
  { value: 'square', label: 'Cuadrado (21 × 21 cm)' },
]

const MAX_MESSAGE_LEN = 80

function isValidHex(v: string): boolean {
  return /^#[0-9a-fA-F]{6}$/.test(v)
}

export default function MiPaginaQrSection() {
  const { showToast } = useToast()
  const { business } = useDashboard()

  const infoQ = useQuery({ queryKey: keys.qr.info, queryFn: getQrInfo })

  // ── Estado del formulario ────────────────────────────────────────
  const [color, setColor] = useState<string>('')
  const [message, setMessage] = useState<string>('¡Escanéame!')
  const [posterSize, setPosterSize] = useState<PosterSize>('a4')
  const [includeLogo, setIncludeLogo] = useState<boolean>(true)
  const [logoDataUri, setLogoDataUri] = useState<string | null>(null)
  const [logoLoading, setLogoLoading] = useState(false)
  const [posterQrDataUri, setPosterQrDataUri] = useState('')
  const [didInit, setDidInit] = useState(false)
  const posterQrCanvasRef = useRef<HTMLDivElement>(null)

  // Inicializa el estado cuando llega la info del backend
  useEffect(() => {
    if (!infoQ.data || didInit) return
    setColor(infoQ.data.default_color)
    setIncludeLogo(infoQ.data.has_logo)
    if (infoQ.data.tagline) {
      setMessage(infoQ.data.tagline.slice(0, MAX_MESSAGE_LEN))
    }
    setDidInit(true)
  }, [infoQ.data, didInit])

  // Descarga y convierte el logo a base64 para enviar al backend en el PDF
  useEffect(() => {
    if (!business.logo_url) return
    setLogoLoading(true)
    fetchLogoAsDataUri(business.logo_url)
      .then((uri) => setLogoDataUri(uri))
      .finally(() => setLogoLoading(false))
  }, [business.logo_url])

  const effectiveColor = useMemo(
    () => (isValidHex(color) ? color : '#000000'),
    [color],
  )

  const posterDims = QR_POSTER_DIMENSIONS[posterSize]
  const posterPreviewScale = 268 / posterDims.w

  // Canvas oculto: misma resolución que el PDF para la vista previa del póster.
  useEffect(() => {
    const canvas = posterQrCanvasRef.current?.querySelector('canvas')
    if (!canvas) return
    const id = requestAnimationFrame(() => {
      try {
        setPosterQrDataUri(canvas.toDataURL('image/png'))
      } catch {
        setPosterQrDataUri('')
      }
    })
    return () => cancelAnimationFrame(id)
  }, [infoQ.data?.public_url, effectiveColor, posterSize])

  // ── Mutations ────────────────────────────────────────────────────
  const checkoutM = useMutation({
    mutationFn: postCheckout,
    onSuccess: (url) => {
      window.location.href = url
    },
    onError: () =>
      showToast({
        type: 'error',
        title: 'No se pudo abrir el checkout',
        description: 'Inténtalo de nuevo en unos segundos.',
      }),
  })

  const pngM = useMutation({
    mutationFn: async () => {
      const url = getQrPngDownloadUrl({
        size: 1024,
        color: effectiveColor !== infoQ.data?.default_color ? effectiveColor : undefined,
      })
      const a = document.createElement('a')
      a.href = url
      a.rel = 'noopener'
      a.download =
        `qr-${infoQ.data?.business_name ?? 'pagina'}`
          .replace(/[^a-zA-Z0-9-_ ]/g, '')
          .replace(/\s+/g, '-')
          .toLowerCase() + '.png'
      document.body.appendChild(a)
      a.click()
      a.remove()
    },
    onSuccess: () =>
      showToast({
        type: 'success',
        title: 'Descargando PNG',
        description: 'Tu código QR se está descargando.',
      }),
    onError: () =>
      showToast({
        type: 'error',
        title: 'No se pudo descargar el PNG',
        description: 'Inténtalo de nuevo en unos segundos.',
      }),
  })

  const pdfM = useMutation({
    mutationFn: async (): Promise<Blob> => {
      const payload: QrPosterPayload = {
        size: posterSize,
        message: message.trim() || '¡Escanéame!',
        include_logo: infoQ.data?.has_logo ? includeLogo : false,
      }
      if (effectiveColor !== infoQ.data?.default_color) {
        payload.color = effectiveColor
      }
      if (payload.include_logo && logoDataUri) {
        payload.logo_data_uri = logoDataUri
      }
      return await postQrPoster(payload)
    },
    onSuccess: (blob) => {
      const objectUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = objectUrl
      a.rel = 'noopener'
      a.download =
        `poster-qr-${infoQ.data?.business_name ?? 'pagina'}`
          .replace(/[^a-zA-Z0-9-_ ]/g, '')
          .replace(/\s+/g, '-')
          .toLowerCase() + '.pdf'
      document.body.appendChild(a)
      a.click()
      a.remove()
      setTimeout(() => URL.revokeObjectURL(objectUrl), 1000)

      showToast({
        type: 'success',
        title: 'Póster descargado',
        description: 'Imprímelo y pégalo donde tus clientes lo vean.',
      })
    },
    onError: () =>
      showToast({
        type: 'error',
        title: 'No se pudo generar el póster',
        description: 'Inténtalo de nuevo en unos segundos.',
      }),
  })

  // ── Renders condicionales ────────────────────────────────────────
  if (infoQ.isLoading) {
    return (
      <Card padding={20} className="lw-mipagina-qr-card">
        <p className="lw-small">Cargando código QR…</p>
      </Card>
    )
  }

  if (infoQ.isError || !infoQ.data) {
    return (
      <Card padding={20} className="lw-mipagina-qr-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Icon name="alert" size={16} color="var(--lw-text-3)" />
          <p className="lw-small">
            Aún no tienes una página publicada. Termina la configuración para generar tu QR.
          </p>
        </div>
      </Card>
    )
  }

  const info = infoQ.data
  const isPro = info.is_pro

  return (
    <Card padding={20} className="lw-mipagina-qr-card">
      <div className="lw-mipagina-qr-header">
        <div>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 12px',
              borderRadius: 999,
              background: 'var(--lw-accent-soft)',
              color: 'var(--lw-accent)',
              fontSize: 12,
              fontWeight: 600,
              marginBottom: 12,
            }}
          >
            <Icon name="grid" size={14} /> Código QR
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <h2 className="lw-h3" style={{ margin: 0 }}>
              Tu cartel listo para imprimir
            </h2>
            {!isPro ? (
              <Badge tone="pro" icon="sparkle">
                Solo Pro
              </Badge>
            ) : null}
          </div>
          <p className="lw-small" style={{ marginTop: 6, maxWidth: 540 }}>
            Genera un póster con QR para pegar en tu local. Los clientes lo escanean y acceden a tu página.
          </p>
        </div>
      </div>

      <div className="lw-mipagina-qr-body">
        {/* Previsualización del póster (WYSIWYG con el PDF) */}
        <div className="lw-mipagina-qr-preview-col">
          <div ref={posterQrCanvasRef} className="lw-mipagina-qr-qr-source" aria-hidden>
            <QRCodeCanvas
              value={info.public_url}
              size={posterSize === 'square' ? 300 : 340}
              level="H"
              fgColor={effectiveColor}
              bgColor="#FFFFFF"
              marginSize={2}
            />
          </div>

          <div
            className={`lw-mipagina-qr-preview lw-mipagina-qr-preview--poster ${isPro ? '' : 'lw-mipagina-qr-preview--locked'}`}
            aria-label="Previsualización del póster QR"
          >
            <div
              className="lw-mipagina-qr-poster-scale"
              style={{
                width: Math.round(posterDims.w * posterPreviewScale),
                height: Math.round(posterDims.h * posterPreviewScale),
              }}
            >
              <div
                className="lw-mipagina-qr-poster-inner"
                style={{
                  width: posterDims.w,
                  height: posterDims.h,
                  transform: `scale(${posterPreviewScale})`,
                }}
              >
                {posterQrDataUri ? (
                  <QrPosterPreview
                    businessName={info.business_name}
                    tagline={info.tagline ?? undefined}
                    publicUrl={info.public_url}
                    qrDataUri={posterQrDataUri}
                    message={message.trim() || '¡Escanéame!'}
                    color={effectiveColor}
                    logoDataUri={
                      info.has_logo && includeLogo && logoDataUri ? logoDataUri : undefined
                    }
                    size={posterSize}
                  />
                ) : (
                  <p className="lw-small" style={{ padding: 24, textAlign: 'center' }}>
                    Generando vista previa…
                  </p>
                )}
              </div>
            </div>
            {!isPro && (
              <div className="lw-mipagina-qr-lock" role="status">
                <Icon name="lock" size={20} color="var(--lw-pro)" />
                <span className="lw-small" style={{ color: 'var(--lw-pro)', fontWeight: 600 }}>
                  Disponible en Pro
                </span>
              </div>
            )}
          </div>

          <p className="lw-small" style={{ marginTop: 10, textAlign: 'center', color: 'var(--lw-text-3)' }}>
            Vista previa del póster · el PDF coincide con lo que ves aquí
          </p>
        </div>

        {/* Panel de personalización */}
        <div className="lw-mipagina-qr-options-col">
          <div className="lw-mipagina-qr-options">
            <Field label="Color del QR" hint="Por defecto, el color de tu plantilla">
              <div className="lw-mipagina-qr-color-row">
                <input
                  type="color"
                  value={effectiveColor}
                  onChange={(e) => setColor(e.target.value.toUpperCase())}
                  disabled={!isPro}
                  className="lw-mipagina-qr-color-swatch"
                  aria-label="Selector de color"
                />
                <Input
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  disabled={!isPro}
                  placeholder="#000000"
                  maxLength={7}
                  style={{ fontFamily: 'var(--lw-font-mono)' }}
                />
                {isValidHex(color) && color !== info.default_color && (
                  <Btn
                    kind="ghost"
                    size="sm"
                    type="button"
                    disabled={!isPro}
                    onClick={() => setColor(info.default_color)}
                  >
                    Restablecer
                  </Btn>
                )}
              </div>
              <div className="lw-mipagina-qr-presets">
                {['#0F6E56', '#0B1F1A', '#C2410C', '#1E3A8A', '#7C3AED', '#BE185D'].map((c) => (
                  <button
                    key={c}
                    type="button"
                    aria-label={`Color ${c}`}
                    disabled={!isPro}
                    onClick={() => setColor(c)}
                    className="lw-mipagina-qr-preset"
                    style={{
                      background: c,
                      border:
                        effectiveColor.toLowerCase() === c.toLowerCase()
                          ? '2px solid var(--lw-text)'
                          : '1px solid var(--lw-border)',
                    }}
                  />
                ))}
              </div>
            </Field>

            <Field
              label="Mensaje del póster"
              hint={`${message.length}/${MAX_MESSAGE_LEN} caracteres`}
            >
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value.slice(0, MAX_MESSAGE_LEN))}
                disabled={!isPro}
                placeholder="¡Escanéame!"
                maxLength={MAX_MESSAGE_LEN}
              />
            </Field>

            <Field label="Tamaño del póster">
              <Select
                value={posterSize}
                onChange={(e) => setPosterSize(e.target.value as PosterSize)}
                options={POSTER_SIZE_OPTIONS}
                disabled={!isPro}
              />
            </Field>

            {info.has_logo && (
              <Field label="Incluir logo en el póster">
                <label
                  className="lw-mipagina-qr-switch"
                  style={{
                    background: includeLogo ? 'var(--lw-accent-soft)' : 'var(--lw-bg-elev)',
                  }}
                >
                  <span className="lw-mipagina-qr-switch-track" data-on={includeLogo ? 'true' : 'false'}>
                    <span className="lw-mipagina-qr-switch-thumb" />
                  </span>
                  <span className="lw-small" style={{ flex: 1 }}>
                    {logoLoading
                      ? 'Cargando logo…'
                      : includeLogo
                        ? 'Sí, en la parte superior del póster'
                        : 'No incluir logo'}
                  </span>
                  <input
                    type="checkbox"
                    checked={includeLogo}
                    onChange={(e) => setIncludeLogo(e.target.checked)}
                    disabled={!isPro}
                    style={{ display: 'none' }}
                  />
                </label>
              </Field>
            )}

            <div className="lw-mipagina-qr-data-info">
              <Icon name="info" size={13} color="var(--lw-text-4)" />
              <span className="lw-small" style={{ fontSize: 12 }}>
                Se usa el nombre, eslogan y colores de tu página automáticamente.
              </span>
            </div>
          </div>

          {isPro ? (
            <div className="lw-mipagina-qr-actions">
              <Btn
                kind="primary"
                icon="upload"
                type="button"
                loading={pngM.isPending}
                disabled={pdfM.isPending}
                onClick={() => pngM.mutate()}
              >
                Descargar PNG
              </Btn>
              <Btn
                kind="outline"
                icon="upload"
                type="button"
                loading={pdfM.isPending}
                disabled={pngM.isPending}
                onClick={() => pdfM.mutate()}
              >
                Descargar póster PDF
              </Btn>
            </div>
          ) : (
            <div className="lw-mipagina-qr-upsell">
              <div className="lw-mipagina-qr-upsell-text">
                <strong>Mejora a Pro para descargar tu QR</strong>
                <p className="lw-small" style={{ marginTop: 4 }}>
                  Genera PNG y póster imprimible en A4, A5 o cuadrado.
                </p>
              </div>
              <Btn
                kind="primary"
                iconRight="sparkle"
                type="button"
                loading={checkoutM.isPending}
                onClick={() => checkoutM.mutate()}
              >
                Mejorar a Pro
              </Btn>
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}
