import { useEffect } from 'react'

import { useTour } from './TourContext'

/**
 * Arranca el tour principal al entrar al dashboard (sin WelcomeModal).
 * El mini-tour Pro (proOnlyMode) sigue mostrando WelcomeModal desde TourRunner.
 */
export function TourAutoStart() {
  const { state, start, proOnlyMode } = useTour()

  useEffect(() => {
    if (proOnlyMode) return
    if (state.showWelcome && !state.isOpen && !state.isFinished) {
      const timer = window.setTimeout(() => start(), 50)
      return () => window.clearTimeout(timer)
    }
  }, [proOnlyMode, state.showWelcome, state.isOpen, state.isFinished, start])

  return null
}
