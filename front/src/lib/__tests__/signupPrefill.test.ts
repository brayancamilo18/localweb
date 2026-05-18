import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  clearSignupPrefill,
  readSignupPrefill,
  storeSignupPrefill,
} from '../signupPrefill'

describe('signupPrefill', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    localStorage.clear()
  })

  it('stores and reads prefill data', () => {
    storeSignupPrefill({
      business_name: 'Mi local',
      sector: 'peluqueria',
      city: 'Madrid',
      country: 'España',
      country_code: 'ES',
    })

    expect(readSignupPrefill()).toEqual({
      business_name: 'Mi local',
      sector: 'peluqueria',
      city: 'Madrid',
      country: 'España',
      country_code: 'ES',
    })
  })

  it('clears prefill', () => {
    storeSignupPrefill({ business_name: 'Test' })
    clearSignupPrefill()
    expect(readSignupPrefill()).toBeNull()
  })

  it('returns null when data is older than 7 days', () => {
    storeSignupPrefill({ business_name: 'Viejo' })
    localStorage.setItem('lw_signup_prefill_at', String(Date.now() - 8 * 24 * 60 * 60 * 1000))

    expect(readSignupPrefill()).toBeNull()
    expect(localStorage.getItem('lw_signup_prefill')).toBeNull()
  })
})
