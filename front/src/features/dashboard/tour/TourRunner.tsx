import { useCallback, useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import { Icon } from '../../../components/primitives/primitives'
import { WelcomeModal } from './WelcomeModal'
import { TourOverlay } from './TourOverlay'
import { TourTooltip } from './TourTooltip'
import { FinishModal } from './FinishModal'
import { TOUR_STEPS } from './tourSteps'
import type { TourStep } from './types'

function isStepVisible(step: TourStep, isPro: boolean, proOnlyMode: boolean): boolean {
  return proOnlyMode
    ? Boolean(step.proOnly) || Boolean(step.proUpgrade)
    : !step.proOnly || isPro
}

function findNextVisibleIndex(from: number, isPro: boolean, proOnlyMode: boolean): number {
  for (let i = from; i < TOUR_STEPS.length; i += 1) {
    if (isStepVisible(TOUR_STEPS[i], isPro, proOnlyMode)) return i
  }
  return -1
}
import { useTour } from './TourContext'
import { findAnchorElement, useTourAnchor } from './useTourAnchor'
import { useBreakpoint } from './useBreakpoint'
import type { TourOverlayVariant } from './types'
import './tour.css'

interface TourRunnerProps {
  /** Variante de overlay. Por defecto la recomendada en el board: 'soft-veil'. */
  overlayVariant?: TourOverlayVariant
  /** Ruta a la que va el CTA primario del FinishModal. */
  editRoute?: string
  /** Si está logueado como Pro (decide saltos en pasos proOnly). */
  isPro?: boolean
  /** Callback opcional cuando se completa el tour (para llamar a backend). */
  onComplete?: () => void
}

const MOBILE_INTRO_KEY = 'lw_tour_mobile_intro_seen'

export function TourRunner({
  overlayVariant = 'soft-veil',
  editRoute = '/dashboard/editor',
  isPro = false,
  onComplete,
}: TourRunnerProps) {
  const { state, storageKeys, proOnlyMode, start, stop, next, prev, finish, dismissFinish } = useTour()
  const navigate = useNavigate()
  const location = useLocation()
  const bp = useBreakpoint()

  const [showMobileIntro, setShowMobileIntro] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    return window.localStorage.getItem(MOBILE_INTRO_KEY) !== 'true'
  })

  // Paso 0 móvil: tooltip anclado al botón "Menú". Solo aparece en móvil,
  // antes del primer paso real, y una vez. Lo controlamos por separado del
  // resto del tour para que los índices del array TOUR_STEPS sigan
  // mapeando 1:1 con los items del sidebar.
  const inIntro = showMobileIntro && bp === 'mobile' && state.isOpen && state.currentStepIndex === 0

  const step =
    state.currentStepIndex >= 0 && state.currentStepIndex < TOUR_STEPS.length
      ? TOUR_STEPS[state.currentStepIndex]
      : null

  // Sincronizamos la URL con el step actual (excepto en intro).
  useEffect(() => {
    if (!state.isOpen || step === null || inIntro) return
    if (location.pathname !== step.route) {
      navigate(step.route, { replace: true })
    }
  }, [state.isOpen, step, location.pathname, navigate, inIntro])

  // Selector del ancla según breakpoint y modo intro.
  const selector: string | null = (() => {
    if (!state.isOpen || step === null) return null
    if (inIntro) return '[data-tour-mobile="menu-button"]'
    if (bp === 'mobile' || bp === 'tablet') {
      return step.anchorSelectorMobile ?? step.anchorSelector
    }
    return step.anchorSelector
  })()

  const { rect, ready } = useTourAnchor(selector)

  // Sube el ítem del nav por encima del velo para que solo ese tab quede legible.
  useEffect(() => {
    if (!state.isOpen || selector === null) return
    const el = findAnchorElement(selector)
    if (el === null) return
    el.classList.add('lw-tour-target-active')
    return () => {
      el.classList.remove('lw-tour-target-active')
    }
  }, [state.isOpen, selector, step?.id])

  // prefers-reduced-motion → quitamos animaciones globalmente.
  useEffect(() => {
    if (typeof window === 'undefined') return
    const root = document.documentElement
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)')
    const sync = (): void => {
      root.classList.toggle('lw-tour-reduced-motion', mql.matches)
    }
    sync()
    mql.addEventListener('change', sync)
    return () => mql.removeEventListener('change', sync)
  }, [])

  // FAB "Reanudar tour" cuando hay progreso pero el tour está cerrado.
  const [hasProgress, setHasProgress] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    return (
      window.localStorage.getItem(storageKeys.progress) !== null &&
      window.localStorage.getItem(storageKeys.completed) !== 'true'
    )
  })
  useEffect(() => {
    if (!state.isOpen && !state.isFinished) {
      setHasProgress(window.localStorage.getItem(storageKeys.progress) !== null)
    } else {
      setHasProgress(false)
    }
  }, [state.isOpen, state.isFinished, storageKeys.progress, storageKeys.completed])

  const handleNextFromIntro = useCallback((): void => {
    try {
      window.localStorage.setItem(MOBILE_INTRO_KEY, 'true')
    } catch {
      /* no-op */
    }
    setShowMobileIntro(false)
  }, [])

  const handleFinishPrimary = useCallback((): void => {
    if (onComplete) {
      try {
        onComplete()
      } catch {
        /* fire-and-forget: la UX no debe bloquearse si el backend falla */
      }
    }
    dismissFinish()
    navigate(proOnlyMode ? '/dashboard' : editRoute)
  }, [dismissFinish, navigate, editRoute, onComplete, proOnlyMode])

  const handleFinishSecondary = useCallback((): void => {
    if (onComplete) {
      try {
        onComplete()
      } catch {
        /* idem */
      }
    }
    dismissFinish()
    navigate('/dashboard')
  }, [dismissFinish, navigate, onComplete])

  const handleFinishLast = useCallback((): void => {
    if (onComplete) {
      try {
        onComplete()
      } catch {
        /* fire-and-forget: la UX no debe bloquearse si el backend falla */
      }
    }
    finish()
  }, [finish, onComplete])

  // ---------- render ----------

  // Caso A: tour cerrado y no terminado.
  if (!state.isOpen && !state.isFinished) {
    // Welcome modal: cuando aún hay que mostrarlo Y no hay progreso
    // (el TourContext ya pone showWelcome=false si hay progreso resumible,
    // pero por seguridad lo verificamos aquí también).
    if (proOnlyMode && state.showWelcome && state.currentStepIndex === -1) {
      return (
        <WelcomeModal proOnlyMode onStart={() => start()} onSkip={() => stop()} />
      )
    }
    // Si hay progreso guardado y el welcome ya se descartó, mostramos FAB.
    if (hasProgress) {
      return <ResumeFab onClick={() => start()} />
    }
    return null
  }

  // Caso B: tour terminado → FinishModal hasta que el usuario interactúe.
  if (state.isFinished && state.currentStepIndex === -1 && !state.isDismissed) {
    return (
      <FinishModal
        proOnlyMode={proOnlyMode}
        onPrimary={handleFinishPrimary}
        onSecondary={proOnlyMode ? undefined : handleFinishSecondary}
      />
    )
  }

  // Caso C: tour abierto pero el ancla aún no está montada → no renderizamos
  // todavía (evita flicker del tooltip en posición incorrecta).
  if (!state.isOpen) return null
  if (!ready) return null
  if (step === null) return null

  // En el último paso, "Siguiente" se llama "Terminar" y dispara finish(),
  // lo que pone state.isFinished=true → en el siguiente render mostramos
  // FinishModal. NO llamamos directamente a handleFinishPrimary para que
  // el usuario vea la pantalla de cierre con su CTA explícito.
  const isLast = findNextVisibleIndex(state.currentStepIndex + 1, isPro, proOnlyMode) === -1
  const handleNext = inIntro ? handleNextFromIntro : isLast ? handleFinishLast : next
  const isLocked = Boolean(step.proOnly) && !isPro
  const visibleTotal = TOUR_STEPS.filter((s) => isStepVisible(s, isPro, proOnlyMode)).length
  const visibleIndex = TOUR_STEPS.slice(0, state.currentStepIndex + 1).filter((s) =>
    isStepVisible(s, isPro, proOnlyMode),
  ).length
  const firstVisibleIndex = findNextVisibleIndex(0, isPro, proOnlyMode)

  return (
    <>
      <TourOverlay variant={overlayVariant} rect={rect} />
      <TourTooltip
        step={step}
        index={visibleIndex}
        total={visibleTotal}
        rect={rect}
        onNext={handleNext}
        onPrev={prev}
        onSkip={stop}
        isFirst={state.currentStepIndex === firstVisibleIndex}
        isLast={isLast}
        isLocked={isLocked}
        isPro={isPro}
        proOnlyMode={proOnlyMode}
      />
    </>
  )
}

interface ResumeFabProps {
  onClick: () => void
}
function ResumeFab({ onClick }: ResumeFabProps) {
  return (
    <button type="button" className="lw-tour-fab" onClick={onClick} aria-label="Reanudar tour">
      <span className="lw-tour-fab__icon">
        <Icon name="arrowRight" size={18} color="#fff" />
      </span>
      <span className="lw-tour-fab__label">
        <span className="lw-tour-fab__title">Reanudar tour</span>
      </span>
    </button>
  )
}
