import { useEffect, useRef, useState } from 'react'

import { Btn, Icon } from '../../../components/primitives/primitives'
import { useBreakpoint } from './useBreakpoint'
import './tour.css'

interface WelcomeModalProps {
  onStart: () => void
  onSkip: () => void
  proOnlyMode?: boolean
}

/**
 * Modal de bienvenida del tour.
 *
 * Desktop : centrado, 480px, fondo blanco con sombra-pop, velo verde suave.
 * Móvil   : bottom-sheet anclado abajo con drag handle (sin gesture, sólo
 *           visual). Justificación (board 1): mantiene visible el dashboard
 *           detrás y el CTA queda al alcance del pulgar.
 *
 * Esc cierra con confirmación inline ("¿Saltar el tour? Sí | No"), no
 * de golpe, para evitar pérdidas accidentales.
 */
export function WelcomeModal({ onStart, onSkip, proOnlyMode = false }: WelcomeModalProps) {
  const bp = useBreakpoint()
  const isMobile = bp === 'mobile'

  const rootRef = useRef<HTMLDivElement | null>(null)
  const [askingSkip, setAskingSkip] = useState(false)

  // Foco inicial en el primer botón visible del modal. Se re-aplica al
  // cambiar entre "estado normal" y "askingSkip" porque los botones cambian.
  useEffect(() => {
    const t = window.setTimeout(() => {
      const buttons = rootRef.current?.querySelectorAll<HTMLButtonElement>(
        'button:not([aria-label="Cerrar"])',
      )
      if (buttons && buttons.length > 0) buttons[0].focus()
    }, 50)
    return () => window.clearTimeout(t)
  }, [askingSkip])

  // Esc → pide confirmación; Tab → trap de foco dentro del modal.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault()
        setAskingSkip(true)
        return
      }
      if (e.key === 'Tab' && rootRef.current) {
        const focusables = rootRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        )
        if (focusables.length === 0) return
        const first = focusables[0]
        const last = focusables[focusables.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  const cardClass = `lw-tour-welcome ${isMobile ? 'lw-tour-welcome--sheet' : 'lw-tour-welcome--desktop'}`
  const backdropClass = `lw-tour-backdrop ${isMobile ? 'lw-tour-backdrop--welcome' : ''}`

  return (
    <div className={backdropClass} role="dialog" aria-modal="true" aria-labelledby="lw-tour-welcome-title">
      <div ref={rootRef} className={cardClass}>
        <button
          type="button"
          className="lw-tour-close"
          aria-label="Cerrar"
          onClick={() => setAskingSkip(true)}
        >
          <Icon name="x" size={16} />
        </button>

        <span className="lw-tour-welcome__icon">
          <Icon name="sparkle" size={22} color="var(--lw-accent)" />
        </span>

        <h2 id="lw-tour-welcome-title" className="lw-tour-welcome__title">
          {proOnlyMode ? '¡Bienvenido a Pro!' : 'Te enseño tu panel en 1 minuto'}
        </h2>
        <p className="lw-tour-welcome__desc">
          {proOnlyMode
            ? 'Vamos a ver las funciones que acabas de desbloquear.'
            : 'Mira por encima cada sección para sacarle partido desde el primer día.'}
        </p>

        {askingSkip ? (
          <div className="lw-tour-confirm-skip">
            <span>¿Saltar el tour?</span>
            <button type="button" className="lw-tour-confirm-skip__yes" onClick={onSkip}>
              Sí, saltar
            </button>
            <button
              type="button"
              className="lw-tour-confirm-skip__no"
              onClick={() => setAskingSkip(false)}
            >
              No, seguir
            </button>
          </div>
        ) : (
          <div className="lw-tour-welcome__actions">
            <Btn kind="primary" size="md" iconRight="arrowRight" onClick={onStart}>
              {proOnlyMode ? 'Ver funciones Pro' : 'Empezar tour'}
            </Btn>
            <Btn kind="ghost" size="md" onClick={onSkip}>
              Saltar por ahora
            </Btn>
          </div>
        )}

        <div className="lw-tour-welcome__microcopy">
          <Icon name="refresh" size={12} color="var(--lw-text-3)" />
          Puedes repetirlo desde tu perfil
        </div>
      </div>
    </div>
  )
}
