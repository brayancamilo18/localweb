import type { BrandColorTemplateMeta } from '../api/dashboard'

const HEX_RE = /^#[0-9a-fA-F]{6}$/

function channel(byte: number): number {
  const c = byte / 255
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
}

function relativeLuminance(hex: string): number {
  const h = hex.replace('#', '')
  const r = channel(parseInt(h.slice(0, 2), 16))
  const g = channel(parseInt(h.slice(2, 4), 16))
  const b = channel(parseInt(h.slice(4, 6), 16))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

export function contrastRatio(hexA: string, hexB: string): number {
  const la = relativeLuminance(hexA)
  const lb = relativeLuminance(hexB)
  const light = Math.max(la, lb)
  const dark = Math.min(la, lb)
  return (light + 0.05) / (dark + 0.05)
}

export type ContrastResult = {
  ok: boolean
  /** Razón del fallo cuando ok=false. */
  reason?: 'invalid_hex' | 'no_metadata' | 'low_contrast'
  vsBg: number
  vsInk: number
  /** Mensaje breve listo para mostrar en UI cuando ok=false. */
  message?: string
}

/**
 * Valida un color de marca contra los metadatos de la plantilla. Idéntico
 * matemáticamente a App\Services\TemplateContrast.php (mismo algoritmo y
 * mismos umbrales). Un resultado ok=false es solo aviso: el usuario puede
 * guardar el color igualmente.
 */
export function getBrandContrastWarning(
  hex: string,
  meta: BrandColorTemplateMeta | null,
): string | null {
  const result = checkBrandContrast(hex, meta)
  if (result.ok || result.reason === 'no_metadata' || result.reason === 'invalid_hex') {
    return null
  }
  return 'Puede que este color no se vea bien en tu plantilla. Puedes elegirlo igualmente.'
}

export function checkBrandContrast(
  hex: string,
  meta: BrandColorTemplateMeta | null,
): ContrastResult {
  if (!HEX_RE.test(hex)) {
    return { ok: false, reason: 'invalid_hex', vsBg: 0, vsInk: 0, message: 'Código de color no válido.' }
  }
  if (!meta) {
    return { ok: false, reason: 'no_metadata', vsBg: 0, vsInk: 0, message: 'Esta plantilla no admite colores personalizados.' }
  }
  const vsBg = contrastRatio(hex, meta.bg)
  const vsInk = contrastRatio(meta.ink, hex)

  let ok = false
  switch (meta.usage) {
    case 'text':
    case 'text_on_dark':
      ok = vsBg >= 4.5
      break
    case 'bg':
      ok = vsInk >= 4.5
      break
    case 'mixed':
      ok = vsBg >= 3.0 && vsInk >= 3.0
      break
  }

  if (ok) return { ok: true, vsBg, vsInk }
  return {
    ok: false,
    reason: 'low_contrast',
    vsBg,
    vsInk,
    message:
      meta.usage === 'bg'
        ? 'Este color no contrasta bien con el texto. Prueba uno más claro.'
        : meta.usage === 'text_on_dark'
          ? 'Este color es demasiado oscuro para fondo oscuro. Prueba uno más claro.'
          : 'Este color no contrasta bien con el fondo. Prueba uno más oscuro o más claro.',
  }
}
