import { useCallback, useEffect, useMemo, useRef } from 'react'
import { trackClick } from '../../api/public'
import { hasConsent } from '../../lib/cookieConsent'
import type { PublicBusiness } from '../../types/api'
import { htmlTemplateSrc } from './htmlTemplateRegistry'
import { publicBusinessToTemplatePayload } from './publicTemplatePayload'

type Props = {
  templateSlug: string
  business: PublicBusiness
  zIndex?: number
}

export default function PublicHtmlTemplateFrame({ templateSlug, business, zIndex }: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  /**
   * Pasamos `parentOrigin` al template como query param para que su listener `message`
   * solo acepte mensajes de este origen (defensa contra postMessage spoofing en el iframe).
   */
  const src = useMemo(() => {
    const base = htmlTemplateSrc(templateSlug)
    const params = new URLSearchParams({
      v: '3',
      embed: '1',
      preview: '1',
      parentOrigin: window.location.origin,
    })
    return `${base}?${params.toString()}`
  }, [templateSlug])

  const pushData = useCallback(() => {
    const win = iframeRef.current?.contentWindow
    if (!win) return
    win.postMessage(
      {
        type: 'lw:onboarding-preview',
        alignToHash: false,
        payload: publicBusinessToTemplatePayload(business),
      },
      // targetOrigin: el iframe sirve desde el mismo origen del SPA (carpeta /templates/ del front),
      // así que el origin del documento del iframe coincide con window.location.origin.
      window.location.origin,
    )
  }, [business])

  useEffect(() => {
    pushData()
  }, [pushData])

  useEffect(() => {
    const subdomain = business.subdomain?.trim()
    if (!subdomain) return

    const handler = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return
      const data = event.data as { type?: string; kind?: string } | null
      if (!data || data.type !== 'lw:track-click') return
      if (data.kind !== 'whatsapp_click' && data.kind !== 'phone_click') return
      if (!hasConsent('analytics')) return
      void trackClick(subdomain, data.kind).catch(() => {})
    }

    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [business.subdomain])

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        margin: 0,
        padding: 0,
        overflow: 'hidden',
        background: '#0a0a0a',
        zIndex,
      }}
    >
      <iframe
        ref={iframeRef}
        title={business.name}
        src={src}
        onLoad={pushData}
        style={{
          border: 'none',
          display: 'block',
          width: '100%',
          height: '100%',
        }}
      />
    </div>
  )
}
