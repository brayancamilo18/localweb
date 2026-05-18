import { beforeEach, describe, expect, it } from 'vitest'
import { REFERRAL_CODE_KEY } from '../referralStorage'
import { resolveReferralLandingAction } from '../referralLanding'

describe('resolveReferralLandingAction', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('redirects home when code is invalid', () => {
    expect(resolveReferralLandingAction('INVALID!')).toEqual({ type: 'redirect', to: 'home' })
    expect(localStorage.getItem(REFERRAL_CODE_KEY)).toBeNull()
  })

  it('stores valid code and redirects to register', () => {
    expect(resolveReferralLandingAction('abcd1234')).toEqual({ type: 'redirect', to: 'register' })
    expect(localStorage.getItem(REFERRAL_CODE_KEY)).toBe('abcd1234')
  })
})
