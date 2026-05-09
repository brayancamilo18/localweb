import { useEffect, useRef, useState, type CSSProperties } from 'react'
import Icon from '../../primitives/Icon'
import styles from './toast.module.css'
import type { Toast } from './types'

type ToastItemProps = {
  toast: Toast
  /** Lo invoca el item cuando ya terminó la animación de salida y se puede desmontar. */
  onDismissed: (id: number) => void
}

/** Duración de las animaciones CSS de entrada/salida (debe coincidir con `toast.module.css`). */
const EXIT_ANIMATION_MS = 200

type Visual = {
  /** Color sólido (borde lateral + icono) */
  color: string
  /** Color suave de fondo del círculo del icono */
  tint: string
  /** Nombre del icono en `Icon.tsx` */
  icon: string
  /** ARIA: alert para errores; status para success/info */
  role: 'alert' | 'status'
  ariaLive: 'assertive' | 'polite'
}

const VISUAL_BY_TYPE: Record<Toast['type'], Visual> = {
  success: {
    color: '#22C55E',
    tint: 'rgba(34, 197, 94, 0.10)',
    icon: 'check',
    role: 'status',
    ariaLive: 'polite',
  },
  info: {
    color: '#3B82F6',
    tint: 'rgba(59, 130, 246, 0.10)',
    icon: 'info',
    role: 'status',
    ariaLive: 'polite',
  },
  error: {
    color: '#EF4444',
    tint: 'rgba(239, 68, 68, 0.10)',
    icon: 'alert',
    role: 'alert',
    ariaLive: 'assertive',
  },
}

export default function ToastItem({ toast, onDismissed }: ToastItemProps) {
  const visual = VISUAL_BY_TYPE[toast.type]
  const [isExiting, setIsExiting] = useState(false)

  /**
   * Timer de auto-dismiss "pausable":
   *  - `remainingMsRef` guarda lo que falta para auto-cerrar.
   *  - `startedAtRef` es el timestamp en el que arrancó el último ciclo del timer.
   *  - En `pause()` cancelamos el timer y restamos el tiempo transcurrido al remaining,
   *    de modo que `resume()` continúa donde quedó (no reinicia desde cero).
   *
   * `duration === null` significa "sin auto-dismiss" → no creamos timer y los
   * mouseEnter/mouseLeave son no-ops.
   */
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const remainingMsRef = useRef<number | null>(toast.duration)
  const startedAtRef = useRef<number>(0)
  const isExitingRef = useRef(false)
  const exitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  /**
   * Una vez fuera, espera a que termine la animación de salida (200ms) y avisa al provider
   * para que retire el toast del estado. El uso de un ref para `isExiting` evita disparar
   * dos veces la salida si el usuario hace doble click en la X o el timer expira a la vez.
   */
  function startExit(): void {
    if (isExitingRef.current) return
    isExitingRef.current = true
    setIsExiting(true)
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    exitTimerRef.current = setTimeout(() => {
      onDismissed(toast.id)
    }, EXIT_ANIMATION_MS)
  }

  /** Arranca un nuevo ciclo de timer con `remainingMsRef`. No-op si no hay duration o ya está saliendo. */
  function resume(): void {
    if (isExitingRef.current) return
    const remaining = remainingMsRef.current
    if (remaining === null || remaining <= 0) return
    if (timerRef.current !== null) clearTimeout(timerRef.current)
    startedAtRef.current = Date.now()
    timerRef.current = setTimeout(() => {
      startExit()
    }, remaining)
  }

  function pause(): void {
    if (isExitingRef.current) return
    if (timerRef.current === null) return
    clearTimeout(timerRef.current)
    timerRef.current = null
    const elapsed = Date.now() - startedAtRef.current
    const remaining = remainingMsRef.current
    if (remaining !== null) {
      remainingMsRef.current = Math.max(0, remaining - elapsed)
    }
  }

  useEffect(() => {
    resume()
    return () => {
      if (timerRef.current !== null) clearTimeout(timerRef.current)
      if (exitTimerRef.current !== null) clearTimeout(exitTimerRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleClose(): void {
    startExit()
  }

  function handleAction(): void {
    if (toast.action) {
      try {
        toast.action.onClick()
      } finally {
        startExit()
      }
    }
  }

  /* CSS vars dinámicas (color/tint del tipo) inyectadas en el root del item. */
  const dynamicVars = {
    ['--toast-color' as string]: visual.color,
    ['--toast-tint' as string]: visual.tint,
  } as CSSProperties

  return (
    <div
      role={visual.role}
      aria-live={visual.ariaLive}
      aria-atomic="true"
      className={`${styles.toast} ${isExiting ? styles.toastExiting : ''}`.trim()}
      style={dynamicVars}
      onMouseEnter={pause}
      onMouseLeave={resume}
      onFocus={pause}
      onBlur={resume}
      data-toast-type={toast.type}
    >
      <span className={styles.iconWrap} aria-hidden="true">
        <Icon name={visual.icon} size={20} stroke={2} color={visual.color} />
      </span>

      <div className={styles.body}>
        <p className={styles.title}>{toast.title}</p>
        {toast.description ? <p className={styles.description}>{toast.description}</p> : null}
        {toast.action ? (
          <button type="button" className={styles.action} onClick={handleAction}>
            {toast.action.label}
            <span className={styles.actionArrow} aria-hidden="true">
              →
            </span>
          </button>
        ) : null}
      </div>

      <button
        type="button"
        className={styles.close}
        onClick={handleClose}
        aria-label="Cerrar notificación"
      >
        <Icon name="x" size={16} stroke={2} />
      </button>
    </div>
  )
}
