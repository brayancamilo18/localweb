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
import { clearSignupPrefill } from '../../lib/signupPrefill'

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
    /** Post-Stripe: el efecto de `billing=success` decide el paso (galería).
     * El status del backend devuelve step=8 una vez creado el negocio Pro,
     * y eso pisaría el `setCurrentStep(4)` del otro efecto. Aquí nos limitamos
     * a leer el draft sin tocar `currentStep`. La detección se hace por URL
     * sync, NO por `searchParams.get` (que se vacía con `setSearchParams({})`
     * tras procesar el éxito y haría que la re-ejecución del efecto resolviera
     * step=8 al cambiar `persistUserId`). */
    const isBillingSuccess =
      typeof window !== 'undefined' &&
      new URLSearchParams(window.location.search).get('billing') === 'success'
    setIsPendingStatus(true)
    if (!isBillingSuccess) setCurrentStep(1)
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
        if (isBillingSuccess || billingSuccessHandled.current) {
          /** El efecto de `billing=success` controla el paso (galería). */
          return
        }
        const resolved = resolveOnboardingUiStep(draft)
        const serverStep = typeof status.step === 'number' ? status.step : 1
        const fromServer = Math.min(9, Math.max(resolved, serverStep))
        const persisted = loadOnboardingPersist(persistUserId)
        const pStep = typeof persisted?.step === 'number' ? persisted.step : 0
        // Sin plantilla elegida → siempre paso 1 (p. ej. tras cerrar sesión y volver a entrar).
        const step =
          fromServer <= 1 ? 1 : Math.min(9, Math.max(fromServer, pStep))
        setCurrentStep(step)
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

  /** Tras checkout Stripe: refrescar sesión y llevar al paso 8 (publicar). */
  useEffect(() => {
    if (isPendingStatus) return
    if (billingSuccessHandled.current) return
    if (searchParams.get('billing') !== 'success') return
    billingSuccessHandled.current = true

    void (async () => {
      try {
        const fresh = await me()
        useAuthStore.getState().setAuth(fresh.user, fresh.business)
        await queryClient.invalidateQueries({ queryKey: keys.auth.me })
        const status = await getStatus()
        if (status.is_complete) {
          navigate('/dashboard', { replace: true })
          return
        }
        const draft = (status.draft as Record<string, unknown> | undefined) ?? {}
        setServerDraft(draft)
      } catch {
        /* continuar al paso 8 aunque falle el refresh */
      }
      setSearchParams({}, { replace: true })
      setErrors({})
      setCurrentStep(8)
    })()
  }, [isPendingStatus, queryClient, searchParams, setSearchParams, navigate])

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
            const d = data as {
              template_id?: number
              sector?: string
              logo?: File | null
              removeLogo?: boolean
            } | undefined
            if (!d?.template_id) {
              setErrors({ template_id: 'Elige una plantilla' })
              return
            }
            await step1({
              template_id: d.template_id,
              sector: d.sector ?? 'otros',
              logo: d.logo ?? undefined,
              removeLogo: Boolean(d.removeLogo),
            })
            clearSignupPrefill()
            break
          }
          case 2: {
            const raw = data
            let cover: File | undefined
            let cover2: File | undefined
            let cover3: File | undefined
            let logo: File | undefined
            let removeLogo = false
            if (raw instanceof File) {
              cover = raw
            } else if (raw && typeof raw === 'object' && raw !== null && 'cover' in raw) {
              const d = raw as { cover?: File; cover2?: File; cover3?: File; logo?: File; removeLogo?: boolean }
              cover = d.cover
              cover2 = d.cover2
              cover3 = d.cover3
              logo = d.logo
              removeLogo = Boolean(d.removeLogo)
            }
            if (!(cover instanceof File)) {
              setErrors({ cover: 'Selecciona una foto de portada' })
              return
            }
            await step2({ cover, cover2, cover3, logo, removeLogo })
            break
          }
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
            const raw = data
            const photosToUpload = Array.isArray(raw) ? raw : []
            if (photosToUpload.length === 0) {
              setErrors({ photos: 'Añade al menos una foto a la galería' })
              return
            }
            await step4(photosToUpload, { replace: true })
            try {
              const status = await getStatus()
              setServerDraft((status.draft as Record<string, unknown> | undefined) ?? {})
            } catch {
              /* el paso ya guardó; el borrador se refrescará al recargar */
            }
            await queryClient.invalidateQueries({ queryKey: keys.dashboard.business })
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
            await step6(
              data as {
                address: string
                city: string
                country: string
                country_code: string
                phone: string
                email: string
              },
            )
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
            const fresh = await me()
            useAuthStore.getState().setAuth(fresh.user, fresh.business)
            // Sin esto se dispara el bucle onboarding ↔ dashboard al publicar: la cache de
            // useQuery(keys.auth.me) sigue con el business previo (sin onboarding_completed_at);
            // cuando ProtectedRoute monta y useAuth corre su useEffect con esa data antigua,
            // setAuth(viejo) sobreescribe lo que acabamos de hacer y `hasCompletedOnboarding`
            // vuelve a false → ping-pong de redirects entre /dashboard y /onboarding.
            queryClient.setQueryData(keys.auth.me, fresh)
            if (fresh.business) {
              queryClient.setQueryData(keys.dashboard.business, fresh.business)
            }
            if (fresh.business?.is_pro) {
              setProExtrasSource('publish')
              setCurrentStep(9)
              window.scrollTo({ top: 0, behavior: 'smooth' })
              return
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
    [currentStep, navigate, postCheckoutProGallery, queryClient],
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
