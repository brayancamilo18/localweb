import { useMemo } from 'react'
import {
  getSpanishCountryName,
  listCitiesForCountry,
  listCountries,
} from '../../lib/location/locationData'
import type { LocationValue } from '../../lib/location/locationTypes'
import { SearchableCombobox } from './SearchableCombobox'

export type LocationPickerProps = {
  value: LocationValue
  onChange: (value: LocationValue) => void
  disabled?: boolean
  cityError?: string
  countryError?: string
  /** Si true, ciudad a la izquierda; por defecto país primero */
  cityFirst?: boolean
}

export function LocationPicker({
  value,
  onChange,
  disabled,
  cityError,
  countryError,
  cityFirst = false,
}: LocationPickerProps) {
  const countryOptions = useMemo(
    () => listCountries().map((c) => ({ value: c.isoCode, label: c.name })),
    [],
  )

  const cityOptions = useMemo(
    () => listCitiesForCountry(value.countryCode).map((c) => ({ value: c.name, label: c.name })),
    [value.countryCode],
  )

  const cityField = (
    <SearchableCombobox
      label="Ciudad"
      value={value.city}
      options={cityOptions}
      onChange={(city) => onChange({ ...value, city })}
      disabled={disabled || !value.countryCode}
      error={cityError}
      placeholder="Buscar ciudad…"
      prefixIcon="pin"
      emptyMessage="Elige un país primero o ajusta la búsqueda"
    />
  )

  const countryField = (
    <SearchableCombobox
      label="País"
      value={value.countryCode}
      options={countryOptions}
      onChange={(isoCode) => {
        onChange({
          countryCode: isoCode,
          country: getSpanishCountryName(isoCode),
          city: '',
        })
      }}
      disabled={disabled}
      error={countryError}
      placeholder="Buscar país…"
      prefixIcon="map"
    />
  )

  return (
    <div className="lw-location-picker">
      {cityFirst ? (
        <>
          {cityField}
          {countryField}
        </>
      ) : (
        <>
          {countryField}
          {cityField}
        </>
      )}
    </div>
  )
}
