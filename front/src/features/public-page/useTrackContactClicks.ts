import { useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { trackClick } from '../../api/public'

/**
 * Fire-and-forget tracking de clicks en WhatsApp / teléfono en páginas públicas React.
 * @param explicitSubdomain — p. ej. business.subdomain en modo tenant (sin ruta /:subdomain)
 */
export function useTrackContactClicks(explicitSubdomain?: string) {
  const { subdomain: routeSubdomain } = useParams<{ subdomain?: string }>()
  const subdomain = (explicitSubdomain ?? routeSubdomain ?? '').trim()

  const onWhatsAppClick = useCallback(() => {
    if (!subdomain) return
    void trackClick(subdomain, 'whatsapp_click').catch(() => {})
  }, [subdomain])

  const onPhoneClick = useCallback(() => {
    if (!subdomain) return
    void trackClick(subdomain, 'phone_click').catch(() => {})
  }, [subdomain])

  return { onWhatsAppClick, onPhoneClick }
}
