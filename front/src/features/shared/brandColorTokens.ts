/** Tokens visuales compartidos (Color de marca / modal cambio plantilla). */
export const brandColorTokens = {
  ink: 'var(--lw-text)',
  cream: 'var(--lw-bg-elev)',
  verde: 'var(--lw-accent)',
  ink60: 'color-mix(in srgb, var(--lw-text) 60%, transparent)',
  ink70: 'color-mix(in srgb, var(--lw-text) 70%, transparent)',
  ink80: 'color-mix(in srgb, var(--lw-text) 80%, transparent)',
  ink99: 'color-mix(in srgb, var(--lw-text) 60%, transparent)',
  ink08: 'color-mix(in srgb, var(--lw-text) 8%, transparent)',
  ink0D: 'color-mix(in srgb, var(--lw-text) 5%, transparent)',
  ink1A: 'color-mix(in srgb, var(--lw-text) 10%, transparent)',
  verde12: 'color-mix(in srgb, var(--lw-accent) 12%, transparent)',
  verde14: 'color-mix(in srgb, var(--lw-accent) 14%, transparent)',
  verde08: 'color-mix(in srgb, var(--lw-accent) 8%, transparent)',
  verde33: 'color-mix(in srgb, var(--lw-accent) 20%, transparent)',
  panelShadow: `0 1px 0 color-mix(in srgb, var(--lw-text) 3%, transparent), 0 10px 30px color-mix(in srgb, var(--lw-text) 4%, transparent), inset 0 0 0 1px color-mix(in srgb, var(--lw-text) 3%, transparent)`,
} as const

export function isLightHex(hex: string): boolean {
  const h = hex.replace('#', '')
  if (h.length !== 6) return false
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  return (r * 299 + g * 587 + b * 114) / 1000 > 160
}
