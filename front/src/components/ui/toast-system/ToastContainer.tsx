import { useState } from 'react'
import { createPortal } from 'react-dom'
import ToastItem from './ToastItem'
import styles from './toast.module.css'
import type { Toast } from './types'

type ToastContainerProps = {
  toasts: Toast[]
  /** Lo invoca cada `ToastItem` cuando ya terminó la animación de salida. */
  onItemDismissed: (id: number) => void
}

/**
 * Renderiza el stack de toasts en un portal sobre `document.body` para que esté siempre por
 * encima de overlays/dialogs. Sin SSR aquí (la app es 100% CSR), pero comprobamos `document`
 * por si en futuro se renderiza en servidor — el lazy init evita el `setState` en useEffect
 * que la regla `react-hooks/set-state-in-effect` desaconseja.
 */
export default function ToastContainer({ toasts, onItemDismissed }: ToastContainerProps) {
  const [target] = useState<HTMLElement | null>(() =>
    typeof document !== 'undefined' ? document.body : null,
  )

  if (!target) return null

  /*
   * `aria-live` ya va dentro de cada `ToastItem` (status / alert según tipo). El contenedor
   * no fija aria-live a nivel global porque mezclar polite y assertive en una misma región
   * confunde a los lectores de pantalla.
   */
  return createPortal(
    <div className={styles.viewport} data-testid="lw-toast-viewport">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismissed={onItemDismissed} />
      ))}
    </div>,
    target,
  )
}
