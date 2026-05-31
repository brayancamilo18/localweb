import { useCallback, useEffect, useId, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Icon } from '../primitives/primitives'
import './confirmModal.css'

export type ConfirmModalShellProps = {
  open: boolean
  onClose: () => void
  loading?: boolean
  eyebrow: string
  title: string
  eyebrowTone?: 'danger' | 'gold'
  headerIcon: ReactNode
  headerIconVariant?: 'danger' | 'gold' | 'plain'
  topBand?: 'danger' | 'pro' | 'none'
  wide?: boolean
  footerClassName?: string
  footer: ReactNode
  children: ReactNode
}

export function ConfirmModalShell({
  open,
  onClose,
  loading = false,
  eyebrow,
  title,
  eyebrowTone = 'danger',
  headerIcon,
  headerIconVariant = 'danger',
  topBand = 'none',
  wide = false,
  footerClassName,
  footer,
  children,
}: ConfirmModalShellProps) {
  const titleId = useId()
  const panelRef = useRef<HTMLDivElement | null>(null)

  const handleClose = useCallback(() => {
    if (loading) return
    onClose()
  }, [loading, onClose])

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
      panelRef.current?.querySelector<HTMLButtonElement>('.lw-cmd-btn')?.focus()
    }, 60)
    return () => window.clearTimeout(t)
  }, [open])

  if (!open) return null

  return createPortal(
    <div
      className="lw-cmd-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onMouseDown={(e) => {
        if (!loading && e.target === e.currentTarget) handleClose()
      }}
    >
      <div
        ref={panelRef}
        className={`lw-cmd-panel${wide ? ' lw-cmd-panel--wide' : ''}`}
      >
        {topBand !== 'none' ? (
          <div
            className={`lw-cmd-band lw-cmd-band--${topBand === 'pro' ? 'pro' : 'danger'}`}
            aria-hidden
          />
        ) : null}

        <div className="lw-cmd-header">
          <div className="lw-cmd-header__main">
            <div
              className={`lw-cmd-header__icon lw-cmd-header__icon--${headerIconVariant}`}
              aria-hidden
            >
              {headerIcon}
            </div>
            <div style={{ minWidth: 0 }}>
              <div className={`lw-cmd-header__eyebrow lw-cmd-header__eyebrow--${eyebrowTone}`}>
                {eyebrow}
              </div>
              <h2 id={titleId} className="lw-cmd-header__title">
                {title}
              </h2>
            </div>
          </div>
          <button
            type="button"
            className="lw-cmd-close"
            onClick={handleClose}
            disabled={loading}
            aria-label="Cerrar"
          >
            <Icon name="x" size={16} stroke={2.5} />
          </button>
        </div>

        <div className="lw-cmd-body">{children}</div>

        <div className={`lw-cmd-footer${footerClassName ? ` ${footerClassName}` : ''}`}>{footer}</div>
      </div>
    </div>,
    document.body,
  )
}

export default ConfirmModalShell
