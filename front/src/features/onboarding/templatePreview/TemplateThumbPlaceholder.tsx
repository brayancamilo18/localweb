import { TEMPLATE_THUMB_ASPECT_PERCENT } from './constants'

export type TemplateThumbPlaceholderProps = {
  name: string
  primaryColor?: string
}

function tintHex(hex: string, ratio: number): string {
  let h = hex.replace('#', '').trim()
  if (h.length === 3) h = h.split('').map((c) => c + c).join('')
  const num = parseInt(h, 16)
  if (Number.isNaN(num)) return '#E1F5EE'
  const r = (num >> 16) & 255
  const g = (num >> 8) & 255
  const b = num & 255
  const t = Math.max(0, Math.min(1, ratio))
  const mix = (c: number) => Math.round(c + (255 - c) * t)
  return `rgb(${mix(r)}, ${mix(g)}, ${mix(b)})`
}

export default function TemplateThumbPlaceholder({ name, primaryColor = '#0F6E56' }: TemplateThumbPlaceholderProps) {
  const accent = primaryColor.startsWith('#') ? primaryColor : '#0F6E56'
  const soft = tintHex(accent, 0.92)
  const mid = tintHex(accent, 0.75)

  return (
    <div
      className="lw-template-thumb-placeholder"
      aria-hidden
      style={{
        position: 'relative',
        width: '100%',
        height: 0,
        paddingBottom: `${TEMPLATE_THUMB_ASPECT_PERCENT}%`,
        overflow: 'hidden',
        background: `linear-gradient(145deg, ${soft} 0%, #ffffff 42%, ${mid} 100%)`,
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          padding: 16,
          textAlign: 'center',
        }}
      >
        <div
          style={{
            width: 40,
            height: 4,
            borderRadius: 999,
            background: accent,
            opacity: 0.85,
          }}
        />
        <span
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: 'var(--lw-text)',
            letterSpacing: '-0.02em',
            lineHeight: 1.25,
            maxWidth: '90%',
          }}
        >
          {name}
        </span>
      </div>
    </div>
  )
}
