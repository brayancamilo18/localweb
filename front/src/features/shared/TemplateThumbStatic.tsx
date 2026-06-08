import { templateThumbAspectPadding } from './templateThumb'

type Props = {
  color: string
  compact?: boolean
  className?: string
}

/** Vista previa ligera sin iframe (evita crashes en Safari móvil). */
export default function TemplateThumbStatic({ color, compact = false, className }: Props) {
  const gradient = `linear-gradient(160deg, ${color} 0%, color-mix(in srgb, ${color} 50%, #1a1a1a) 100%)`

  if (compact) {
    return (
      <div
        className={['lw-template-thumb-wrap', 'lw-template-thumb-wrap--static', 'lw-template-thumb-wrap--compact', className]
          .filter(Boolean)
          .join(' ')}
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '100%',
          minWidth: 0,
          height: 148,
          overflow: 'hidden',
          background: color,
          contain: 'layout paint',
        }}
        aria-hidden
      >
        <div style={{ position: 'absolute', inset: 0, background: gradient }} />
      </div>
    )
  }

  return (
    <div
      className={['lw-template-thumb-wrap', 'lw-template-thumb-wrap--static', className].filter(Boolean).join(' ')}
      style={{
        position: 'relative',
        width: '100%',
        maxWidth: '100%',
        minWidth: 0,
        overflow: 'hidden',
        contain: 'layout paint',
      }}
      aria-hidden
    >
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: 0,
          paddingBottom: templateThumbAspectPadding(),
          background: color,
        }}
      >
        <div style={{ position: 'absolute', inset: 0, background: gradient }} />
      </div>
    </div>
  )
}
