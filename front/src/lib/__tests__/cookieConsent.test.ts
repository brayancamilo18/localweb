import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  CONSENT_KEY,
  CONSENT_VERSION,
  getConsent,
  hasConsent,
  onConsentChange,
  writeConsent,
  type CookieConsentData,
} from '../cookieConsent'

const sampleConsent = (): CookieConsentData => ({
  version: CONSENT_VERSION,
  necessary: true,
  analytics: true,
  marketing: false,
  preferences: false,
  updatedAt: new Date().toISOString(),
})

describe('cookieConsent', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    localStorage.clear()
  })

  it('getConsent returns null when localStorage is empty', () => {
    expect(getConsent()).toBeNull()
  })

  it('getConsent returns null when version does not match', () => {
    localStorage.setItem(
      CONSENT_KEY,
      JSON.stringify({ ...sampleConsent(), version: CONSENT_VERSION + 99 }),
    )
    expect(getConsent()).toBeNull()
  })

  it('hasConsent(analytics) is false without stored consent', () => {
    expect(hasConsent('analytics')).toBe(false)
  })

  it('hasConsent(necessary) is true when consent exists even if analytics is false', () => {
    writeConsent({ ...sampleConsent(), analytics: false })
    expect(hasConsent('necessary')).toBe(true)
    expect(hasConsent('analytics')).toBe(false)
  })

  it('onConsentChange invokes callback on CustomEvent', () => {
    const cb = vi.fn()
    const unsub = onConsentChange(cb)

    const payload = sampleConsent()
    window.dispatchEvent(new CustomEvent('onez:cookie-consent', { detail: payload }))

    expect(cb).toHaveBeenCalledWith(payload)
    unsub()
  })
})
