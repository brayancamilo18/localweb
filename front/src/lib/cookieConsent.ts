export const CONSENT_KEY = 'onez_cookie_consent'
export const CONSENT_VERSION = 1

export type CookieConsentData = {
  version: number
  necessary: true
  analytics: boolean
  marketing: boolean
  preferences: boolean
  updatedAt: string
}

/** Lee el consentimiento del localStorage. null = no hay consentimiento todavía. */
export function getConsent(): CookieConsentData | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(CONSENT_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as CookieConsentData
    if (parsed?.version !== CONSENT_VERSION) return null
    return parsed
  } catch {
    return null
  }
}

export function writeConsent(consent: CookieConsentData): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(CONSENT_KEY, JSON.stringify(consent))
    window.dispatchEvent(new CustomEvent('onez:cookie-consent', { detail: consent }))
  } catch {
    /* ignore */
  }
}

/** Retira el consentimiento y notifica al banner para volver a mostrarse (RGPD art. 7.3). */
export function resetConsent(): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(CONSENT_KEY)
    window.dispatchEvent(new CustomEvent('onez:cookie-consent', { detail: null }))
  } catch {
    /* ignore */
  }
}

/** ¿Ha dado el usuario consentimiento explícito para esta categoría? */
export function hasConsent(
  category: keyof Omit<CookieConsentData, 'version' | 'updatedAt'>,
): boolean {
  const consent = getConsent()
  if (!consent) return false
  if (category === 'necessary') return true
  return Boolean(consent[category])
}

/** Suscribirse a cambios de consentimiento (útil para cargar scripts lazy). */
export function onConsentChange(cb: (consent: CookieConsentData | null) => void): () => void {
  if (typeof window === 'undefined') return () => {}

  const handler = (e: Event) => {
    const detail = (e as CustomEvent<CookieConsentData | null>).detail
    cb(detail ?? getConsent())
  }

  window.addEventListener('onez:cookie-consent', handler as EventListener)
  return () => window.removeEventListener('onez:cookie-consent', handler as EventListener)
}
