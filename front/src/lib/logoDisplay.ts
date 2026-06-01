/** Escala por defecto del logo en la barra de navegación de plantillas públicas. */
export const DEFAULT_LOGO_NAV_SCALE = 1.35

export const LOGO_NAV_SCALE_MIN = 0.75
export const LOGO_NAV_SCALE_MAX = 1.5

export function clampLogoNavScale(n: number): number {
  if (!Number.isFinite(n)) return DEFAULT_LOGO_NAV_SCALE
  return Math.min(LOGO_NAV_SCALE_MAX, Math.max(LOGO_NAV_SCALE_MIN, n))
}

/** Escala efectiva cuando hay logo (preview onboarding / API pública). */
export function resolveLogoNavScale(hasLogo: boolean, scale?: number): number {
  if (!hasLogo) return 1
  if (scale == null || !Number.isFinite(scale)) return DEFAULT_LOGO_NAV_SCALE
  return clampLogoNavScale(scale)
}
