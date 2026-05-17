import type { CSSProperties } from 'react'
import { ONEZ_LOGO_ALT, ONEZ_LOGO_SRC } from '../../lib/brand'

export type LogoProps = {
  size?: number
  style?: CSSProperties
  className?: string
  /** Versión clara sobre fondos oscuros (hero login/registro). */
  onDark?: boolean
}

export default function Logo({ size = 220, style, className, onDark }: LogoProps) {
  const classes = ['lw-logo', onDark && 'lw-logo--on-dark', className].filter(Boolean).join(' ')

  return (
    <img
      src={ONEZ_LOGO_SRC}
      alt={ONEZ_LOGO_ALT}
      className={classes}
      style={{
        width: size,
        maxWidth: '100%',
        height: 'auto',
        ...style,
      }}
    />
  )
}
