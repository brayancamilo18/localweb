import { useCallback, useRef, useState, type RefObject } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Btn, Card, Icon } from '../../components/primitives/primitives'
import { deleteBusinessFavicon, getBusiness, uploadBusinessFavicon } from '../../api/dashboard'
import { prepareImageForUpload, UPLOAD_MAX_BYTES } from '../../lib/imageUpload'
import { resolveImageUploadError } from '../../lib/uploadErrorFeedback'
import { useToast } from '../../components/ui/Toast'
import { keys } from '../../api/queryKeys'

export type FaviconUploaderProps = {
  /** Si false, controles deshabilitados (solo lectura / mensaje en padre). */
  enabled: boolean
  /** Tras subir o borrar con éxito. */
  onSaved?: () => void
  onSaveError?: () => void
  /** Sin Card ni título: el padre aporta la cabecera de sección (p. ej. página Imágenes). */
  embedded?: boolean
  /** Contenedor de subida para scroll en errores (p. ej. desde Imágenes). */
  uploadAreaRef?: RefObject<HTMLDivElement | null>
  /** Mensaje inline bajo el área de subida (controlado por el padre). */
  inlineError?: string | null
  /** Toast + scroll + inline vía el padre (Imágenes). */
  onUploadError?: (err: unknown, retry?: () => void) => void
  onUploadSuccess?: () => void
}

function FaviconUploadInlineError({ message }: { message?: string | null }) {
  if (!message) {
    return null
  }

  return (
    <div
      className="lw-images-upload-error"
      role="alert"
      aria-live="assertive"
      style={{ marginBottom: 10 }}
    >
      <p>{message}</p>
    </div>
  )
}

function businessInitials(name: string): string {
  const trimmed = name.trim()
  if (!trimmed) return '·'
  const parts = trimmed.split(/\s+/).filter(Boolean)
  if (parts.length >= 2) {
    return (parts[0]!.charAt(0) + parts[1]!.charAt(0)).toUpperCase()
  }
  return trimmed.slice(0, 2).toUpperCase()
}

function BrowserTabPreview({ faviconUrl, businessName }: { faviconUrl: string | null; businessName: string }) {
  const initials = businessInitials(businessName)

  return (
    <div
      style={{
        background: 'var(--lw-bg-elev)',
        border: '1px solid var(--lw-border)',
        borderRadius: 'var(--lw-r-sm)',
        padding: '10px 10px 0',
      }}
    >
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          maxWidth: '100%',
          padding: '6px 10px',
          borderRadius: '8px 8px 0 0',
          background: 'var(--lw-surface)',
          border: '1px solid var(--lw-border)',
          borderBottom: 'none',
          boxShadow: 'var(--lw-shadow-1)',
        }}
      >
        {faviconUrl ? (
          <img
            src={faviconUrl}
            alt=""
            width={18}
            height={18}
            style={{
              width: 18,
              height: 18,
              borderRadius: 3,
              objectFit: 'cover',
              flexShrink: 0,
              display: 'block',
            }}
          />
        ) : (
          <div
            aria-hidden
            style={{
              width: 18,
              height: 18,
              borderRadius: 3,
              background: 'var(--lw-border)',
              color: 'var(--lw-text-3)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 9,
              fontWeight: 600,
              flexShrink: 0,
              lineHeight: 1,
            }}
          >
            {initials}
          </div>
        )}
        <span
          style={{
            flex: 1,
            minWidth: 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            fontSize: 12,
            color: 'var(--lw-text)',
          }}
        >
          {businessName.trim() || 'Tu negocio'}
        </span>
        <span
          aria-hidden
          style={{
            fontSize: 14,
            lineHeight: 1,
            color: 'var(--lw-text-3)',
            flexShrink: 0,
          }}
        >
          ×
        </span>
      </div>
    </div>
  )
}

export default function FaviconUploader({
  enabled,
  onSaved,
  onSaveError,
  embedded = false,
  uploadAreaRef: uploadAreaRefProp,
  inlineError,
  onUploadError,
  onUploadSuccess,
}: FaviconUploaderProps) {
  const qc = useQueryClient()
  const { showToast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const localUploadAreaRef = useRef<HTMLDivElement>(null)
  const uploadAreaRef = uploadAreaRefProp ?? localUploadAreaRef
  const lastFileRef = useRef<File | null>(null)
  const [uploadProgress, setUploadProgress] = useState<number | null>(null)
  const [localError, setLocalError] = useState<string | null>(null)
  const displayError = inlineError ?? localError

  const businessQuery = useQuery({
    queryKey: keys.dashboard.business,
    queryFn: getBusiness,
  })

  const business = businessQuery.data
  const controlsDisabled =
    !enabled || businessQuery.isLoading || uploadProgress != null

  const retryUploadRef = useRef<(file: File) => void>(() => {})

  const uploadMut = useMutation({
    mutationFn: async (file: File) => {
      setUploadProgress(0)
      setLocalError(null)
      lastFileRef.current = file
      if (file.size > UPLOAD_MAX_BYTES.favicon * 0.5 && !file.type.includes('svg')) {
        showToast('Comprimiendo imagen…', 'info')
      }
      const ready = await prepareImageForUpload(file, {
        maxBytes: UPLOAD_MAX_BYTES.favicon,
        maxDimension: 512,
        quality: 0.85,
        preferPng: true,
      })
      lastFileRef.current = ready
      return uploadBusinessFavicon(ready, (pct) => setUploadProgress(pct))
    },
    onSuccess: async () => {
      setUploadProgress(null)
      setLocalError(null)
      onUploadSuccess?.()
      await qc.invalidateQueries({ queryKey: keys.dashboard.business })
      onSaved?.()
    },
    onError: (err) => {
      setUploadProgress(null)
      reportUploadError(err)
    },
  })

  retryUploadRef.current = (file: File) => {
    if (!controlsDisabled && !uploadMut.isPending) {
      uploadMut.mutate(file)
    }
  }

  const reportUploadError = useCallback(
    (err: unknown) => {
      const resolved = resolveImageUploadError(err)
      const retry = () => {
        const f = lastFileRef.current
        if (f) {
          retryUploadRef.current(f)
        }
      }
      if (onUploadError) {
        onUploadError(err, retry)
      } else {
        setLocalError(resolved.message)
        showToast({
          type: 'error',
          title: 'Error al subir la imagen',
          description: resolved.message,
          duration: 6000,
          action: resolved.retryable ? { label: 'Reintentar', onClick: retry } : undefined,
        })
        uploadAreaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
      onSaveError?.()
    },
    [onSaveError, onUploadError, showToast, uploadAreaRef],
  )

  const deleteMut = useMutation({
    mutationFn: deleteBusinessFavicon,
    onMutate: () => {
      setLocalError(null)
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: keys.dashboard.business })
      onSaved?.()
    },
    onError: (err) => {
      reportUploadError(err)
    },
  })

  const handleFileChange = useCallback(
    (file: File) => {
      if (controlsDisabled || uploadMut.isPending) return
      uploadMut.mutate(file)
    },
    [controlsDisabled, uploadMut],
  )

  const handleDelete = useCallback(() => {
    if (controlsDisabled || deleteMut.isPending) return
    if (!window.confirm('¿Quitar el favicon personalizado? La pestaña volverá al icono por defecto.')) return
    deleteMut.mutate()
  }, [controlsDisabled, deleteMut])

  if (businessQuery.isLoading || !business) {
    const skeleton = (
      <>
        <div className="lw-shimmer" style={{ height: 28, borderRadius: 8, maxWidth: 280, marginBottom: 14 }} />
        <div className="lw-shimmer" style={{ height: 48, borderRadius: 8, marginBottom: 14 }} />
        <div className="lw-shimmer" style={{ height: 120, borderRadius: 12 }} />
      </>
    )
    return embedded ? <div className="lw-images-favicon--embedded">{skeleton}</div> : <Card padding={18}>{skeleton}</Card>
  }

  const hasFavicon = Boolean(business.favicon_url)
  const busy = uploadMut.isPending || deleteMut.isPending || uploadProgress != null
  const initials = businessInitials(business.name)

  const inner = (
    <>
      <div className="lw-images-favicon__title-block">
        <div style={{ fontWeight: 600, marginBottom: 4 }}>Favicon (icono de pestaña)</div>
        <p className="lw-small" style={{ margin: 0, color: 'var(--lw-text-2)', lineHeight: 1.5 }}>
          Es el pequeño icono que identifica tu web en la pestaña del navegador, en los marcadores y en la pantalla de
          inicio del móvil. Usa una imagen cuadrada y simple (tu símbolo o inicial), no el logo completo con texto.
          PNG con fondo transparente, mínimo 64×64 px.
        </p>
      </div>

      {!enabled ? (
        <Card
          className="lw-images-favicon__lock-banner"
          padding={14}
          style={{
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
            El favicon personalizado está disponible en el plan Pro
          </div>
          <Link to="/dashboard/account?tab=plan" style={{ textDecoration: 'none' }}>
            <Btn type="button" kind="primary" size="sm">
              Ver planes
            </Btn>
          </Link>
        </Card>
      ) : null}

      <div className="lw-images-favicon__row">
        <div className="lw-images-favicon__tab-preview-wrap">
          {embedded ? (
            <div className="lw-images-favicon__preview-stack">
              <div className="lw-images-favicon__browser-frame" aria-hidden>
                <div className="lw-images-favicon__preview-tab">
                  <div className="lw-images-favicon__preview-tab-icon">
                    {business.favicon_url ? (
                      <img src={business.favicon_url} alt="" />
                    ) : (
                      initials
                    )}
                  </div>
                  <span className="lw-images-favicon__preview-tab-title">
                    {business.name.trim() || 'Tu negocio'}
                  </span>
                  <span className="lw-images-favicon__preview-tab-x">×</span>
                </div>
              </div>
              <span className="lw-images-favicon__tab-label">Vista previa pestaña</span>
            </div>
          ) : (
            <div>
              <BrowserTabPreview faviconUrl={business.favicon_url} businessName={business.name} />
              <p className="lw-small" style={{ margin: '8px 0 0', color: 'var(--lw-text-3)' }}>
                Así se verá en la pestaña del navegador.
              </p>
            </div>
          )}
        </div>

        <div ref={uploadAreaRef} className="lw-images-favicon__actions lw-images-upload-area">
          <FaviconUploadInlineError message={displayError} />
          {!embedded ? (
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: 'var(--lw-r-sm)',
                background: 'var(--lw-bg-elev)',
                border: '1px solid var(--lw-border)',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {business.favicon_url ? (
                <img
                  src={business.favicon_url}
                  alt="Favicon actual"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <Icon name="sparkle" size={22} style={{ opacity: 0.25 }} />
              )}
            </div>
          ) : null}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/svg+xml,image/x-icon,image/webp"
            style={{ display: 'none' }}
            disabled={controlsDisabled || busy}
            onChange={(e) => {
              const f = e.target.files?.[0]
              e.target.value = ''
              if (!f) return
              handleFileChange(f)
            }}
          />
          {embedded ? (
            <>
              <button
                type="button"
                className="lw-images-favicon-btn"
                disabled={controlsDisabled || busy}
                onClick={() => fileInputRef.current?.click()}
              >
                {hasFavicon ? 'Cambiar favicon' : 'Subir favicon'}
              </button>
              {hasFavicon ? (
                <button
                  type="button"
                  className="lw-images-favicon-btn lw-images-favicon-btn--ghost"
                  disabled={controlsDisabled || busy}
                  onClick={() => handleDelete()}
                >
                  {deleteMut.isPending ? 'Quitando…' : 'Quitar'}
                </button>
              ) : null}
            </>
          ) : (
            <>
              <Btn
                type="button"
                size="sm"
                kind="outline"
                disabled={controlsDisabled || busy}
                onClick={() => fileInputRef.current?.click()}
              >
                {hasFavicon ? 'Cambiar favicon' : 'Subir favicon'}
              </Btn>
              {hasFavicon ? (
                <Btn
                  type="button"
                  size="sm"
                  kind="ghost"
                  disabled={controlsDisabled || busy}
                  loading={deleteMut.isPending}
                  onClick={() => handleDelete()}
                >
                  Quitar
                </Btn>
              ) : null}
            </>
          )}
        </div>
      </div>

      {uploadProgress != null && uploadProgress >= 0 ? (
        <div>
          <div className="lw-small" style={{ marginBottom: 4, color: 'var(--lw-text-2)' }}>
            Subiendo… {uploadProgress}%
          </div>
          <div
            style={{
              height: 6,
              borderRadius: 4,
              background: 'var(--lw-border)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${uploadProgress}%`,
                background: 'var(--lw-accent)',
                transition: 'width .12s',
              }}
            />
          </div>
        </div>
      ) : null}

    </>
  )

  if (embedded) {
    return <div className="lw-images-favicon--embedded">{inner}</div>
  }

  return (
    <Card
      padding={18}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
      }}
    >
      {inner}
    </Card>
  )
}
