import {
  DEFAULT_LOGO_NAV_SCALE,
  clampLogoNavScale,
  resolveLogoNavScale,
} from '../logoDisplay'

describe('logoDisplay', () => {
  it('usa escala generosa por defecto cuando hay logo', () => {
    expect(resolveLogoNavScale(true)).toBe(DEFAULT_LOGO_NAV_SCALE)
    expect(DEFAULT_LOGO_NAV_SCALE).toBeGreaterThan(1.2)
  })

  it('clamp respeta mínimo y máximo', () => {
    expect(clampLogoNavScale(0.5)).toBe(0.75)
    expect(clampLogoNavScale(2)).toBe(1.5)
  })
})
