import { isValidReferralCodeFormat, storeReferralCode } from './referralStorage'

export type ReferralLandingAction =
  | { type: 'redirect'; to: 'home' }
  | { type: 'redirect'; to: 'register' }

export function resolveReferralLandingAction(code: string | undefined): ReferralLandingAction {
  const normalized = (code ?? '').trim().toLowerCase()

  if (!isValidReferralCodeFormat(normalized)) {
    return { type: 'redirect', to: 'home' }
  }

  storeReferralCode(normalized)

  return { type: 'redirect', to: 'register' }
}
