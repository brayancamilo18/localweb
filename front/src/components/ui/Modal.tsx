import { useEffect, useId, useRef, type CSSProperties, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Icon } from '../primitives/primitives'

type ModalProps = {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  /** Acciones del pie (botones). Si se omite, no se muestra el footer. */
  footer?: ReactNode
  /** Ancho máximo del panel. */
  maxWidth?: number
  /** Si false, no cierra al hacer clic en el backdrop (útil mientras se guarda). */
  closeOnBackdrop?: boolean
}

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  maxWidth = 512,
  closeOnBackdrop = true,
}: ModalProps) {
  const titleId = useId()
  const panelRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

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
      panelRef.current?.querySelector<HTMLInputElement | HTMLTextAreaElement>('input, textarea')?.focus()
    }, 60)
    return () => window.clearTimeout(t)
  }, [open])

  if (!open) return null

  const panelStyle = {
    '--lw-modal-max-w': `${maxWidth}px`,
  } as CSSProperties

  return createPortal(
    <div
      className="lw-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onMouseDown={(e) => {
        if (closeOnBackdrop && e.target === e.currentTarget) onClose()
      }}
    >
      <div ref={panelRef} className="lw-modal-panel" style={panelStyle}>
        <div className="lw-modal-header">
          <h2 id={titleId} className="lw-modal-title">
            {title}
          </h2>
          <button type="button" className="lw-modal-close" onClick={onClose} aria-label="Cerrar">
            <Icon name="x" size={20} />
          </button>
        </div>

        <div className="lw-modal-body">{children}</div>

        {footer ? <div className="lw-modal-footer">{footer}</div> : null}
      </div>
    </div>,
    document.body,
  )
}
