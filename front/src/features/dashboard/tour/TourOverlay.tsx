import { useEffect, useRef } from 'react'
import type { AnchorRect, TourOverlayVariant } from './types'
import './tour.css'

interface TourOverlayProps {
  variant?: TourOverlayVariant
  rect: AnchorRect | null
  /** Radio del spotlight. Por defecto 12. */
  spotlightRadius?: number
  /** Padding añadido alrededor del rect del ancla. */
  spotlightPadding?: number
}

/**
 * Capa que oscurece/realza el fondo y (opcionalmente) destaca el ancla.
 *
 * No captura clicks (`pointerEvents: none` en .lw-tour-overlay): cerrar
 * tocando fuera es contraproducente con un tour de 9 pasos y, en móvil,
 * confunde por la cercanía del bottom-sheet.
 *
 * Variantes:
 *   - spotlight → velo oscuro con agujero rectangular usando `box-shadow`
 *   - soft-veil → agujero recortado verde suave + halo accent (RECOMENDADO)
 *   - attenuate → sin velo; aplica clase al shell del dashboard para bajar
 *                 opacidad al 0.5. NO toca document.body para evitar el
 *                 selector frágil del board original (body > *:not(...))
 *                 que afectaba a #root entero.
 */
export function TourOverlay({
  variant = 'soft-veil',
  rect,
  spotlightRadius = 12,
  spotlightPadding = 6,
}: TourOverlayProps) {
  const ref = useRef<HTMLDivElement | null>(null)

  // Para 'attenuate' añadimos una clase al shell del dashboard, no al body.
  // El selector vive en tour.css.
  useEffect(() => {
    if (variant !== 'attenuate') return
    const shell = document.querySelector('.lw-dashboard-shell')
    if (!shell) return
    shell.classList.add('lw-tour-attenuate-shell')
    return () => {
      shell.classList.remove('lw-tour-attenuate-shell')
    }
  }, [variant])

  const hasRect = rect !== null

  if (variant === 'spotlight') {
    return (
      <div ref={ref} className="lw-tour-overlay lw-tour-overlay--spotlight" aria-hidden>
        {hasRect && rect !== null ? (
          <div
            className="lw-tour-spotlight"
            style={{
              top: rect.top - spotlightPadding,
              left: rect.left - spotlightPadding,
              width: rect.width + spotlightPadding * 2,
              height: rect.height + spotlightPadding * 2,
              borderRadius: spotlightRadius,
            }}
          />
        ) : (
          <div className="lw-tour-flatveil lw-tour-flatveil--dark" />
        )}
      </div>
    )
  }

  if (variant === 'attenuate') {
    return (
      <div ref={ref} className="lw-tour-overlay lw-tour-overlay--attenuate" aria-hidden>
        {hasRect && rect !== null && (
          <div
            className="lw-tour-ring lw-tour-ring--pulse"
            style={{
              top: rect.top - spotlightPadding,
              left: rect.left - spotlightPadding,
              width: rect.width + spotlightPadding * 2,
              height: rect.height + spotlightPadding * 2,
              borderRadius: spotlightRadius,
            }}
          />
        )}
      </div>
    )
  }

  // soft-veil: agujero recortado verde suave (spotlight); fallback a velo plano sin rect.
  return (
    <div ref={ref} className="lw-tour-overlay lw-tour-overlay--soft" aria-hidden>
      {hasRect && rect !== null ? (
        <>
          <div
            className="lw-tour-spotlight lw-tour-spotlight--soft"
            style={{
              top: rect.top - spotlightPadding,
              left: rect.left - spotlightPadding,
              width: rect.width + spotlightPadding * 2,
              height: rect.height + spotlightPadding * 2,
              borderRadius: spotlightRadius,
            }}
          />
          <div
            className="lw-tour-ring lw-tour-ring--glow"
            style={{
              top: rect.top - spotlightPadding,
              left: rect.left - spotlightPadding,
              width: rect.width + spotlightPadding * 2,
              height: rect.height + spotlightPadding * 2,
              borderRadius: spotlightRadius,
            }}
          />
        </>
      ) : (
        <div className="lw-tour-flatveil lw-tour-flatveil--soft" />
      )}
    </div>
  )
}
