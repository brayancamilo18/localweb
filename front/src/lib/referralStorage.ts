export const REFERRAL_CODE_KEY = 'onez_referral_code'
export const REFERRAL_AT_KEY = 'onez_referral_at'
export const REFERRAL_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000

const REFERRAL_CODE_PATTERN = /^[a-z0-9]{8}$/

export function isValidReferralCodeFormat(code: string): boolean {
  return REFERRAL_CODE_PATTERN.test(code)
}

export function storeReferralCode(code: string): void {
  localStorage.setItem(REFERRAL_CODE_KEY, code)
  localStorage.setItem(REFERRAL_AT_KEY, String(Date.now()))
}

export function clearReferralStorage(): void {
  localStorage.removeItem(REFERRAL_CODE_KEY)
  localStorage.removeItem(REFERRAL_AT_KEY)
}

export function getValidReferralCodeFromStorage(): string | undefined {
  const code = localStorage.getItem(REFERRAL_CODE_KEY)
  const atRaw = localStorage.getItem(REFERRAL_AT_KEY)
  if (!code || !atRaw) {
    return undefined
  }

  const at = Number(atRaw)
  if (!Number.isFinite(at) || Date.now() - at > REFERRAL_MAX_AGE_MS) {
    clearReferralStorage()
    return undefined
  }

  return isValidReferralCodeFormat(code) ? code : undefined
}
