import type { LocationPickerProps } from '../../components/location/LocationPicker'
import { buildLocationValue } from '../../lib/location/locationData'

/** Mock ligero para tests de registro: permite fijar Madrid / España válidos. */
export function RegisterLocationPickerMock({ value, onChange, cityError, countryError }: LocationPickerProps) {
  return (
    <>
      <label htmlFor="reg-mock-city">Ciudad</label>
      <input
        id="reg-mock-city"
        aria-label="Ciudad"
        aria-invalid={cityError ? true : undefined}
        value={value.city}
        onChange={(e) => {
          const city = e.target.value
          const built = buildLocationValue(value.countryCode || 'ES', city)
          onChange(
            built ?? {
              ...value,
              city,
            },
          )
        }}
      />
      {cityError ? <span>{cityError}</span> : null}
      <label htmlFor="reg-mock-country">País</label>
      <input
        id="reg-mock-country"
        aria-label="País"
        aria-invalid={countryError ? true : undefined}
        value={value.country}
        readOnly
      />
      {countryError ? <span>{countryError}</span> : null}
    </>
  )
}
