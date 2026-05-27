import {
  applyBrandColorToDocument,
  applyBrandOverrideToTemplateHtml,
  isValidBrandColorHex,
} from '../brandOverrideHtml'

describe('applyBrandOverrideToTemplateHtml', () => {
  it('reemplaza el placeholder con un style :root', () => {
    const html = '<head></style>\n<!-- BRAND_OVERRIDE_PLACEHOLDER:lime -->\n<body>'
    const out = applyBrandOverrideToTemplateHtml(html, '#FF5A3A')
    expect(out).toContain('<style>:root{--lime:#ff5a3a;')
    expect(out).toContain('--lime-hover:')
    expect(out).not.toContain('BRAND_OVERRIDE_PLACEHOLDER')
  })

  it('no modifica el html si el hex es inválido', () => {
    const html = '<!-- BRAND_OVERRIDE_PLACEHOLDER:lime -->'
    expect(applyBrandOverrideToTemplateHtml(html, 'red')).toBe(html)
  })
})

describe('applyBrandColorToDocument', () => {
  it('establece la variable CSS en el documento', () => {
    const doc = document.implementation.createHTMLDocument('test')
    applyBrandColorToDocument(doc, 'accent', '#0F7B5F')
    expect(doc.documentElement.style.getPropertyValue('--accent')).toBe('#0f7b5f')
  })
})

describe('isValidBrandColorHex', () => {
  it('acepta hex de 6 dígitos', () => {
    expect(isValidBrandColorHex('#aabbcc')).toBe(true)
  })

  it('rechaza valores no hex', () => {
    expect(isValidBrandColorHex('javascript:alert(1)')).toBe(false)
  })
})
