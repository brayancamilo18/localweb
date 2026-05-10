import { useMemo } from 'react'

export type CharCounterProps = {
  /** Caracteres actuales del campo. */
  value: number
  /** Límite duro impuesto por el backend. */
  max: number
  /** Tamaño del círculo en píxeles. Por defecto 18 (cabe en la cabecera del Field). */
  size?: number
  /** Etiqueta accesible opcional («Caracteres del tagline», por ejemplo). */
  ariaLabel?: string
}

/**
 * Indicador circular para campos con `maxLength`.
 *
 * Muestra un anillo SVG que se rellena conforme el usuario se acerca al límite,
 * y al lado «N / max» con números tabulares para evitar saltos de ancho.
 *
 * Colores:
 * - <70 %: acento neutro (var(--lw-text-3)).
 * - 70-89 %: aviso (var(--lw-warning)).
 * - 90-100 %: peligro (var(--lw-danger)).
 *
 * Se mantiene visible incluso si `value > max` (por ejemplo, valor inicial del
 * servidor que ya excede el nuevo límite); en ese caso fija el progreso al 100 %
 * y los textos se vuelven peligrosos para forzar la corrección.
 */
export function CharCounter({ value, max, size = 18, ariaLabel }: CharCounterProps) {
  const safeMax = Math.max(1, Math.floor(max))
  const safeValue = Math.max(0, Math.floor(value))
  const ratio = Math.min(1, safeValue / safeMax)
  const percent = Math.round(ratio * 100)

  const { color, label } = useMemo(() => {
    if (safeValue > safeMax || percent >= 100) {
      return { color: 'var(--lw-danger)', label: 'limit-reached' }
    }
    if (percent >= 90) return { color: 'var(--lw-danger)', label: 'critical' }
    if (percent >= 70) return { color: 'var(--lw-warning)', label: 'warning' }
    return { color: 'var(--lw-text-3)', label: 'ok' }
  }, [percent, safeValue, safeMax])

  const stroke = 2
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - ratio)

  return (
    <span
      role="img"
      aria-label={ariaLabel ?? `${safeValue} de ${safeMax} caracteres`}
      data-state={label}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        fontSize: 11,
        fontVariantNumeric: 'tabular-nums',
        color,
        transition: 'color 120ms ease',
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        aria-hidden="true"
        focusable="false"
        style={{ display: 'block', overflow: 'visible' }}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--lw-border)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dashoffset 160ms ease, stroke 120ms ease' }}
        />
      </svg>
      <span aria-hidden="true">
        {safeValue}
        <span style={{ opacity: 0.6 }}> / {safeMax}</span>
      </span>
    </span>
  )
}
