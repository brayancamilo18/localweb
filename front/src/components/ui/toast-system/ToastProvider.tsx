import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react'
import ToastContainer from './ToastContainer'
import { ToastContext, type ShowToast, type ToastContextValue } from './ToastContext'
import {
  DEFAULT_TOAST_DURATION_MS,
  MAX_VISIBLE_TOASTS,
  type Toast,
  type ToastInput,
  type ToastType,
} from './types'

/* `Date.now() + Math.random()` evita colisiones cuando se disparan dos toasts en el mismo tick. */
function nextId(): number {
  return Date.now() + Math.random()
}

function normalize(input: ToastInput | string, maybeType?: ToastType): Toast {
  if (typeof input === 'string') {
    const type: ToastType = maybeType ?? 'info'
    return {
      id: nextId(),
      type,
      title: input,
      duration: DEFAULT_TOAST_DURATION_MS,
    }
  }

  // Forma rica: respeta `duration` exactamente como viene (null/0 ⇒ persistente).
  let duration: number | null
  if (input.duration === null) {
    duration = null
  } else if (input.duration === undefined) {
    duration = DEFAULT_TOAST_DURATION_MS
  } else if (input.duration === 0) {
    duration = null
  } else {
    duration = input.duration
  }

  return {
    id: nextId(),
    type: input.type,
    title: input.title,
    description: input.description,
    action: input.action,
    duration,
  }
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  /*
   * Las animaciones de salida son responsabilidad del propio `ToastItem` (mantiene su estado
   * `isExiting` y nos avisa por `onDismissed`). El provider solo retira el toast del array
   * cuando recibe ese callback, así no rompemos el ciclo de salida visual.
   *
   * `pendingExitsRef` se usa solo cuando expulsamos al más viejo por superar
   * MAX_VISIBLE_TOASTS: en ese caso el item no recibe ningún evento de hover/click; lo
   * sacamos directo del estado en `enqueue()`. Lo guardamos por si en el futuro queremos
   * orquestar una salida animada también ahí.
   */
  const pendingExitsRef = useRef<Set<number>>(new Set())

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
    pendingExitsRef.current.delete(id)
  }, [])

  /*
   * `enqueue` añade el toast al final (FIFO visual: el más viejo queda arriba, el más nuevo
   * abajo). Si pasamos del máximo, se descarta el más viejo de forma síncrona — su nodo DOM
   * desaparece sin animación de salida; es coherente con que también haya entrado uno nuevo
   * y mantengamos el stack a 4 sin clipping.
   */
  const enqueue = useCallback((toast: Toast) => {
    setToasts((prev) => {
      const next = [...prev, toast]
      if (next.length > MAX_VISIBLE_TOASTS) {
        const removed = next.length - MAX_VISIBLE_TOASTS
        return next.slice(removed)
      }
      return next
    })
  }, [])

  /*
   * `useCallback` requiere una arrow inline (regla `react-hooks/use-memo`), así que
   * declaramos la implementación con la firma de unión y la casteamos al tipo de la
   * sobrecarga `ShowToast` al exponerla en el contexto.
   */
  const showToastImpl = useCallback(
    (input: ToastInput | string, maybeType?: ToastType) => {
      enqueue(normalize(input, maybeType))
    },
    [enqueue],
  )

  const value = useMemo<ToastContextValue>(
    () => ({ showToast: showToastImpl as ShowToast, dismissToast }),
    [showToastImpl, dismissToast],
  )

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} onItemDismissed={dismissToast} />
    </ToastContext.Provider>
  )
}
