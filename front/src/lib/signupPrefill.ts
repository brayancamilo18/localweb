const KEY = 'lw_signup_prefill'
const AT_KEY = 'lw_signup_prefill_at'
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000 // 7 días

export interface SignupPrefill {
  business_name?: string
  sector?: string
  city?: string
  country?: string
  country_code?: string
}

export function storeSignupPrefill(data: SignupPrefill): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(data))
    localStorage.setItem(AT_KEY, String(Date.now()))
  } catch {
    /* sandbox o storage lleno: ignorar */
  }
}

export function readSignupPrefill(): SignupPrefill | null {
  try {
    const raw = localStorage.getItem(KEY)
    const atRaw = localStorage.getItem(AT_KEY)
    if (!raw?.trim()) return null

    // Si tiene timestamp y es viejo, lo descartamos
    if (atRaw) {
      const at = Number(atRaw)
      if (Number.isFinite(at) && Date.now() - at > MAX_AGE_MS) {
        clearSignupPrefill()
        return null
      }
    }

    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== 'object') return null

    return parsed as SignupPrefill
  } catch {
    return null
  }
}

export function clearSignupPrefill(): void {
  try {
    localStorage.removeItem(KEY)
    localStorage.removeItem(AT_KEY)
  } catch {
    /* ignore */
  }
}
