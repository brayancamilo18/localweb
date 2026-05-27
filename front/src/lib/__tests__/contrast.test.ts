import { describe, expect, it } from 'vitest'
import { checkBrandContrast, contrastRatio, getBrandContrastWarning } from '../contrast'
import type { BrandColorTemplateMeta } from '../../api/dashboard'

const monoEdito: BrandColorTemplateMeta = { usage: 'text', bg: '#ffffff', ink: '#0a0a0a' }
const urbanBold: BrandColorTemplateMeta = { usage: 'bg', bg: '#f4f1ea', ink: '#0a0a0a' }
const techSleek: BrandColorTemplateMeta = { usage: 'text_on_dark', bg: '#070a14', ink: '#e8ecf8' }
const bloomStudio: BrandColorTemplateMeta = { usage: 'mixed', bg: '#fafaf8', ink: '#1c1c1c' }

describe('contrastRatio', () => {
  it('black on white is 21', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 0)
  })
  it('same color is 1', () => {
    expect(contrastRatio('#abcdef', '#abcdef')).toBeCloseTo(1, 5)
  })
})

describe('getBrandContrastWarning', () => {
  it('devuelve mensaje cuando el contraste es bajo', () => {
    expect(getBrandContrastWarning('#ffff00', monoEdito)).toMatch(/no se vea bien/i)
  })

  it('devuelve null cuando el contraste es aceptable', () => {
    expect(getBrandContrastWarning('#0a0a0a', monoEdito)).toBeNull()
  })
})

describe('checkBrandContrast', () => {
  it('rejects invalid hex', () => {
    expect(checkBrandContrast('not-a-hex', monoEdito).ok).toBe(false)
    expect(checkBrandContrast('not-a-hex', monoEdito).reason).toBe('invalid_hex')
  })

  it('rejects when template has no metadata', () => {
    expect(checkBrandContrast('#0066cc', null).ok).toBe(false)
    expect(checkBrandContrast('#0066cc', null).reason).toBe('no_metadata')
  })

  it('rejects yellow on white as text', () => {
    expect(checkBrandContrast('#ffff00', monoEdito).ok).toBe(false)
  })

  it('accepts black as text on white', () => {
    expect(checkBrandContrast('#0a0a0a', monoEdito).ok).toBe(true)
  })

  it('rejects very dark on dark bg (text_on_dark)', () => {
    expect(checkBrandContrast('#1a1a1a', techSleek).ok).toBe(false)
  })

  it('accepts bright orange as bg', () => {
    expect(checkBrandContrast('#ffaa00', urbanBold).ok).toBe(true)
  })

  it('rejects light pink on light bg (mixed)', () => {
    expect(checkBrandContrast('#ffe0e0', bloomStudio).ok).toBe(false)
  })

  it('accepts medium blue (mixed)', () => {
    expect(checkBrandContrast('#0066cc', bloomStudio).ok).toBe(true)
  })
})
