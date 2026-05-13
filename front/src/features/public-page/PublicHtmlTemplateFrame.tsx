import { useCallback, useEffect, useMemo, useRef } from 'react'
import type { PublicBusiness } from '../../types/api'
import { publicBusinessToTemplatePayload } from './publicTemplatePayload'

const TEMPLATE_SRC: Record<string, string> = {
  'noir-elite': '/templates/noir-elite.html',
  'bloom-studio': '/templates/bloom-studio.html',
  'urban-bold': '/templates/urban-bold.html',
  'coastal-calm': '/templates/coastal-calm.html',
  'craft-pro': '/templates/craft-pro.html',
  'tavola-warm': '/templates/tavola-warm.html',
  'tech-sleek': '/templates/tech-sleek.html',
  'trust-clinic': '/templates/trust-clinic.html',
}

type Props = {
  templateSlug: string
  business: PublicBusiness
}

export default function PublicHtmlTemplateFrame({ templateSlug, business }: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  /**
   * Pasamos `parentOrigin` al template como query param para que su listener `message`
   * solo acepte mensajes de este origen (defensa contra postMessage spoofing en el iframe).
   */
  const src = useMemo(() => {
    const base = TEMPLATE_SRC[templateSlug] ?? TEMPLATE_SRC['urban-bold']
    const sep = base.includes('?') ? '&' : '?'
    return `${base}${sep}parentOrigin=${encodeURIComponent(window.location.origin)}`
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

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        margin: 0,
        padding: 0,
        overflow: 'hidden',
        background: '#0a0a0a',
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
