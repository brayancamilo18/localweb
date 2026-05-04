import { useCallback, useEffect, useRef } from 'react'
import type { PublicBusiness } from '../../types/api'
import { publicBusinessToTemplatePayload } from './publicTemplatePayload'

const TEMPLATE_SRC: Record<string, string> = {
  'noir-elite': '/templates/noir-elite.html',
  'bloom-studio': '/templates/bloom-studio.html',
}

type Props = {
  templateSlug: string
  business: PublicBusiness
}

export default function PublicHtmlTemplateFrame({ templateSlug, business }: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const src = TEMPLATE_SRC[templateSlug] ?? TEMPLATE_SRC['noir-elite']

  const pushData = useCallback(() => {
    const win = iframeRef.current?.contentWindow
    if (!win) return
    win.postMessage(
      {
        type: 'lw:onboarding-preview',
        alignToHash: false,
        payload: publicBusinessToTemplatePayload(business),
      },
      '*',
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
