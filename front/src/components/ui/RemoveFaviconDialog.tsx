import { useCallback, useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Icon } from '../primitives/primitives'
import './removeFaviconDialog.css'

export type RemoveFaviconDialogProps = {
  open: boolean
  onCancel: () => void
  onConfirm: () => void
  loading?: boolean
  faviconUrl: string | null
  businessName: string
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

function faviconFileLabel(url: string | null): string {
  if (!url) return 'Tu favicon'
  try {
    const path = new URL(url, window.location.origin).pathname
    const name = path.split('/').filter(Boolean).pop()
    if (name && name.length <= 28) return name
  } catch {
    /* ignore */
  }
  return 'Tu favicon'
}

export function RemoveFaviconDialog({
  open,
  onCancel,
  onConfirm,
  loading = false,
  faviconUrl,
  businessName,
}: RemoveFaviconDialogProps) {
  const titleId = useId()
  const panelRef = useRef<HTMLDivElement | null>(null)

  const handleClose = useCallback(() => {
    if (loading) return
    onCancel()
  }, [loading, onCancel])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, handleClose])

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const t = window.setTimeout(() => {
      panelRef.current?.querySelector<HTMLButtonElement>('.lw-rfd-btn--ghost')?.focus()
    }, 60)
    return () => window.clearTimeout(t)
  }, [open])

  if (!open) return null

  const initials = businessInitials(businessName)
  const fileLabel = faviconFileLabel(faviconUrl)

  return createPortal(
    <div
      className="lw-rfd-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onMouseDown={(e) => {
        if (!loading && e.target === e.currentTarget) handleClose()
      }}
    >
      <div ref={panelRef} className="lw-rfd-panel">
        <div className="lw-rfd-header">
          <div className="lw-rfd-header__main">
            <div className="lw-rfd-header__icon" aria-hidden>
              <Icon name="alert" size={20} color="#B23A2E" stroke={2.2} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div className="lw-rfd-header__eyebrow">Acción de confirmación</div>
              <h2 id={titleId} className="lw-rfd-header__title">
                Quitar favicon personalizado
              </h2>
            </div>
          </div>
          <button
            type="button"
            className="lw-rfd-close"
            onClick={handleClose}
            disabled={loading}
            aria-label="Cerrar"
          >
            <Icon name="x" size={16} stroke={2.5} />
          </button>
        </div>

        <div className="lw-rfd-body">
          <div className="lw-rfd-compare" aria-hidden>
            <div className="lw-rfd-compare__col">
              <div className="lw-rfd-compare__label">Ahora</div>
              <div className="lw-rfd-compare__thumb-wrap">
                <div className="lw-rfd-compare__thumb lw-rfd-compare__thumb--now">
                  {faviconUrl ? (
                    <img src={faviconUrl} alt="" />
                  ) : (
                    <span className="lw-rfd-compare__thumb--now-fallback">{initials}</span>
                  )}
                </div>
                <span className="lw-rfd-compare__badge">Tuyo</span>
              </div>
              <div className="lw-rfd-compare__filename">{fileLabel}</div>
            </div>

            <div className="lw-rfd-compare__arrow" aria-hidden>
              <Icon name="arrowRight" size={20} />
            </div>

            <div className="lw-rfd-compare__col">
              <div className="lw-rfd-compare__label">Después</div>
              <div className="lw-rfd-compare__thumb lw-rfd-compare__thumb--after">
                <Icon name="image" size={24} stroke={1.8} />
              </div>
              <div className="lw-rfd-compare__filename">Por defecto</div>
            </div>
          </div>

          <p className="lw-rfd-desc">
            La pestaña del navegador volverá a mostrar el icono por defecto. Podrás subir otro favicon cuando quieras.
          </p>

          <div className="lw-rfd-hint">
            <svg
              className="lw-rfd-hint__icon"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M3 10h10a4 4 0 0 1 0 8H7" />
              <path d="M3 14l3-3-3-3" />
            </svg>
            <span>
              Acción <strong>reversible</strong>. Puedes restaurar tu favicon subiéndolo de nuevo.
            </span>
          </div>
        </div>

        <div className="lw-rfd-footer">
          <button
            type="button"
            className="lw-rfd-btn lw-rfd-btn--ghost"
            onClick={handleClose}
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="lw-rfd-btn lw-rfd-btn--danger"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="lw-rfd-spinner" aria-hidden />
                Quitando…
              </>
            ) : (
              <>
                <Icon name="alert" size={16} color="#fff" stroke={2.4} />
                Sí, quitar favicon
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}

export default RemoveFaviconDialog
