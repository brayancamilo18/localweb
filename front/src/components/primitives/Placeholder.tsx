import type { CSSProperties } from 'react'

type PlaceholderProps = {
  ratio?: string
  h?: number
  dark?: boolean
  label?: string
  style?: CSSProperties
}

export default function Placeholder({ ratio = '16:9', h, dark, label, style }: PlaceholderProps) {
  const [a, b] = ratio.split(':').map(Number)

  return (
    <div
      className={dark ? 'lw-stripes lw-stripes-dark' : 'lw-stripes'}
      style={{
        width: '100%',
        height: h || undefined,
        aspectRatio: h ? undefined : `${a}/${b}`,
        borderRadius: 'var(--lw-r-sm)',
        position: 'relative',
        overflow: 'hidden',
        ...style,
      }}
    >
      {label ? <span style={{ position: 'absolute', bottom: 8, left: 10 }}>{label}</span> : null}
    </div>
  )
}
