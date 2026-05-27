import {
  brandDerivativeProperties,
  brandDerivativeRootCss,
  contrastTextOn,
  relativeLuminance,
} from '../brandColorDerivatives'

describe('brandDerivativeProperties', () => {
  it('genera hover y soft para el color principal', () => {
    const props = brandDerivativeProperties('accent', '#0f7b5f')
    expect(props.accent).toBe('#0f7b5f')
    expect(props['accent-hover']).toMatch(/^#[0-9a-f]{6}$/)
    expect(props['accent-soft']).toMatch(/^rgba\(/)
    expect(props['accent-2']).toMatch(/^#[0-9a-f]{6}$/)
  })

  it('sincroniza orange-2 para hovers de craft-pro', () => {
    const props = brandDerivativeProperties('orange', '#ffaa00')
    expect(props.orange).toBe('#ffaa00')
    expect(props['orange-2']).toMatch(/^#[0-9a-f]{6}$/)
    expect(props['orange-2']).not.toBe('#e04e00')
  })

  it('sincroniza terracotta-soft con el hex de marca', () => {
    const props = brandDerivativeProperties('terracotta', '#7a3e3e')
    expect(props.terracotta).toBe('#7a3e3e')
    expect(props['terracotta-soft']).toMatch(/^#[0-9a-f]{6}$/)
    expect(props['terracotta-hover']).toBeDefined()
  })

  it('genera texto de contraste y hover más claro en colores oscuros', () => {
    const dark = brandDerivativeProperties('gold', '#5a1f1f')
    expect(dark['gold-on']).toBe('#ffffff')
    expect(relativeLuminance('#5a1f1f')).toBeLessThan(0.4)
    expect(contrastTextOn('#5a1f1f')).toBe('#ffffff')
    expect(dark['gold-hover']).not.toBe(dark.gold)
    expect(relativeLuminance(dark['gold-hover'])).toBeGreaterThan(relativeLuminance('#5a1f1f'))

    const light = brandDerivativeProperties('lime', '#d4ff3a')
    expect(light['lime-on']).toBe('#000000')
    expect(contrastTextOn('#d4ff3a')).toBe('#000000')
    expect(light['lime-hover']).not.toBe(light.lime)
  })

  it('el hover nunca coincide con el color principal', () => {
    for (const hex of ['#ff80ab', '#d4ff3a', '#0066cc', '#5a1f1f']) {
      const props = brandDerivativeProperties('accent', hex)
      expect(props['accent-hover']).not.toBe(hex.toLowerCase())
    }
  })
})

describe('brandDerivativeRootCss', () => {
  it('devuelve regla :root con variables derivadas', () => {
    expect(brandDerivativeRootCss('lime', '#d4ff3a')).toContain('--lime:#d4ff3a')
    expect(brandDerivativeRootCss('lime', '#d4ff3a')).toContain('--lime-hover:')
    expect(brandDerivativeRootCss('lime', '#d4ff3a')).toContain('--lime-on:')
  })
})
