const HEX_RE = /^#[0-9a-fA-F]{6}$/

/** Variables :root que deben seguir al color de marca principal (sin prefijo --). */
export const BRAND_SYNC_VARS: Record<string, readonly string[]> = {
  coral: ['coral', 'peach', 'blush'],
  terracotta: ['terracotta', 'terracotta-soft'],
  orange: ['orange', 'orange-2', 'orange-soft'],
  accent: ['accent', 'accent-soft', 'accent-2'],
  champagne: ['champagne', 'champagne-2', 'champagne-soft'],
  gold: ['gold', 'gold-soft', 'gold-line'],
  wine: ['wine', 'wine-2'],
  cyan: ['cyan', 'cyan-soft'],
  lime: ['lime'],
  warm: ['warm', 'warm-soft'],
}

export function isValidBrandHex(hex: string): boolean {
  return HEX_RE.test(hex)
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const h = hex.replace('#', '')
  if (h.length !== 6) return null
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  if ([r, g, b].some((n) => Number.isNaN(n))) return null
  return { r, g, b }
}

function mixHex(hex: string, target: string, amount: number): string {
  const a = hexToRgb(hex)
  const b = hexToRgb(target)
  if (!a || !b) return hex.toLowerCase()
  const t = Math.min(1, Math.max(0, amount))
  const r = Math.round(a.r + (b.r - a.r) * t)
  const g = Math.round(a.g + (b.g - a.g) * t)
  const bl = Math.round(a.b + (b.b - a.b) * t)
  return `#${[r, g, bl].map((n) => n.toString(16).padStart(2, '0')).join('')}`
}

function srgbChannel(c: number): number {
  const s = c / 255
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
}

/** Luminancia relativa WCAG (0–1) para elegir texto claro u oscuro sobre el color de marca. */
export function relativeLuminance(hex: string): number {
  const rgb = hexToRgb(hex)
  if (!rgb) return 0
  return (
    0.2126 * srgbChannel(rgb.r) + 0.7152 * srgbChannel(rgb.g) + 0.0722 * srgbChannel(rgb.b)
  )
}

/** Texto legible sobre fondos rellenos con el color de marca principal. */
export function contrastTextOn(hex: string): string {
  return relativeLuminance(hex) > 0.4 ? '#000000' : '#ffffff'
}

function hoverBrandHex(hex: string): string {
  const h = hex.toLowerCase()
  let hover =
    relativeLuminance(h) > 0.45 ? mixHex(h, '#000000', 0.28) : mixHex(h, '#ffffff', 0.22)
  if (hover === h) {
    hover =
      relativeLuminance(h) > 0.45 ? mixHex(h, '#000000', 0.4) : mixHex(h, '#ffffff', 0.35)
  }
  return hover
}

function rgbaFromHex(hex: string, alpha: number): string {
  const rgb = hexToRgb(hex)
  if (!rgb) return hex
  return `rgba(${rgb.r},${rgb.g},${rgb.b},${alpha})`
}

function valueForSyncedVar(name: string, hex: string): string {
  const h = hex.toLowerCase()
  if (name.endsWith('-soft')) {
    if (name === 'terracotta-soft') return mixHex(h, '#ffffff', 0.55)
    if (name === 'orange-soft' || name === 'champagne-soft') return mixHex(h, '#ffffff', 0.88)
    return rgbaFromHex(h, 0.16)
  }
  if (name.endsWith('-line')) return rgbaFromHex(h, 0.3)
  if (name.endsWith('-2')) {
    return relativeLuminance(h) > 0.45
      ? mixHex(h, '#000000', 0.14)
      : mixHex(h, '#ffffff', 0.18)
  }
  if (name === 'peach') return mixHex(h, '#ffffff', 0.35)
  if (name === 'blush') return mixHex(h, '#ffffff', 0.75)
  return h
}

/**
 * Propiedades CSS custom (--nombre sin prefijo) derivadas del color de marca.
 */
export function brandDerivativeProperties(mainVar: string, hex: string): Record<string, string> {
  if (!isValidBrandHex(hex)) return {}

  const h = hex.toLowerCase()
  const names = BRAND_SYNC_VARS[mainVar] ?? [mainVar]
  const out: Record<string, string> = {}

  for (const name of names) {
    out[name] = valueForSyncedVar(name, h)
  }

  if (names.includes(mainVar)) {
    out[`${mainVar}-hover`] = hoverBrandHex(h)
    out[`${mainVar}-on`] = contrastTextOn(h)
  }

  return out
}

export function brandDerivativeRootCss(mainVar: string, hex: string): string {
  const props = brandDerivativeProperties(mainVar, hex)
  const decl = Object.entries(props)
    .map(([k, v]) => `--${k}:${v}`)
    .join(';')
  return decl ? `:root{${decl}}` : ''
}
