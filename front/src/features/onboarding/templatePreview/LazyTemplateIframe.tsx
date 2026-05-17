import { useEffect, useRef, useState, type ReactNode } from 'react'

export type LazyTemplateIframeProps = {
  children: ReactNode
  placeholder: ReactNode
  /** Se llama una sola vez la primera vez que el contenedor entra en el viewport. */
  onFirstVisible?: () => void
  /** Margen de pre-carga del IntersectionObserver (p. ej. "200px"). */
  rootMargin?: string
  className?: string
  /** Si el observer no dispara, forzar montaje tras este tiempo (ms). */
  visibilityFallbackMs?: number
}

/**
 * Monta `children` solo tras haber sido visible al menos una vez (con pre-carga).
 * No desmonta al salir del viewport para evitar parpadeos al hacer scroll.
 */
export default function LazyTemplateIframe({
  children,
  placeholder,
  onFirstVisible,
  rootMargin = '200px',
  className,
  visibilityFallbackMs = 1500,
}: LazyTemplateIframeProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const [hasBeenVisible, setHasBeenVisible] = useState(false)
  const notifiedRef = useRef(false)

  useEffect(() => {
    const el = rootRef.current
    if (!el || hasBeenVisible) return

    let cancelled = false

    const markVisible = () => {
      if (cancelled) return
      setHasBeenVisible(true)
      if (!notifiedRef.current) {
        notifiedRef.current = true
        onFirstVisible?.()
      }
    }

    const safetyTimer = setTimeout(markVisible, visibilityFallbackMs)

    if (typeof IntersectionObserver === 'undefined') {
      clearTimeout(safetyTimer)
      markVisible()
      return () => {
        cancelled = true
      }
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return
        clearTimeout(safetyTimer)
        markVisible()
      },
      { rootMargin, threshold: 0.01 },
    )

    observer.observe(el)

    return () => {
      cancelled = true
      clearTimeout(safetyTimer)
      observer.disconnect()
    }
  }, [hasBeenVisible, onFirstVisible, rootMargin, visibilityFallbackMs])

  return (
    <div ref={rootRef} className={className ?? 'lw-lazy-template-iframe'}>
      {hasBeenVisible ? children : placeholder}
    </div>
  )
}
