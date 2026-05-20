import { useEffect, useRef } from 'react'

import { Btn, Icon } from '../../../components/primitives/primitives'
import { useBreakpoint } from './useBreakpoint'
import './tour.css'

interface FinishModalProps {
  onPrimary: () => void
  onSecondary?: () => void
  proOnlyMode?: boolean
}

/**
 * Modal de cierre del tour.
 *
 * Aparece tras el último paso. CTA primario lleva al editor (donde el
 * usuario suele empezar a personalizar de verdad). Secundario vuelve
 * al resumen de Mi página.
 *
 * Animación del checkmark: bounce con cubic-bezier(.34, 1.56, .64, 1).
 */
export function FinishModal({ onPrimary, onSecondary, proOnlyMode = false }: FinishModalProps) {
  const bp = useBreakpoint()
  const isMobile = bp === 'mobile'
  const rootRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const t = window.setTimeout(() => {
      const btn = rootRef.current?.querySelector<HTMLButtonElement>('button:not([aria-label="Cerrar"])')
      btn?.focus()
    }, 50)
    return () => window.clearTimeout(t)
  }, [])

  const cardClass = `lw-tour-welcome ${isMobile ? 'lw-tour-welcome--sheet' : 'lw-tour-welcome--desktop'}`
  const backdropClass = `lw-tour-backdrop ${isMobile ? 'lw-tour-backdrop--welcome' : ''}`

  return (
    <div className={backdropClass} role="dialog" aria-modal="true" aria-labelledby="lw-tour-finish-title">
      <div ref={rootRef} className={cardClass}>
        <div className="lw-tour-checkmark" aria-hidden>
          <Icon name="check" size={32} color="#fff" />
        </div>

        <h2 id="lw-tour-finish-title" className="lw-tour-welcome__title" style={{ marginTop: 20 }}>
          {proOnlyMode ? '¡Listo! Ya conoces las funciones Pro' : '¡Listo! Ya conoces tu panel'}
        </h2>
        {!proOnlyMode && (
          <p className="lw-tour-welcome__desc">
            Ahora puedes empezar a personalizar tu página.
          </p>
        )}

        <div className="lw-tour-welcome__actions">
          <Btn kind="primary" size="md" iconRight="arrowRight" onClick={onPrimary}>
            {proOnlyMode ? 'Volver al panel' : 'Empezar a editar mi página'}
          </Btn>
          {!proOnlyMode && onSecondary !== undefined && (
            <Btn kind="ghost" size="md" onClick={onSecondary}>
              Volver al resumen
            </Btn>
          )}
        </div>
      </div>
    </div>
  )
}
