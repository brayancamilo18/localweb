/** Normaliza a #rrggbb en minúsculas, o null si no es válido. */
function normalizeHex(hex: string): string | null {
  const raw = hex.trim().toLowerCase()
  const m = raw.match(/^#?([0-9a-f]{3}|[0-9a-f]{6})$/)
  if (!m) return null
  let h = m[1]
  if (h.length === 3) {
    h = h
      .split('')
      .map((c) => c + c)
      .join('')
  }
  return `#${h}`
}

/**
 * Nombre único en español para cada hex de las paletas curadas en
 * backend/config/branding.php. Cada hex tiene su propio nombre, sin
 * repetidos, ordenado por matiz (HSL) de rojo a rosa.
 *
 * Si añades un color nuevo a branding.php, AÑÁDELO TAMBIÉN aquí con un
 * nombre nuevo y único.
 */
const KNOWN_HEX_NAMES: Record<string, string> = {
  // Rojos / vinos / burdeos
  '#1a1a1a': 'Negro tinta',
  '#5a1f1f': 'Vino',
  '#7a2a2a': 'Tinto',
  '#7a3e3e': 'Burdeos',
  '#c44536': 'Ladrillo',
  '#ff5a3a': 'Coral eléctrico',
  '#a0341f': 'Rojo profundo',
  '#c7634d': 'Cálido',
  '#9b5039': 'Teja',
  '#e8572a': 'Coral',
  '#b85839': 'Siena',
  // Naranjas / terracotas
  '#d63f0a': 'Rojo trabajo',
  '#c76e4a': 'Terracota',
  '#c2410c': 'Óxido',
  '#c47550': 'Terracota suave',
  '#ff5c00': 'Naranja vivo',
  '#5c3a26': 'Café tostado',
  '#e89e6e': 'Melocotón',
  '#ff6b00': 'Naranja flúor',
  '#fb923c': 'Naranja eléctrico',
  '#6b4423': 'Chocolate',
  '#d4b8a0': 'Crema rosada',
  '#9b6b3d': 'Ámbar tostado',
  // Marrones / dorados
  '#704214': 'Caoba',
  '#c4a484': 'Bronce claro',
  '#b8956a': 'Bronce',
  '#e8c28c': 'Mostaza suave',
  '#8e6a35': 'Champán oscuro',
  '#e8c893': 'Champán claro',
  '#dcc189': 'Arena',
  '#d4b570': 'Oro suave',
  '#a88b4a': 'Dorado mate',
  '#c9a84c': 'Oro',
  // Amarillos / lima
  '#ffd23a': 'Amarillo brutalista',
  '#d4ff3a': 'Lima',
  '#7a8260': 'Musgo',
  '#a3e635': 'Lima neón',
  '#6b7f5c': 'Salvia',
  // Verdes
  '#2d3a28': 'Verde botella',
  '#a8c0a8': 'Salvia clara',
  '#3d5a40': 'Verde bosque',
  '#1a4f3f': 'Verde clínico',
  '#0f8a6a': 'Verde acero',
  '#0f7b5f': 'Esmeralda',
  // Cian / turquesa
  '#5eead4': 'Turquesa',
  '#3affe5': 'Cian flúor',
  '#2f4f4f': 'Verde inglés',
  '#38bdf8': 'Cielo',
  // Azules
  '#1e4b7c': 'Azul marino',
  '#5b7b9e': 'Azul mar',
  '#0a6cdc': 'Azul rey',
  '#5c6f8c': 'Azul piedra',
  // Violetas / lilas
  '#8b7cf6': 'Lavanda',
  '#5c4a8c': 'Berenjena',
  '#8b5cf6': 'Violeta',
  '#3d2c5c': 'Ciruela',
  '#7c3aed': 'Violeta intenso',
  '#b8a8d0': 'Lila polvo',
  // Rosas / magentas
  '#f472b6': 'Rosa neón',
  '#b8336a': 'Magenta',
  '#ff80ab': 'Rosa chicle',
  '#a35266': 'Frambuesa',
  '#b8556a': 'Rosa coral',
}

function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  const rn = r / 255
  const gn = g / 255
  const bn = b / 255
  const max = Math.max(rn, gn, bn)
  const min = Math.min(rn, gn, bn)
  const l = (max + min) / 2
  if (max === min) return { h: 0, s: 0, l }

  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  let h = 0
  switch (max) {
    case rn:
      h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6
      break
    case gn:
      h = ((bn - rn) / d + 2) / 6
      break
    default:
      h = ((rn - gn) / d + 4) / 6
  }
  return { h: h * 360, s, l }
}

function lightnessModifier(l: number): string {
  if (l >= 0.72) return ' claro'
  if (l <= 0.28) return ' oscuro'
  return ''
}

function hueName(h: number): string {
  if (h < 15 || h >= 345) return 'Rojo'
  if (h < 40) return 'Naranja'
  if (h < 55) return 'Ámbar'
  if (h < 75) return 'Amarillo'
  if (h < 150) return 'Verde'
  if (h < 185) return 'Turquesa'
  if (h < 220) return 'Azul'
  if (h < 260) return 'Índigo'
  if (h < 290) return 'Violeta'
  return 'Rosa'
}

/**
 * Nombre legible en español para un color hexadecimal. Para hex de paletas
 * curadas devuelve un nombre único definido en KNOWN_HEX_NAMES. Para hex
 * arbitrarios (fallback de branding.php o hex futuros) deriva un nombre
 * a partir del matiz HSL.
 */
export function getColorDisplayName(hex: string): string {
  const normalized = normalizeHex(hex)
  if (!normalized) return hex.trim()

  const known = KNOWN_HEX_NAMES[normalized]
  if (known) return known

  const r = parseInt(normalized.slice(1, 3), 16)
  const g = parseInt(normalized.slice(3, 5), 16)
  const b = parseInt(normalized.slice(5, 7), 16)
  const { h, s, l } = rgbToHsl(r, g, b)

  if (l < 0.1) return 'Negro'
  if (l > 0.94 && s < 0.08) return 'Blanco'
  if (l > 0.88 && s < 0.2) return 'Crema'
  if (s < 0.1) {
    if (l < 0.35) return 'Gris oscuro'
    if (l < 0.65) return 'Gris'
    return 'Gris claro'
  }

  if (s < 0.2 && l < 0.45) return 'Marrón' + lightnessModifier(l)
  if (h >= 15 && h < 45 && l < 0.5) return 'Marrón' + lightnessModifier(l)

  return hueName(h) + lightnessModifier(l)
}
