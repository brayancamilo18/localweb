import { useCallback, useEffect, useState } from 'react'
import {
  getConsent,
  resetConsent as resetStoredConsent,
  type CookieConsentData,
  onConsentChange,
} from '../lib/cookieConsent'

export function useCookieConsent() {
  const [consent, setConsent] = useState<CookieConsentData | null>(() => getConsent())

  useEffect(() => onConsentChange(setConsent), [])

  const resetConsent = useCallback(() => {
    resetStoredConsent()
  }, [])

  return { consent, resetConsent }
}
