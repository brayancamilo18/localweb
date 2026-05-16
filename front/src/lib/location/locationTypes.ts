/** Valor canónico de ubicación (registro, onboarding, API). */
export type LocationValue = {
  countryCode: string
  country: string
  city: string
}

export type CountryOption = {
  isoCode: string
  name: string
}

export type CityOption = {
  /** Nombre guardado en BD y mostrado al usuario */
  name: string
}
