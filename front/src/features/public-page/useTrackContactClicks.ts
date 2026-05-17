import { useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { trackClick } from '../../api/public'
import { hasConsent } from '../../lib/cookieConsent'

/**
 * Fire-and-forget tracking de clicks en WhatsApp / teléfono en páginas públicas React.
 * Requiere consentimiento de cookies «analytics» (Art. 6.1.a RGPD).
 *
 * Las visitas de página (EventType::Visit) se registran en servidor sin bloqueo en front:
 * analytics propias con IP hasheada, base legal interés legítimo — ver RegisterPageVisit.
 *
 * @param explicitSubdomain — p. ej. business.subdomain en modo tenant (sin ruta /:subdomain)
 */
export function useTrackContactClicks(explicitSubdomain?: string) {
  const { subdomain: routeSubdomain } = useParams<{ subdomain?: string }>()
  const subdomain = (explicitSubdomain ?? routeSubdomain ?? '').trim()

  const onWhatsAppClick = useCallback(() => {
    if (!subdomain || !hasConsent('analytics')) return
    void trackClick(subdomain, 'whatsapp_click').catch(() => {})
  }, [subdomain])

  const onPhoneClick = useCallback(() => {
    if (!subdomain || !hasConsent('analytics')) return
    void trackClick(subdomain, 'phone_click').catch(() => {})
  }, [subdomain])

  return { onWhatsAppClick, onPhoneClick }
}
