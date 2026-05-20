import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'

import { TOUR_STEPS } from './tourSteps'
import type { TourContextValue, TourState, TourStorageKeys } from './types'

const STORAGE_KEY_COMPLETED = 'lw_tour_completed_v1'
const STORAGE_KEY_PRO_COMPLETED = 'lw_pro_tour_completed_v1'
const STORAGE_KEY_PROGRESS = 'lw_tour_progress'

/** Claves por negocio: evita que el tour de otro usuario en el mismo navegador bloquee al nuevo. */
function tourStorageKeys(businessId: number) {
  const suffix = `_${businessId}`
  return {
    completed: `${STORAGE_KEY_COMPLETED}${suffix}`,
    proCompleted: `${STORAGE_KEY_PRO_COMPLETED}${suffix}`,
    progress: `${STORAGE_KEY_PROGRESS}${suffix}`,
  }
}

const TourContext = createContext<TourContextValue | null>(null)

interface PersistedProgress {
  stepIndex: number
  savedAt: number
}

function readCompleted(keys: ReturnType<typeof tourStorageKeys>): boolean {
  try {
    return window.localStorage.getItem(keys.completed) === 'true'
  } catch {
    return false
  }
}
function readProCompleted(keys: ReturnType<typeof tourStorageKeys>, businessId: number): boolean {
  try {
    if (window.localStorage.getItem(keys.proCompleted) === 'true') return true
    const legacyKey = `lw_tour_pro_completed_v1_${businessId}`
    return window.localStorage.getItem(legacyKey) === 'true'
  } catch {
    return false
  }
}
function writeCompleted(keys: ReturnType<typeof tourStorageKeys>, value: boolean): void {
  try {
    window.localStorage.setItem(keys.completed, value ? 'true' : 'false')
  } catch {
    /* modo privado: ignoramos */
  }
}
function writeProCompleted(keys: ReturnType<typeof tourStorageKeys>, value: boolean): void {
  try {
    window.localStorage.setItem(keys.proCompleted, value ? 'true' : 'false')
  } catch {
    /* no-op */
  }
}
function readProgress(keys: ReturnType<typeof tourStorageKeys>): PersistedProgress | null {
  try {
    const raw = window.localStorage.getItem(keys.progress)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      'stepIndex' in parsed &&
      typeof (parsed as { stepIndex: unknown }).stepIndex === 'number'
    ) {
      const p = parsed as PersistedProgress
      return { stepIndex: p.stepIndex, savedAt: typeof p.savedAt === 'number' ? p.savedAt : Date.now() }
    }
    return null
  } catch {
    return null
  }
}
function writeProgress(keys: ReturnType<typeof tourStorageKeys>, p: PersistedProgress | null): void {
  try {
    if (p === null) {
      window.localStorage.removeItem(keys.progress)
    } else {
      window.localStorage.setItem(keys.progress, JSON.stringify(p))
    }
  } catch {
    /* no-op */
  }
}

/** Limpia claves globales legacy (pre-scope) que bloqueaban usuarios nuevos en el mismo navegador. */
function clearLegacyTourStorage(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY_COMPLETED)
    window.localStorage.removeItem(STORAGE_KEY_PRO_COMPLETED)
    window.localStorage.removeItem('lw_tour_pro_completed_v1')
    window.localStorage.removeItem(STORAGE_KEY_PROGRESS)
  } catch {
    /* no-op */
  }
}

/**
 * Encuentra el siguiente paso visible empezando en `from` (incluido).
 * - Modo normal: salta proOnly si el usuario es Free.
 * - proOnlyMode: pasos proOnly + proUpgrade (mini-tour tras upgrade).
 */
function isProMiniTourStep(step: (typeof TOUR_STEPS)[number]): boolean {
  return Boolean(step.proOnly) || Boolean(step.proUpgrade)
}

function findNextUnlocked(from: number, isPro: boolean, proOnlyMode: boolean): number {
  let i = from
  while (i < TOUR_STEPS.length) {
    const step = TOUR_STEPS[i]
    if (proOnlyMode) {
      if (isProMiniTourStep(step)) return i
    } else if (!step.proOnly || isPro) {
      return i
    }
    i += 1
  }
  return -1
}

function findPrevUnlocked(from: number, isPro: boolean, proOnlyMode: boolean): number {
  let i = from
  while (i >= 0) {
    const step = TOUR_STEPS[i]
    if (proOnlyMode) {
      if (isProMiniTourStep(step)) return i
    } else if (!step.proOnly || isPro) {
      return i
    }
    i -= 1
  }
  return 0
}

interface TourProviderProps {
  children: ReactNode
  businessId: number
  /** Solo ofrecemos el tour tras publicar (onboarding cerrado en backend). */
  onboardingCompletedAt?: string | null
  backendCompletedAt?: string | null
  backendProCompletedAt?: string | null
  isPro?: boolean
  /** Pro con subdominio aleatorio: no mostrar tour hasta elegir slug custom (o posponer). */
  subdomainSetupBlocking?: boolean
}

export function TourProvider({
  children,
  businessId,
  onboardingCompletedAt,
  backendCompletedAt,
  backendProCompletedAt,
  isPro = false,
  subdomainSetupBlocking = false,
}: TourProviderProps) {
  const storageKeys = useMemo(() => tourStorageKeys(businessId), [businessId])

  const persistedProDone =
    readProCompleted(storageKeys, businessId) || backendProCompletedAt != null
  const proOnlyMode =
    backendCompletedAt != null &&
    isPro &&
    backendProCompletedAt == null &&
    !readProCompleted(storageKeys, businessId)
  const mainTourDone = readCompleted(storageKeys) || backendCompletedAt != null
  const fullyDone = mainTourDone && (!isPro || persistedProDone)
  const tourEligible = onboardingCompletedAt != null && !fullyDone

  useEffect(() => {
    if (backendCompletedAt == null) {
      clearLegacyTourStorage()
    }
  }, [backendCompletedAt])

  const persistedProgress = readProgress(storageKeys)
  const hasResumableProgress =
    tourEligible && persistedProgress !== null && !fullyDone && !proOnlyMode

  const [state, setState] = useState<TourState>(() => {
    if (fullyDone) {
      return {
        isOpen: false,
        currentStepIndex: -1,
        isFinished: true,
        isDismissed: true,
        showWelcome: false,
      }
    }
    if (!proOnlyMode && persistedProDone) {
      return {
        isOpen: false,
        currentStepIndex: -1,
        isFinished: true,
        isDismissed: true,
        showWelcome: false,
      }
    }
    if (proOnlyMode) {
      return {
        isOpen: false,
        currentStepIndex: -1,
        isFinished: false,
        isDismissed: persistedProDone,
        showWelcome: !persistedProDone && !subdomainSetupBlocking,
      }
    }
    return {
      isOpen: false,
      currentStepIndex: persistedProgress?.stepIndex ?? -1,
      isFinished: false,
      isDismissed: false,
      showWelcome: tourEligible && !hasResumableProgress && !subdomainSetupBlocking,
    }
  })

  useEffect(() => {
    if (!subdomainSetupBlocking) return
    setState((prev) => ({
      ...prev,
      isOpen: false,
      showWelcome: false,
    }))
  }, [subdomainSetupBlocking])

  /** Tras onboarding la cache de /dashboard/business puede llegar sin `onboarding_completed_at`. */
  useEffect(() => {
    if (onboardingCompletedAt == null || subdomainSetupBlocking) return

    const progress = readProgress(storageKeys)
    const resumable = progress !== null && !fullyDone && !proOnlyMode

    setState((prev) => {
      if (prev.isFinished || prev.isOpen) return prev

      if (proOnlyMode) {
        if (persistedProDone || prev.showWelcome) return prev
        return { ...prev, showWelcome: true }
      }

      if (resumable || prev.showWelcome) return prev
      return { ...prev, showWelcome: true }
    })
  }, [
    onboardingCompletedAt,
    subdomainSetupBlocking,
    storageKeys,
    fullyDone,
    proOnlyMode,
    persistedProDone,
  ])

  const isProRef = useRef<boolean>(isPro)
  isProRef.current = isPro
  const proOnlyModeRef = useRef<boolean>(proOnlyMode)
  proOnlyModeRef.current = proOnlyMode

  const storageKeysRef = useRef(storageKeys)
  storageKeysRef.current = storageKeys

  const markTourComplete = useCallback((): void => {
    const keys = storageKeysRef.current
    if (proOnlyModeRef.current) {
      writeProCompleted(keys, true)
    } else {
      writeCompleted(keys, true)
      // Pro tras onboarding: un solo tour cubre pasos generales + Pro; no mini-tour aparte.
      if (isProRef.current) {
        writeProCompleted(keys, true)
      }
    }
    writeProgress(keys, null)
  }, [])

  const start = useCallback((): void => {
    const keys = storageKeysRef.current
    const resume = proOnlyModeRef.current ? null : readProgress(keys)
    const startIndex =
      resume !== null
        ? Math.max(0, Math.min(TOUR_STEPS.length - 1, resume.stepIndex))
        : findNextUnlocked(0, isProRef.current, proOnlyModeRef.current)
    setState({
      isOpen: true,
      currentStepIndex: startIndex,
      isFinished: false,
      isDismissed: false,
      showWelcome: false,
    })
    writeProgress(keys, { stepIndex: startIndex, savedAt: Date.now() })
  }, [])

  const stop = useCallback((): void => {
    setState((prev) => {
      const keys = storageKeysRef.current
      if (prev.currentStepIndex >= 0 && !prev.isFinished) {
        writeProgress(keys, { stepIndex: prev.currentStepIndex, savedAt: Date.now() })
      }
      return { ...prev, isOpen: false, showWelcome: false }
    })
  }, [])

  const next = useCallback((): void => {
    setState((prev) => {
      const candidate = prev.currentStepIndex + 1
      const target = findNextUnlocked(candidate, isProRef.current, proOnlyModeRef.current)

      if (target === -1) {
        markTourComplete()
        return {
          ...prev,
          isFinished: true,
          isOpen: true,
          currentStepIndex: -1,
          isDismissed: false,
          showWelcome: false,
        }
      }

      writeProgress(storageKeysRef.current, { stepIndex: target, savedAt: Date.now() })
      return { ...prev, currentStepIndex: target, showWelcome: false }
    })
  }, [markTourComplete])

  const prev = useCallback((): void => {
    setState((p) => {
      const target = findPrevUnlocked(p.currentStepIndex - 1, isProRef.current, proOnlyModeRef.current)
      writeProgress(storageKeysRef.current, { stepIndex: target, savedAt: Date.now() })
      return { ...p, currentStepIndex: target, showWelcome: false }
    })
  }, [])

  const goToStep = useCallback((index: number): void => {
    setState((p) => {
      const target = Math.max(0, Math.min(TOUR_STEPS.length - 1, index))
      writeProgress(storageKeysRef.current, { stepIndex: target, savedAt: Date.now() })
      return { ...p, currentStepIndex: target, showWelcome: false }
    })
  }, [])

  const finish = useCallback((): void => {
    markTourComplete()
    setState({
      isOpen: false,
      currentStepIndex: -1,
      isFinished: true,
      isDismissed: false,
      showWelcome: false,
    })
  }, [markTourComplete])

  const dismissFinish = useCallback((): void => {
    setState((p) => ({ ...p, isDismissed: true }))
  }, [])

  const value = useMemo<TourContextValue>(
    () => ({
      state,
      storageKeys,
      proOnlyMode,
      start,
      stop,
      next,
      prev,
      goToStep,
      finish,
      dismissFinish,
    }),
    [state, storageKeys, proOnlyMode, start, stop, next, prev, goToStep, finish, dismissFinish],
  )

  return <TourContext.Provider value={value}>{children}</TourContext.Provider>
}

export function useTour(): TourContextValue {
  const ctx = useContext(TourContext)
  if (ctx === null) {
    throw new Error('useTour() must be called inside <TourProvider>')
  }
  return ctx
}

export const TOUR_STORAGE_KEYS = {
  completed: STORAGE_KEY_COMPLETED,
  proCompleted: STORAGE_KEY_PRO_COMPLETED,
  progress: STORAGE_KEY_PROGRESS,
} as const
