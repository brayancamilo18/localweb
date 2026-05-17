import { useRef, type RefObject } from 'react'
import type { Template } from '../../../types/api'
import type { Step1PreviewVariant } from '../wizard'
import LazyTemplateIframe from './LazyTemplateIframe'
import TemplateThumbPlaceholder from './TemplateThumbPlaceholder'
import { PooledTemplateThumbHost, useTemplateIframePool } from './TemplateIframePool'
import { TEMPLATE_THUMB_ASPECT_PERCENT } from './constants'

export type TemplateCardPreviewProps = {
  variant: Step1PreviewVariant
  template: Pick<Template, 'name' | 'primary_color' | 'thumbnail_url'>
}

function StaticTemplateThumbnail({ url, name }: { url: string; name: string }) {
  return (
    <div className="lw-template-thumb-wrap lw-template-thumb-wrap--static">
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: 0,
          paddingBottom: `${TEMPLATE_THUMB_ASPECT_PERCENT}%`,
          overflow: 'hidden',
          background: 'var(--lw-surface)',
        }}
      >
        <img
          src={url}
          alt=""
          loading="lazy"
          decoding="async"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'top center',
            display: 'block',
          }}
        />
        <span className="lw-sr-only">{name}</span>
      </div>
    </div>
  )
}

function TemplateThumbHost({ hostRef }: { hostRef: RefObject<HTMLDivElement | null> }) {
  return (
    <div
      ref={hostRef}
      className="lw-template-thumb-host"
      style={{
        position: 'relative',
        width: '100%',
        height: 0,
        paddingBottom: `${TEMPLATE_THUMB_ASPECT_PERCENT}%`,
        overflow: 'hidden',
        background: '#fff',
      }}
    />
  )
}

function PooledTemplateCardPreview({ variant, template }: TemplateCardPreviewProps) {
  const hostRef = useRef<HTMLDivElement>(null)
  const { requestLoad, isLoaded } = useTemplateIframePool()
  const alreadyInPool = isLoaded(variant)

  const host = (
    <>
      <TemplateThumbHost hostRef={hostRef} />
      <PooledTemplateThumbHost variant={variant} hostRef={hostRef} />
    </>
  )

  if (alreadyInPool) {
    return <div className="lw-template-thumb-wrap">{host}</div>
  }

  return (
    <LazyTemplateIframe
      className="lw-template-thumb-wrap"
      placeholder={
        <TemplateThumbPlaceholder name={template.name} primaryColor={template.primary_color} />
      }
      onFirstVisible={() => requestLoad(variant)}
    >
      {host}
    </LazyTemplateIframe>
  )
}

/**
 * Vista previa de plantilla en el grid del paso 1:
 * - `thumbnail_url` → imagen estática (sin iframe)
 * - si no → iframe lazy + pool persistente entre páginas
 */
export default function TemplateCardPreview({ variant, template }: TemplateCardPreviewProps) {
  const thumbUrl = template.thumbnail_url?.trim()
  if (thumbUrl) {
    return <StaticTemplateThumbnail url={thumbUrl} name={template.name} />
  }
  return <PooledTemplateCardPreview variant={variant} template={template} />
}
