import { getConsent, onConsentChange, type CookieConsentData } from './cookieConsent'

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
  }
}

/** Placeholder hasta configurar VITE_GA_MEASUREMENT_ID en .env */
function loadGoogleAnalytics(measurementId: string) {
  if (document.getElementById('ga-script')) return
  const script = document.createElement('script')
  script.id = 'ga-script'
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`
  document.head.appendChild(script)
  window.gtag =
    window.gtag ||
    function gtag(...args: unknown[]) {
      window.dataLayer = window.dataLayer || []
      window.dataLayer.push(args)
    }
  window.gtag('js', new Date())
  window.gtag('config', measurementId, { anonymize_ip: true })
}

function unloadGoogleAnalytics() {
  document.getElementById('ga-script')?.remove()
  delete window.gtag
  window.dataLayer = []
}

function applyAnalyticsFromConsent(consent: CookieConsentData | null) {
  const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined

  if (consent?.analytics) {
    if (measurementId) {
      loadGoogleAnalytics(measurementId)
    } else {
      console.log('[Analytics] Consentimiento analytics: activado')
    }
  } else {
    unloadGoogleAnalytics()
  }
}

/**
 * Inicializa scripts de terceros según consentimiento. Llamar una sola vez desde main.tsx.
 * Reacciona a cambios en tiempo real vía onConsentChange.
 */
export function initAnalytics(): void {
  applyAnalyticsFromConsent(getConsent())
  onConsentChange(applyAnalyticsFromConsent)
}
