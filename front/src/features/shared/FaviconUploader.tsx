import { useCallback, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Btn, Card, Icon } from '../../components/primitives/primitives'
import { deleteBusinessFavicon, getBusiness, uploadBusinessFavicon } from '../../api/dashboard'
import { keys } from '../../api/queryKeys'

export type FaviconUploaderProps = {
  /** Si false, controles deshabilitados (solo lectura / mensaje en padre). */
  enabled: boolean
  /** Tras subir o borrar con éxito. */
  onSaved?: () => void
  onSaveError?: () => void
}

function mutationErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { message?: string } | undefined
    return data?.message ?? 'No se pudo guardar el favicon. Inténtalo de nuevo.'
  }
  return 'No se pudo guardar el favicon. Inténtalo de nuevo.'
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

export default function FaviconUploader({ enabled, onSaved, onSaveError }: FaviconUploaderProps) {
  const qc = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadProgress, setUploadProgress] = useState<number | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const businessQuery = useQuery({
    queryKey: keys.dashboard.business,
    queryFn: getBusiness,
  })

  const business = businessQuery.data
  const controlsDisabled =
    !enabled || businessQuery.isLoading || uploadProgress != null

  const uploadMut = useMutation({
    mutationFn: async (file: File) => {
      setUploadProgress(0)
      setErrorMsg(null)
      return uploadBusinessFavicon(file, (pct) => setUploadProgress(pct))
    },
    onSuccess: async () => {
      setUploadProgress(null)
      await qc.invalidateQueries({ queryKey: keys.dashboard.business })
      onSaved?.()
    },
    onError: (err) => {
      setUploadProgress(null)
      setErrorMsg(mutationErrorMessage(err))
      onSaveError?.()
    },
  })

  const deleteMut = useMutation({
    mutationFn: deleteBusinessFavicon,
    onMutate: () => {
      setErrorMsg(null)
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: keys.dashboard.business })
      onSaved?.()
    },
    onError: (err) => {
      setErrorMsg(mutationErrorMessage(err))
      onSaveError?.()
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
    return (
      <Card padding={18}>
        <div className="lw-shimmer" style={{ height: 28, borderRadius: 8, maxWidth: 280, marginBottom: 14 }} />
        <div className="lw-shimmer" style={{ height: 48, borderRadius: 8, marginBottom: 14 }} />
        <div className="lw-shimmer" style={{ height: 120, borderRadius: 12 }} />
      </Card>
    )
  }

  const hasFavicon = Boolean(business.favicon_url)
  const busy = uploadMut.isPending || deleteMut.isPending || uploadProgress != null

  return (
    <Card
      padding={18}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
      }}
    >
      <div>
        <div style={{ fontWeight: 600, marginBottom: 4 }}>Favicon (icono de pestaña)</div>
        <p className="lw-small" style={{ margin: 0, color: 'var(--lw-text-2)', lineHeight: 1.5 }}>
          Es el pequeño icono que identifica tu web en la pestaña del navegador, en los marcadores y en la pantalla de
          inicio del móvil. Usa una imagen cuadrada y simple (tu símbolo o inicial), no el logo completo con texto.
          PNG con fondo transparente, mínimo 64×64 px.
        </p>
      </div>

      {!enabled ? (
        <Card
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

      <div>
        <BrowserTabPreview faviconUrl={business.favicon_url} businessName={business.name} />
        <p className="lw-small" style={{ margin: '8px 0 0', color: 'var(--lw-text-3)' }}>
          Así se verá en la pestaña del navegador.
        </p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
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

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
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

      {errorMsg ? (
        <div
          style={{
            padding: '10px 12px',
            borderRadius: 'var(--lw-r-sm)',
            border: '1px solid var(--lw-danger)',
            background: 'var(--lw-bg-elev)',
          }}
        >
          <p className="lw-small" style={{ margin: 0, color: 'var(--lw-danger)' }}>
            {errorMsg}
          </p>
        </div>
      ) : null}
    </Card>
  )
}
