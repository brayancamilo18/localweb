import { describe, expect, it } from 'vitest'
import { isValidThumbnailUrl } from '../thumbnailUrl'

describe('isValidThumbnailUrl', () => {
  it('acepta http, https y rutas relativas', () => {
    expect(isValidThumbnailUrl('https://cdn.example.com/a.webp')).toBe(true)
    expect(isValidThumbnailUrl('http://localhost/thumb.png')).toBe(true)
    expect(isValidThumbnailUrl('/assets/thumb.png')).toBe(true)
  })

  it('rechaza vacío, javascript y strings sin protocolo', () => {
    expect(isValidThumbnailUrl(null)).toBe(false)
    expect(isValidThumbnailUrl('')).toBe(false)
    expect(isValidThumbnailUrl('   ')).toBe(false)
    expect(isValidThumbnailUrl('javascript:alert(1)')).toBe(false)
    expect(isValidThumbnailUrl('data:text/html,foo')).toBe(false)
  })
})
