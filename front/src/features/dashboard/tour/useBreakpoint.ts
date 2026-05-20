import { useEffect, useState } from 'react'
import type { Breakpoint } from './types'

/**
 * Breakpoints alineados con dashboard.css:
 *   - mobile  : <= 640px
 *   - tablet  : 641-1080px (sidebar oculto, hay mobilebar con drawer)
 *   - desktop : > 1080px   (sidebar visible)
 *
 * Si tocas estos cortes, actualiza también dashboard.css para mantener
 * coherencia (la regla `lw-dashboard-desktop-sidebar` cambia en 1080px).
 */
function resolve(width: number): Breakpoint {
  if (width <= 640) return 'mobile'
  if (width <= 1080) return 'tablet'
  return 'desktop'
}

export function useBreakpoint(): Breakpoint {
  const [bp, setBp] = useState<Breakpoint>(() => {
    if (typeof window === 'undefined') return 'desktop'
    return resolve(window.innerWidth)
  })

  useEffect(() => {
    if (typeof window === 'undefined') return
    let raf = 0
    const onResize = (): void => {
      // Throttle con rAF para no recalcular en cada pixel.
      if (raf !== 0) return
      raf = window.requestAnimationFrame(() => {
        raf = 0
        setBp(resolve(window.innerWidth))
      })
    }
    window.addEventListener('resize', onResize, { passive: true })
    return () => {
      window.removeEventListener('resize', onResize)
      if (raf !== 0) window.cancelAnimationFrame(raf)
    }
  }, [])

  return bp
}
