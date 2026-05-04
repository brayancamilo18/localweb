import type { CSSProperties } from 'react'

type LogoProps = {
  size?: number
  style?: CSSProperties
}

export default function Logo({ size = 22, style }: LogoProps) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: 'var(--lw-text)', ...style }}>
      <span
        style={{
          width: size,
          height: size,
          borderRadius: 6,
          background: 'var(--lw-accent)',
          color: '#fff',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 700,
          fontSize: size * 0.55,
          fontFamily: 'var(--lw-font)',
          letterSpacing: '-0.04em',
        }}
      >
        L
      </span>
      <span style={{ fontWeight: 600, fontSize: size * 0.72, letterSpacing: '-0.015em' }}>LocalWeb</span>
    </span>
  )
}
