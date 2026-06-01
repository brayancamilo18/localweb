import { City, Country } from 'country-state-city'
import countries from 'i18n-iso-countries'
import esLocale from 'i18n-iso-countries/langs/es.json'
import type { CityOption, CountryOption, LocationValue } from './locationTypes'

countries.registerLocale(esLocale)

const DEFAULT_COUNTRY_CODE = 'ES'

/** Nombres en español para ciudades que en el dataset vienen en inglés */
const CITY_LABEL_ES: Record<string, string> = {
  Seville: 'Sevilla',
  Cordoba: 'Córdoba',
  Malaga: 'Málaga',
  'A Coruna': 'A Coruña',
  'Las Palmas': 'Las Palmas de Gran Canaria',
  Palma: 'Palma de Mallorca',
  'San Sebastian': 'San Sebastián',
  Ourense: 'Ourense',
  Gijon: 'Gijón',
  Avila: 'Ávila',
  Cadiz: 'Cádiz',
  Leon: 'León',
  Merida: 'Mérida',
  Logrono: 'Logroño',
  'Mexico City': 'Ciudad de México',
  Monterrey: 'Monterrey',
  Guadalajara: 'Guadalajara',
  Bogota: 'Bogotá',
  Medellin: 'Medellín',
  Cali: 'Cali',
  'Buenos Aires': 'Buenos Aires',
}

let countriesCache: CountryOption[] | null = null
const citiesCache = new Map<string, CityOption[]>()

function normalizeKey(s: string): string {
  return s
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .trim()
}

export function getDefaultCountryCode(): string {
  return DEFAULT_COUNTRY_CODE
}

export function getSpanishCountryName(isoCode: string): string {
  return countries.getName(isoCode.toUpperCase(), 'es') ?? isoCode
}

export function listCountries(): CountryOption[] {
  if (countriesCache) return countriesCache
  countriesCache = Country.getAllCountries()
    .map((c) => ({
      isoCode: c.isoCode,
      name: getSpanishCountryName(c.isoCode),
    }))
    .filter((c) => c.name)
    .sort((a, b) => a.name.localeCompare(b.name, 'es'))
  return countriesCache
}

function toDisplayCityName(rawName: string, countryCode: string): string {
  if (countryCode === 'ES' && CITY_LABEL_ES[rawName]) {
    return CITY_LABEL_ES[rawName]
  }
  if (countryCode === 'AR' && rawName === 'Cordoba') {
    return 'Córdoba'
  }
  if (CITY_LABEL_ES[rawName]) {
    return CITY_LABEL_ES[rawName]
  }
  return rawName
}

export function listCitiesForCountry(countryCode: string): CityOption[] {
  const code = countryCode.toUpperCase()
  const cached = citiesCache.get(code)
  if (cached) return cached

  const raw = City.getCitiesOfCountry(code) ?? []
  const seen = new Set<string>()
  const out: CityOption[] = []

  for (const c of raw) {
    const display = toDisplayCityName(c.name, code)
    const dedupeKey = normalizeKey(display)
    if (seen.has(dedupeKey)) continue
    seen.add(dedupeKey)
    out.push({ name: display })
  }

  out.sort((a, b) => a.name.localeCompare(b.name, 'es'))
  citiesCache.set(code, out)
  return out
}

export function isValidLocation(value: Partial<LocationValue> | null | undefined): value is LocationValue {
  if (!value?.countryCode || !value.country?.trim() || !value.city?.trim()) return false
  const code = value.countryCode.toUpperCase()
  const countryName = value.country.trim()
  const countryOk = listCountries().some((c) => c.isoCode === code && c.name === countryName)
  if (!countryOk) return false
  const cityKey = normalizeKey(value.city)
  return listCitiesForCountry(code).some((c) => normalizeKey(c.name) === cityKey)
}

export function resolveCountryCodeFromName(name: string): string | null {
  const key = normalizeKey(name)
  const hit = listCountries().find((c) => normalizeKey(c.name) === key)
  return hit?.isoCode ?? null
}

/** Acepta texto libre previo (registro antiguo) y lo mapea al catálogo si es posible */
export function resolveLegacyLocation(
  countryText: string,
  cityText: string,
): LocationValue | null {
  const countryTrim = countryText.trim()
  const cityTrim = cityText.trim()
  if (!countryTrim || !cityTrim) return null

  const code =
    resolveCountryCodeFromName(countryTrim) ??
    (normalizeKey(countryTrim) === 'espana' || normalizeKey(countryTrim) === 'spain' ? 'ES' : null) ??
    (normalizeKey(countryTrim) === 'mexico' ? 'MX' : null) ??
    (normalizeKey(countryTrim) === 'argentina' ? 'AR' : null) ??
    (normalizeKey(countryTrim) === 'colombia' ? 'CO' : null)

  if (!code) return null

  const country = getSpanishCountryName(code)
  const cityHit = listCitiesForCountry(code).find((c) => normalizeKey(c.name) === normalizeKey(cityTrim))
  if (cityHit) {
    return { countryCode: code, country, city: cityHit.name }
  }

  return null
}

export function buildLocationValue(countryCode: string, cityName: string): LocationValue | null {
  const code = countryCode.toUpperCase()
  const country = getSpanishCountryName(code)
  const city = cityName.trim()
  if (!city) return null
  const candidate: LocationValue = { countryCode: code, country, city }
  return isValidLocation(candidate) ? candidate : null
}

export function emptyLocation(): LocationValue {
  const code = DEFAULT_COUNTRY_CODE
  return {
    countryCode: code,
    country: getSpanishCountryName(code),
    city: '',
  }
}
