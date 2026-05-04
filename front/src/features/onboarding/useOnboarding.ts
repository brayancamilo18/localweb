import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { isOnboardingPreviewWithoutAuth } from '../../config/devFlags'
import { me } from '../../api/auth'
import { getStatus, step1, step2, step3, step4, step5, step6, step7, step8 } from '../../api/onboarding'
import { keys } from '../../api/queryKeys'
import { useAuthStore } from '../../store/authStore'
import type { Schedule } from '../../types/api'
import { clearOnboardingPersistForUser, loadOnboardingPersist } from './onboardingPersist'

/** Paso visible en el wizard (1–8) a partir del borrador guardado en servidor. */
function resolveOnboardingUiStep(draft: Record<string, unknown> | undefined): number {
  if (!draft?.template_id || Number(draft.template_id) <= 0) return 1
  if (!draft.cover_path) return 2
  if (!draft.business_name) return 3
  if (!Array.isArray(draft.gallery_paths) || draft.gallery_paths.length === 0) return 4
  if (!draft.schedule) return 5
  if (!draft.address || !draft.phone) return 6
  return 7
}

function parseApiErrors(error: unknown): Record<string, string> {
  const response = (error as { response?: { status?: number; data?: { message?: string; errors?: Record<string, string[] | string> } } })
    ?.response
  const status = response?.status
  if (status === 413) {
    return {
      message:
        'Las fotos pesan demasiado para el servidor. Ya las optimizamos antes de enviar; si sigue fallando, prueba con menos imágenes o reconstruye los contenedores (nginx/php) con la última configuración.',
    }
  }
  const res = response?.data
  const out: Record<string, string> = {}
  if (res?.message) out.message = res.message
  if (res?.errors) {
    for (const [key, val] of Object.entries(res.errors)) {
      out[key] = Array.isArray(val) ? val[0] ?? '' : String(val)
    }
  }
  if (Object.keys(out).length === 0) out.message = 'No se pudo continuar con este paso'
  return out
}

export type ProExtrasSource = 'gallery' | 'publish' | null

export type UseOnboardingResult = {
  currentStep: number
  isPendingStatus: boolean
  isLoading: boolean
  errors: Record<string, string>
  goNext: (data?: unknown) => Promise<void>
  goPrev: () => void
  jumpToStep: (step: number, opts?: { allowForward?: boolean }) => void
  /** Borrador del servidor (texto, rutas, horario guardado, etc.) para hidratar el formulario. */
  serverDraft: Record<string, unknown> | undefined
  /** Tras Stripe: mostrar banner en galería y límite Pro hasta salir del paso 4. */
  postCheckoutProGallery: boolean
  /** Origen del paso 9 extras (para «Atrás»). */
  proExtrasSource: ProExtrasSource
  /** Tras ir al dashboard desde el paso 9. */
  resetProExtrasFlow: () => void
}

export function useOnboarding(): UseOnboardingResult {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const queryClient = useQueryClient()
  const persistUserId = useAuthStore((s) => s.user?.id)
  const [currentStep, setCurrentStep] = useState(1)
  const [isPendingStatus, setIsPendingStatus] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [serverDraft, setServerDraft] = useState<Record<string, unknown> | undefined>(undefined)
  const [postCheckoutProGallery, setPostCheckoutProGallery] = useState(false)
  const [proExtrasSource, setProExtrasSource] = useState<ProExtrasSource>(null)
  const billingSuccessHandled = useRef(false)

  const resetProExtrasFlow = useCallback(() => {
    setPostCheckoutProGallery(false)
    setProExtrasSource(null)
  }, [])

  useEffect(() => {
    let mounted = true
    setIsPendingStatus(true)
    setCurrentStep(1)
    setServerDraft(undefined)
    getStatus()
      .then((status) => {
        if (!mounted) return
        if (status.is_complete) {
          setServerDraft({})
          navigate('/dashboard', { replace: true })
          return
        }
        const draft = (status.draft as Record<string, unknown> | undefined) ?? {}
        setServerDraft(draft)
        const resolved = resolveOnboardingUiStep(draft)
        const serverStep = typeof status.step === 'number' ? status.step : 1
        const fromServer = Math.min(9, Math.max(resolved, serverStep))
        const persisted = loadOnboardingPersist(persistUserId)
        const pStep = typeof persisted?.step === 'number' ? persisted.step : 0
        setCurrentStep(Math.min(9, Math.max(fromServer, pStep)))
      })
      .catch(() => {
        if (!mounted) return
        setServerDraft({})
        if (isOnboardingPreviewWithoutAuth()) {
          setCurrentStep(1)
        }
      })
      .finally(() => {
        if (mounted) setIsPendingStatus(false)
      })

    return () => {
      mounted = false
    }
  }, [navigate, persistUserId])

  /** Tras checkout Stripe: refrescar sesión, galería Pro y paso 4. */
  useEffect(() => {
    if (isPendingStatus) return
    if (billingSuccessHandled.current) return
    if (searchParams.get('billing') !== 'success') return
    billingSuccessHandled.current = true

    void (async () => {
      try {
        const token = localStorage.getItem('lw_token')
        if (token) {
          const fresh = await me()
          useAuthStore.getState().setAuth(token, fresh.user, fresh.business)
        }
        await queryClient.invalidateQueries({ queryKey: keys.auth.me })
      } catch {
        /* continuar igual: el paso 4 y queries pueden reintentar */
      } finally {
        setSearchParams({}, { replace: true })
        setPostCheckoutProGallery(true)
        setProExtrasSource('gallery')
        setErrors({})
        setCurrentStep(4)
      }
    })()
  }, [isPendingStatus, queryClient, searchParams, setSearchParams])

  const jumpToStep = useCallback((step: number, opts?: { allowForward?: boolean }) => {
    setErrors({})
    setCurrentStep((s) => {
      if (step < 1 || step > 9) return s
      if (opts?.allowForward) return step
      if (step < s) return step
      return s
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  const goNext = useCallback(
    async (data?: unknown) => {
      setErrors({})
      setIsLoading(true)
      try {
        switch (currentStep) {
          case 1: {
            const d = data as { template_id?: number; sector?: string } | undefined
            if (!d?.template_id) {
              setErrors({ template_id: 'Elige una plantilla' })
              return
            }
            await step1({ template_id: d.template_id, sector: d.sector ?? 'otros' })
            break
          }
          case 2:
            if (!(data instanceof File)) {
              setErrors({ cover: 'Selecciona una foto de portada' })
              return
            }
            await step2(data)
            break
          case 3: {
            const d = data as { business_name?: string; tagline?: string; description?: string; about_photo?: File }
            if (!d?.business_name?.trim()) {
              setErrors({ business_name: 'Indica el nombre del negocio' })
              return
            }
            await step3({
              business_name: d.business_name.trim(),
              tagline: d.tagline,
              description: d.description,
              about_photo: d.about_photo,
            })
            break
          }
          case 4: {
            await step4((data as File[]) ?? [])
            if (postCheckoutProGallery) {
              setPostCheckoutProGallery(false)
              setProExtrasSource('gallery')
              setCurrentStep(9)
              window.scrollTo({ top: 0, behavior: 'smooth' })
              return
            }
            break
          }
          case 5:
            await step5(data as Schedule)
            break
          case 6:
            await step6(data as { address: string; phone: string; email: string })
            break
          case 7: {
            const payload = data as { plan?: 'free' | 'pro' | null; subdomain?: string } | undefined
            if (!payload?.plan || (payload.plan !== 'free' && payload.plan !== 'pro')) {
              setErrors({ message: 'Elige un plan para continuar.' })
              return
            }
            const result = await step7({
              plan: payload.plan,
              subdomain: payload.subdomain,
            })
            if (result.checkout_url) {
              window.location.href = result.checkout_url
              return
            }
            break
          }
          case 8: {
            await step8()
            const token = localStorage.getItem('lw_token')
            if (token) {
              const fresh = await me()
              useAuthStore.getState().setAuth(token, fresh.user, fresh.business)
              if (fresh.business?.is_pro) {
                setProExtrasSource('publish')
                setCurrentStep(9)
                window.scrollTo({ top: 0, behavior: 'smooth' })
                return
              }
            }
            const uid = useAuthStore.getState().user?.id
            if (uid != null) clearOnboardingPersistForUser(uid)
            navigate('/dashboard')
            return
          }
          default:
            break
        }

        if (currentStep < 8) {
          setCurrentStep((s) => s + 1)
          window.scrollTo({ top: 0, behavior: 'smooth' })
        }
      } catch (e) {
        setErrors(parseApiErrors(e))
      } finally {
        setIsLoading(false)
      }
    },
    [currentStep, navigate, postCheckoutProGallery],
  )

  const goPrev = useCallback(() => {
    setErrors({})
    if (currentStep === 9) {
      const src = proExtrasSource
      if (src === 'gallery') {
        setCurrentStep(4)
      } else {
        setCurrentStep(8)
      }
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    setCurrentStep((prev) => Math.max(1, prev - 1))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [currentStep, proExtrasSource])

  return {
    currentStep,
    isPendingStatus,
    isLoading,
    errors,
    goNext,
    goPrev,
    jumpToStep,
    serverDraft,
    postCheckoutProGallery,
    proExtrasSource,
    resetProExtrasFlow,
  }
}
