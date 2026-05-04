import type { Schedule } from '../../types/api'
import { DEFAULT_SCHEDULE } from './wizard'

/** Clave histórica sin usuario: provocaba mezclar borradores entre cuentas en el mismo navegador. */
const LEGACY_STORAGE_KEY = 'lw.onboarding.wizard.v1'
const KEY_PREFIX = 'lw.onboarding.wizard.v1'

export type OnboardingStep1VariantPersist = 'noir-elite' | 'bloom-studio'

export type OnboardingPersistedV1 = {
  v: 1
  updatedAt: number
  step: number
  previewName: string
  previewTagline: string
  previewPhone: string
  previewDescription: string
  previewAddress: string
  previewEmail: string
  schedule: Schedule
  step1PreviewVariant?: OnboardingStep1VariantPersist
  coverDataUrl?: string
  aboutDataUrl?: string
  galleryDataUrls?: string[]
}

let saveTimer: ReturnType<typeof setTimeout> | undefined

export function onboardingStorageKey(userId: number): string {
  return `${KEY_PREFIX}:u${userId}`
}

export function loadOnboardingPersist(userId: number | null | undefined): OnboardingPersistedV1 | null {
  if (userId == null || !Number.isFinite(userId)) return null
  try {
    const raw = localStorage.getItem(onboardingStorageKey(userId))
    if (!raw) return null
    const p = JSON.parse(raw) as OnboardingPersistedV1
    if (p?.v !== 1 || typeof p.step !== 'number') return null
    return p
  } catch {
    return null
  }
}

/** Borra el borrador local de un usuario concreto (p. ej. al terminar onboarding). */
export function clearOnboardingPersistForUser(userId: number): void {
  try {
    localStorage.removeItem(onboardingStorageKey(userId))
  } catch {
    /* ignore */
  }
}

/**
 * Elimina la clave legacy y todos los borradores `lw.onboarding.wizard.v1:u*`.
 * Usar en logout y registro (nueva cuenta en el mismo navegador).
 */
export function clearAllOnboardingPersist(): void {
  try {
    localStorage.removeItem(LEGACY_STORAGE_KEY)
    const toRemove: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (k?.startsWith(`${KEY_PREFIX}:`)) toRemove.push(k)
    }
    for (const k of toRemove) {
      localStorage.removeItem(k)
    }
  } catch {
    /* ignore */
  }
}

export function scheduleSaveOnboardingPersist(
  userId: number | null | undefined,
  data: Partial<OnboardingPersistedV1>,
): void {
  if (userId == null || !Number.isFinite(userId)) return
  clearTimeout(saveTimer)
  saveTimer = setTimeout(() => {
    try {
      const prev = loadOnboardingPersist(userId)
      const merged: OnboardingPersistedV1 = {
        v: 1,
        updatedAt: Date.now(),
        step: data.step ?? prev?.step ?? 1,
        previewName: data.previewName ?? prev?.previewName ?? '',
        previewTagline: data.previewTagline ?? prev?.previewTagline ?? '',
        previewPhone: data.previewPhone ?? prev?.previewPhone ?? '',
        previewDescription: data.previewDescription ?? prev?.previewDescription ?? '',
        previewAddress: data.previewAddress ?? prev?.previewAddress ?? '',
        previewEmail: data.previewEmail ?? prev?.previewEmail ?? '',
        schedule: data.schedule ?? prev?.schedule ?? DEFAULT_SCHEDULE,
        step1PreviewVariant: data.step1PreviewVariant ?? prev?.step1PreviewVariant,
        coverDataUrl: data.coverDataUrl ?? prev?.coverDataUrl,
        aboutDataUrl: data.aboutDataUrl ?? prev?.aboutDataUrl,
        galleryDataUrls: data.galleryDataUrls ?? prev?.galleryDataUrls,
      }
      let str = JSON.stringify(merged)
      const MAX_JSON_CHARS = 4_200_000
      if (str.length > MAX_JSON_CHARS) {
        merged.galleryDataUrls = undefined
        str = JSON.stringify(merged)
      }
      if (str.length > MAX_JSON_CHARS) {
        merged.coverDataUrl = undefined
        merged.aboutDataUrl = undefined
        str = JSON.stringify(merged)
      }
      localStorage.setItem(onboardingStorageKey(userId), str)
    } catch {
      /* quota or private mode */
    }
  }, 400)
}

export function isPersistableSchedule(s: unknown): s is Schedule {
  if (!s || typeof s !== 'object') return false
  const days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const
  return days.every((d) => {
    const x = (s as Record<string, unknown>)[d]
    return x && typeof x === 'object' && 'open' in x && 'close' in x && 'closed' in x
  })
}

export async function dataUrlToFile(dataUrl: string, filename: string): Promise<File | null> {
  try {
    const res = await fetch(dataUrl)
    const blob = await res.blob()
    return new File([blob], filename, { type: blob.type || 'image/jpeg' })
  } catch {
    return null
  }
}
