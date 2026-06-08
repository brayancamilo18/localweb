import { useState } from 'react'
import { templateThumbAspectPadding } from './templateThumb'

type Props = {
  /** slug de la plantilla; debe existir /templates/thumbs/{slug}.webp */
  slug: string
  /** color de marca usado como fondo/placeholder mientras carga la imagen */
  color?: string
  /** miniatura de alto fijo (148px) usada en el grid móvil del onboarding */
  compact?: boolean
  className?: string
}

/**
 * Miniatura de plantilla con captura estática del hero (sin iframe).
 * Evita el crash de memoria en móvil al renderizar muchas previews a la vez.
 */
export default function TemplateThumbImage({ slug, color, compact = false, className }: Props) {
  const [loaded, setLoaded] = useState(false)
  const fallback = color || '#FAFAFA'
  const bg = `linear-gradient(160deg, ${fallback} 0%, color-mix(in srgb, ${fallback} 55%, #1a1a1a) 100%)`

  const img = (
    <img
      src={`/templates/thumbs/${slug}.webp`}
      alt=""
      loading="lazy"
      decoding="async"
      onLoad={() => setLoaded(true)}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        objectPosition: 'top center',
        opacity: loaded ? 1 : 0,
        transition: 'opacity 200ms ease-out',
      }}
    />
  )

  if (compact) {
    return (
      <div
        className={['lw-template-thumb-wrap', 'lw-template-thumb-wrap--compact', className].filter(Boolean).join(' ')}
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '100%',
          minWidth: 0,
          height: 148,
          overflow: 'hidden',
          background: bg,
          contain: 'layout paint',
        }}
      >
        {img}
      </div>
    )
  }

  return (
    <div
      className={['lw-template-thumb-wrap', className].filter(Boolean).join(' ')}
      style={{
        position: 'relative',
        width: '100%',
        maxWidth: '100%',
        minWidth: 0,
        overflow: 'hidden',
        contain: 'layout paint',
      }}
    >
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: 0,
          paddingBottom: templateThumbAspectPadding(),
          background: bg,
        }}
      >
        {img}
      </div>
    </div>
  )
}
