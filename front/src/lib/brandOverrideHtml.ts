import { brandDerivativeProperties, brandDerivativeRootCss } from './brandColorDerivatives'

const HEX_RE = /^#[0-9a-fA-F]{6}$/
const PLACEHOLDER_RE = /<!--\s*BRAND_OVERRIDE_PLACEHOLDER:(\w+)\s*-->/

/**
 * Sustituye el placeholder de color de marca en el HTML estático de plantilla.
 * Devuelve el HTML sin cambios si el hex no es válido o no hay placeholder.
 */
export function applyBrandOverrideToTemplateHtml(html: string, brandColorHex: string): string {
  if (!HEX_RE.test(brandColorHex)) {
    return html
  }

  const match = html.match(PLACEHOLDER_RE)
  if (!match) {
    return html
  }

  const varName = match[1]
  const rootCss = brandDerivativeRootCss(varName, brandColorHex)
  const styleTag = rootCss ? `<style>${rootCss}</style>` : ''

  return html.replace(PLACEHOLDER_RE, styleTag)
}

export function isValidBrandColorHex(value: string): boolean {
  return HEX_RE.test(value)
}

const CSS_VAR_NAME_RE = /^[a-zA-Z_][a-zA-Z0-9_-]*$/

/** Aplica el color de marca en el documento del iframe (mismo origen que el SPA). */
export function applyBrandColorToDocument(
  doc: Document | null | undefined,
  cssVarName: string | null | undefined,
  hex: string | null | undefined,
  options?: { embedPreview?: boolean },
): void {
  if (!doc || !hex || !cssVarName) return
  if (!isValidBrandColorHex(hex) || !CSS_VAR_NAME_RE.test(cssVarName)) return

  const props = brandDerivativeProperties(cssVarName, hex, options?.embedPreview === true)
  const root = doc.documentElement
  for (const [name, value] of Object.entries(props)) {
    root.style.setProperty(`--${name}`, value)
  }
}
