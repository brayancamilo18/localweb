import type { CSSProperties } from 'react'
import logoSrc from '../../assets/onez_logo_oscuro_transparente_xl_3200x1200.png'

type LogoProps = {
  size?: number
  style?: CSSProperties
}

// El PNG fuente (3200x1200) tiene ~25.3% de padding transparente a la izquierda
// y ~29.4% arriba. Compensamos con margins negativos para que el borde visual
// del logo "ONEZ" quede pegado al borde izquierdo del contenedor.
const PNG_PAD_LEFT = 0.2531
const PNG_PAD_TOP = 0.2942

export default function Logo({ size = 280, style }: LogoProps) {
  return (
    <img
      src={logoSrc}
      alt="ONEZ"
      style={{
        width: size,
        height: 'auto',
        display: 'block',
        marginLeft: -(size * PNG_PAD_LEFT),
        marginTop: -(size * (1200 / 3200) * PNG_PAD_TOP),
        marginBottom: -(size * (1200 / 3200) * PNG_PAD_TOP),
        ...style,
      }}
    />
  )
}
