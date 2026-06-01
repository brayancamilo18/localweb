import { buildPublicBusinessUrl, getPublicPageHost } from '../tenant'

describe('getPublicPageHost', () => {
  it('desde app.onez.es usa onez.es para páginas públicas', () => {
    expect(getPublicPageHost('app.onez.es')).toBe('onez.es')
  })

  it('desde pre.onez.es usa pre.onez.es', () => {
    expect(getPublicPageHost('pre.onez.es')).toBe('pre.onez.es')
  })
})

describe('buildPublicBusinessUrl', () => {
  it('construye https://{sub}.onez.es en prod', () => {
    expect(buildPublicBusinessUrl('7nz-jgbn-2vnn', 'app.onez.es')).toBe(
      'https://7nz-jgbn-2vnn.onez.es',
    )
  })
})
