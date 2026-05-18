import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  REFERRAL_AT_KEY,
  REFERRAL_CODE_KEY,
  REFERRAL_MAX_AGE_MS,
  getValidReferralCodeFromStorage,
  isValidReferralCodeFormat,
  storeReferralCode,
} from '../referralStorage'

describe('referralStorage', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-05-18T12:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('validates referral code format', () => {
    expect(isValidReferralCodeFormat('abc12345')).toBe(true)
    expect(isValidReferralCodeFormat('ABC12345')).toBe(false)
    expect(isValidReferralCodeFormat('short')).toBe(false)
  })

  it('returns stored code when younger than 30 days', () => {
    storeReferralCode('abcd1234')
    expect(getValidReferralCodeFromStorage()).toBe('abcd1234')
  })

  it('clears and returns undefined when older than 30 days', () => {
    storeReferralCode('abcd1234')
    vi.setSystemTime(new Date('2026-05-18T12:00:00Z').getTime() + REFERRAL_MAX_AGE_MS + 1)
    expect(getValidReferralCodeFromStorage()).toBeUndefined()
    expect(localStorage.getItem(REFERRAL_CODE_KEY)).toBeNull()
    expect(localStorage.getItem(REFERRAL_AT_KEY)).toBeNull()
  })
})
