import { useEffect } from 'react'

import { useTour } from '../tour/TourContext'

/** Detiene el tour Pro cuando el usuario pospone la configuración del subdominio. */
export function SubdomainTourPause() {
  const { stop, state } = useTour()

  useEffect(() => {
    if (state.isOpen || state.showWelcome) {
      stop()
    }
  }, [stop, state.isOpen, state.showWelcome])

  return null
}
