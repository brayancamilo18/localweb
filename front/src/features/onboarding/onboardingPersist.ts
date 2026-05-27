import type { Schedule } from '../../types/api'
import { DEFAULT_SCHEDULE } from '../../lib/schedule/scheduleDefaults'

/** Clave histórica sin usuario: provocaba mezclar borradores entre cuentas en el mismo navegador. */
const LEGACY_STORAGE_KEY = 'lw.onboarding.wizard.v1'
const KEY_PREFIX = 'lw.onboarding.wizard.v1'

export type OnboardingStep1VariantPersist =
  | 'noir-elite'
  | 'bloom-studio'
  | 'urban-bold'
  | 'coastal-calm'
  | 'craft-pro'
  | 'tavola-warm'
  | 'tech-sleek'
  | 'trust-clinic'
  | 'versa-studio'
  | 'mono-edito'
  | 'luxe-atelier'
  | 'graphite-soft'
  | 'wild-pet'

export type OnboardingStep1SubStepPersist = 'logo' | 'template'

export type OnboardingPersistedV1 = {
  v: 1
  updatedAt: number
  step: number
  /** Sub-paso dentro del paso 1: logo antes de elegir plantilla. */
  step1SubStep?: OnboardingStep1SubStepPersist
  previewName: string
  previewTagline: string
  previewPhone: string
  previewDescription: string
  previewAddress: string
  previewCity: string
  previewCountry: string
  previewCountryCode: string
  previewEmail: string
  schedule: Schedule
  step1PreviewVariant?: OnboardingStep1VariantPersist
  /** Escala del logo en barra (paso 1), ~0.55–1.35 */
  step1LogoScale?: number
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
        step1SubStep: data.step1SubStep ?? prev?.step1SubStep,
        previewName: data.previewName ?? prev?.previewName ?? '',
        previewTagline: data.previewTagline ?? prev?.previewTagline ?? '',
        previewPhone: data.previewPhone ?? prev?.previewPhone ?? '',
        previewDescription: data.previewDescription ?? prev?.previewDescription ?? '',
        previewAddress: data.previewAddress ?? prev?.previewAddress ?? '',
        previewCity: data.previewCity ?? prev?.previewCity ?? '',
        previewCountry: data.previewCountry ?? prev?.previewCountry ?? '',
        previewCountryCode: data.previewCountryCode ?? prev?.previewCountryCode ?? '',
        previewEmail: data.previewEmail ?? prev?.previewEmail ?? '',
        schedule: data.schedule ?? prev?.schedule ?? DEFAULT_SCHEDULE,
        step1PreviewVariant: data.step1PreviewVariant ?? prev?.step1PreviewVariant,
        step1LogoScale: data.step1LogoScale ?? prev?.step1LogoScale,
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

const galleryFileKey = (f: File) => `${f.name}\u0000${f.size}\u0000${f.lastModified}`

/**
 * Fusiona fotos locales con las descargadas del servidor sin pisar lo que el usuario ya añadió.
 * Orden: primero `fromServer` (orden del API), después `existing` que no estén duplicadas.
 * Respeta `maxSlots` (p. ej. 3 Free / 20 Pro).
 */
export function mergeGalleryFiles(existing: File[], fromServer: File[], maxSlots: number): File[] {
  const cap = Math.max(0, Math.min(maxSlots, 20))
  const seen = new Set<string>()
  const out: File[] = []

  for (const f of fromServer) {
    const k = galleryFileKey(f)
    if (seen.has(k) || out.length >= cap) continue
    seen.add(k)
    out.push(f)
  }
  for (const f of existing) {
    const k = galleryFileKey(f)
    if (seen.has(k) || out.length >= cap) continue
    seen.add(k)
    out.push(f)
  }
  return out
}

/** URLs de vista previa de galería en el borrador del servidor (`OnboardingPage` / status API). */
export function galleryPreviewUrlsFromDraft(draft: Record<string, unknown> | undefined): string[] {
  const raw = draft?.gallery_preview_urls
  if (!Array.isArray(raw)) return []
  return raw
    .filter((u): u is string => typeof u === 'string' && u.trim().length > 0)
    .map((u) => u.trim())
}

/**
 * Borrador devuelto por `draftFromBusiness()` tras step7 Pro: las fotos ya están en R2 / `business_images`.
 * `gallery_paths` son marcadores `__synced__`, no rutas bajo `onboarding/{id}/gallery`.
 */
export function isDraftGallerySyncedFromBusiness(draft: Record<string, unknown> | undefined): boolean {
  const paths = draft?.gallery_paths
  if (!Array.isArray(paths) || paths.length === 0) {
    return false
  }
  return paths.every((p) => p === '__synced__')
}

/** Hay galería ya guardada (servidor o negocio), no reenviar todas las fotos al avanzar. */
export function hasPersistedGalleryInDraft(draft: Record<string, unknown> | undefined): boolean {
  if (isDraftGallerySyncedFromBusiness(draft)) {
    return true
  }
  const paths = draft?.gallery_paths
  if (Array.isArray(paths) && paths.some((p) => typeof p === 'string' && p.length > 0)) {
    return true
  }
  return galleryPreviewUrlsFromDraft(draft).length > 0
}
