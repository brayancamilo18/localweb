import {
  buildLocationValue,
  emptyLocation,
  getSpanishCountryName,
  resolveLegacyLocation,
} from './locationData'
import type { LocationValue } from './locationTypes'

/** Normaliza valores de API, persist o texto libre antiguo. */
export function coerceLocation(input: {
  countryCode?: string | null
  country?: string | null
  city?: string | null
}): LocationValue {
  const code = (input.countryCode ?? '').trim().toUpperCase()
  const country = (input.country ?? '').trim()
  const city = (input.city ?? '').trim()

  if (code && country && city) {
    const built = buildLocationValue(code, city)
    if (built) return built
  }

  if (code && city) {
    const built = buildLocationValue(code, city)
    if (built) return built
    return {
      countryCode: code,
      country: country || getSpanishCountryName(code),
      city,
    }
  }

  if (country && city) {
    const legacy = resolveLegacyLocation(country, city)
    if (legacy) return legacy
  }

  if (code) {
    return { countryCode: code, country: country || getSpanishCountryName(code), city: '' }
  }

  return emptyLocation()
}
