import { describe, expect, it } from 'vitest'
import { buildLocationValue, isValidLocation, resolveLegacyLocation } from '../locationData'

describe('locationData', () => {
  it('resuelve España + Madrid desde texto libre', () => {
    const loc = resolveLegacyLocation('España', 'Madrid')
    expect(loc).not.toBeNull()
    expect(loc?.countryCode).toBe('ES')
    expect(loc?.country).toBe('España')
    expect(loc?.city).toBe('Madrid')
    expect(isValidLocation(loc)).toBe(true)
  })

  it('valida ciudad canónica por código ISO', () => {
    const loc = buildLocationValue('ES', 'Madrid')
    expect(isValidLocation(loc)).toBe(true)
  })
})
