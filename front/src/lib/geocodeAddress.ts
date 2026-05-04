export type GeocodeResult = {
  lat: number
  lng: number
  displayName: string
}

/**
 * Geocodificación vía Nominatim (OSM). Uso manual (p. ej. botón «Buscar») para respetar la política de uso.
 */
export async function geocodeAddress(query: string): Promise<GeocodeResult | null> {
  const q = query.trim()
  if (!q) return null

  const url =
    'https://nominatim.openstreetmap.org/search?format=json&limit=1&q=' + encodeURIComponent(q)

  const res = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'Accept-Language': 'es',
    },
  })

  if (!res.ok) return null

  const data = (await res.json()) as Array<{ lat?: string; lon?: string; display_name?: string }>
  if (!Array.isArray(data) || !data[0]) return null

  const lat = parseFloat(String(data[0].lat))
  const lng = parseFloat(String(data[0].lon))
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null

  return {
    lat,
    lng,
    displayName: String(data[0].display_name || q),
  }
}
