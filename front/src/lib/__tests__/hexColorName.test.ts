import { describe, expect, it } from 'vitest'
import { getColorDisplayName } from '../hexColorName'

describe('getColorDisplayName', () => {
  it('devuelve nombres en español para colores típicos de plantilla', () => {
    expect(getColorDisplayName('#ff80ab')).toMatch(/rosa/i)
    expect(getColorDisplayName('#7a3e3e')).toMatch(/burdeos/i)
    expect(getColorDisplayName('#1e4b7c')).toMatch(/azul/i)
    expect(getColorDisplayName('#1a4f3f')).toMatch(/verde/i)
  })

  it('no muestra el código hex al usuario', () => {
    const name = getColorDisplayName('#c8553d')
    expect(name).not.toMatch(/^#/)
  })

  it('todos los hex de las paletas de plantillas tienen nombre único', () => {
    const paletteHexes = [
      // bloom-studio
      '#e8572a', '#c44536', '#b8336a', '#8b5cf6', '#0a6cdc', '#0f7b5f',
      // coastal-calm
      '#c76e4a', '#b85839', '#b8556a', '#5b7b9e', '#6b7f5c', '#9b6b3d',
      // craft-pro
      '#ff5c00', '#d63f0a', '#0a6cdc', '#7c3aed', '#c2410c', '#0f8a6a',
      // graphite-soft
      '#c47550', '#e89e6e', '#d4b8a0', '#a8c0a8', '#b8a8d0', '#e8c28c',
      // luxe-atelier
      '#8e6a35', '#6b4423', '#5c4a8c', '#2f4f4f', '#7a3e3e', '#3d5a40',
      // mono-edito
      '#c2410c', '#0a6cdc', '#0f7b5f', '#7c3aed', '#a0341f', '#1a1a1a',
      // noir-elite
      '#c9a84c', '#d4b570', '#e8c893', '#c4a484', '#b8956a', '#dcc189',
      // tavola-warm
      '#5a1f1f', '#7a2a2a', '#2d3a28', '#704214', '#5c3a26', '#3d2c5c',
      // tech-sleek
      '#5eead4', '#8b7cf6', '#38bdf8', '#f472b6', '#a3e635', '#fb923c',
      // trust-clinic
      '#1a4f3f', '#1e4b7c', '#5c4a8c', '#7a3e3e', '#3d5a40', '#704214',
      // urban-bold
      '#d4ff3a', '#ff5a3a', '#3affe5', '#ffd23a', '#ff80ab', '#ff6b00',
      // versa-studio
      '#c7634d', '#a88b4a', '#7a8260', '#5c6f8c', '#a35266', '#9b5039',
    ]
    const uniqueHexes = Array.from(new Set(paletteHexes))
    const names = uniqueHexes.map((h) => getColorDisplayName(h))

    // Ningún resultado puede ser el propio hex (cobertura completa)
    for (const n of names) {
      expect(n.startsWith('#')).toBe(false)
    }

    // Todos los nombres son únicos
    expect(new Set(names).size).toBe(uniqueHexes.length)
  })
})
