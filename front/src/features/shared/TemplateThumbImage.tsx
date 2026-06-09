import { useEffect, useState } from 'react'
import { templateThumbAspectPadding } from './templateThumb'

/** Versión del set de webp commiteados; súbela al regenerar capturas para romper caché del navegador. */
const STATIC_THUMB_VERSION = '2'

type Props = {
  /** slug de la plantilla; usado como fallback a /templates/thumbs/{slug}.webp si no hay thumbnailUrl */
  slug: string
  /** URL de la captura en R2 (templates.thumbnail_url). Tiene prioridad sobre el webp commiteado. */
  thumbnailUrl?: string | null
  /** color de marca usado como fondo/placeholder mientras carga la imagen */
  color?: string
  /** miniatura de alto fijo (148px) usada en el grid móvil del onboarding */
  compact?: boolean
  className?: string
}

function staticThumbSrc(slug: string): string {
  return `/templates/thumbs/${slug}.webp?v=${STATIC_THUMB_VERSION}`
}

/**
 * Miniatura de plantilla con captura estática del hero (sin iframe).
 * Evita el crash de memoria en móvil al renderizar muchas previews a la vez.
 *
 * Fuente de la imagen: `thumbnailUrl` (R2, vía API) si existe; si no, el webp
 * commiteado en /templates/thumbs/{slug}.webp como respaldo durante la transición.
 * Si la URL de R2 falla, cae al webp estático. Si ninguna carga, queda el gradiente.
 */
export default function TemplateThumbImage({ slug, thumbnailUrl, color, compact = false, className }: Props) {
  const staticSrc = staticThumbSrc(slug)
  const [src, setSrc] = useState(thumbnailUrl || staticSrc)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    setLoaded(false)
    setSrc(thumbnailUrl || staticThumbSrc(slug))
  }, [thumbnailUrl, slug])

  const fallback = color || '#FAFAFA'
  const bg = `linear-gradient(160deg, ${fallback} 0%, color-mix(in srgb, ${fallback} 55%, #1a1a1a) 100%)`

  const handleError = () => {
    if (src !== staticSrc) {
      setLoaded(false)
      setSrc(staticSrc)
    }
  }

  const img = (
    <img
      src={src}
      alt=""
      loading="lazy"
      decoding="async"
      onLoad={() => setLoaded(true)}
      onError={handleError}
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
