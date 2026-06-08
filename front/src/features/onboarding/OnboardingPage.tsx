import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Btn } from '../../components/primitives'
import { apiClient } from '../../api/client'
import { getBusiness } from '../../api/dashboard'
import { getServices } from '../../api/services'
import { getAboutSections } from '../../api/aboutSections'
import { fetchOnboardingTemplates, hydrateGalleryFromServerUrls } from '../../api/onboarding'
import { keys } from '../../api/queryKeys'
import type { BusinessService, Schedule, Template } from '../../types/api'
import { mapServicesForTemplatePreview } from '../public-page/publicTemplatePayload'
import type { TemplateServicePayload } from '../public-page/publicTemplatePayload'
import { useOnboarding } from './useOnboarding'
import Step9ProSetup, { type Step9SetupPhase } from './steps/Step9ProSetup'
import { useBrandColor } from '../shared/useBrandColor'
import {
  dataUrlToFile,
  galleryPreviewUrlsFromDraft,
  isPersistableSchedule,
  loadOnboardingPersist,
  mergeGalleryFiles,
  scheduleSaveOnboardingPersist,
} from './onboardingPersist'
import { useAuthStore } from '../../store/authStore'
import { coerceLocation } from '../../lib/location/coerceLocation'
import { emptyLocation } from '../../lib/location/locationData'
import { DEFAULT_LOGO_NAV_SCALE } from '../../lib/logoDisplay'
import { readSignupPrefill } from '../../lib/signupPrefill'
import type { LocationValue } from '../../lib/location/locationTypes'
import {
  DEFAULT_SCHEDULE,
  GaleriaPreview,
  HorariosPreview,
  PlanPreview,
  PortadaPreview,
  ServiciosPreview,
  SobrePreview,
  Step1Plantilla,
  Step2Portada,
  Step3Sobre,
  Step4Galeria,
  Step5Horarios,
  Step6Ubicacion,
  Step7Plan,
  Step8Publicar,
  TplPreview,
  UbicacionPreview,
  WizardLayout,
  WizardNavContext,
  resolveStep1PreviewVariant,
  STEP1_PREVIEW_VARIANTS,
  type Step1PreviewVariant,
  type TemplatePreviewData,
} from './wizard'

/** Espejo de `TemplatePalette::cssVariableFor` del backend. Sin el prefijo
 * "var(" ni "--": solo el identificador. Si añades una plantilla nueva con
 * paleta brand, actualiza también este mapping. */
const TEMPLATE_BRAND_VARIABLE: Record<string, string> = {
  'bloom-studio': 'coral',
  'coastal-calm': 'terracotta',
  'craft-pro': 'orange',
  'graphite-soft': 'accent',
  'luxe-atelier': 'champagne',
  'mono-edito': 'accent',
  'noir-elite': 'gold',
  'tavola-warm': 'wine',
  'tech-sleek': 'cyan',
  'trust-clinic': 'accent',
  'urban-bold': 'lime',
  'versa-studio': 'warm',
  'la-republica-vintage': 'red',
  'kairos-bold': 'orange',
}

const EMPTY_TEMPLATES: Template[] = []

function OnboardingSkeleton() {
  return (
    <div style={{ height: '100dvh', padding: 32, background: 'var(--lw-bg)' }}>
      <div
        className="lw-shimmer"
        style={{ height: 48, borderRadius: 8, maxWidth: 360, marginBottom: 24 }}
      />
      <div className="lw-shimmer" style={{ height: 220, borderRadius: 12, marginBottom: 16 }} />
      <div className="lw-shimmer" style={{ height: 14, borderRadius: 4, maxWidth: '70%', marginBottom: 8 }} />
      <div className="lw-shimmer" style={{ height: 14, borderRadius: 4, maxWidth: '50%' }} />
    </div>
  )
}

export default function OnboardingPage() {
  const persistUserId = useAuthStore((s) => s.user?.id)
  const businessSubdomain = useAuthStore((s) => s.business?.subdomain)
  const authBusiness = useAuthStore((s) => s.business)
  const authBusinessName = authBusiness?.name?.trim() ?? ''
  const authBusinessCity = authBusiness?.city?.trim() ?? ''
  const authBusinessCountry = authBusiness?.country?.trim() ?? ''
  const authBusinessCountryCode = authBusiness?.country_code?.trim().toUpperCase() ?? ''
  const {
    currentStep,
    isPendingStatus,
    isLoading,
    errors,
    goNext,
    goPrev,
    jumpToStep,
    serverDraft,
    postCheckoutProGallery,
    resetProExtrasFlow,
  } = useOnboarding()
  const continueHandlerRef = useRef<(() => unknown) | null>(null)
  const wizardHydratedRef = useRef(false)
  const [galleryPreviewUrls, setGalleryPreviewUrls] = useState<string[]>([])
  /** Modo borrador: todas las fotos del paso 4 en un solo array. */
  const [galleryPhotoFiles, setGalleryPhotoFiles] = useState<File[]>([])
  const [galleryDirty, setGalleryDirty] = useState(false)
  const [schedulePreview, setSchedulePreview] = useState<Schedule>(DEFAULT_SCHEDULE)
  const [step1PreviewVariant, setStep1PreviewVariant] = useState<Step1PreviewVariant>('urban-bold')
  const [step1LogoPreviewUrl, setStep1LogoPreviewUrl] = useState<string | undefined>(undefined)
  const [step1LogoScale, setStep1LogoScale] = useState(DEFAULT_LOGO_NAV_SCALE)
  const [step1LogoFile, setStep1LogoFile] = useState<File | null>(null)
  const [step1PendingRemoveLogo, setStep1PendingRemoveLogo] = useState(false)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [coverFile2, setCoverFile2] = useState<File | null>(null)
  const [coverFile3, setCoverFile3] = useState<File | null>(null)
  const coverFile2Ref = useRef<File | null>(null)
  const coverFile3Ref = useRef<File | null>(null)
  coverFile2Ref.current = coverFile2
  coverFile3Ref.current = coverFile3
  const [previewName, setPreviewName] = useState('')
  const [previewTagline, setPreviewTagline] = useState('')
  const [previewPhone, setPreviewPhone] = useState('')
  /** Base64 solo para guardar el borrador local (localStorage); no usar en postMessage al iframe. */
  const [coverPersistDataUrl, setCoverPersistDataUrl] = useState<string | undefined>(undefined)
  /** URL efímera para vista previa en vivo (misma pestaña que el iframe → mismo origen). */
  const [coverLiveObjectUrl, setCoverLiveObjectUrl] = useState<string | undefined>(undefined)
  const [coverLiveObjectUrl2, setCoverLiveObjectUrl2] = useState<string | undefined>(undefined)
  const [coverLiveObjectUrl3, setCoverLiveObjectUrl3] = useState<string | undefined>(undefined)
  const [previewDescription, setPreviewDescription] = useState('')
  const [previewAboutTitle, setPreviewAboutTitle] = useState('')
  const [aboutTeamFile, setAboutTeamFile] = useState<File | null>(null)
  const [aboutPersistDataUrl, setAboutPersistDataUrl] = useState<string | undefined>(undefined)
  const [aboutLiveObjectUrl, setAboutLiveObjectUrl] = useState<string | undefined>(undefined)
  /** Objetos blob por archivo de galería; evita enviar base64 enorme al iframe. */
  const [galleryLiveObjectUrls, setGalleryLiveObjectUrls] = useState<string[]>([])
  const [previewAddress, setPreviewAddress] = useState('')
  const [previewLocation, setPreviewLocation] = useState<LocationValue>(() => emptyLocation())
  const [previewEmail, setPreviewEmail] = useState('')
  const [previewMapLat, setPreviewMapLat] = useState<number | undefined>(undefined)
  const [previewMapLng, setPreviewMapLng] = useState<number | undefined>(undefined)
  const [proSetupPhase, setProSetupPhase] = useState<Step9SetupPhase>('services')
  const [proOffersServices, setProOffersServices] = useState(true)
  /** Servicios para el iframe; se actualiza al mutar la API y al cambiar la caché de React Query. */
  const [previewServices, setPreviewServices] = useState<TemplateServicePayload[]>([])
  const queryClient = useQueryClient()
  /** Hex enviado al iframe de vista previa (incluye default de paleta y cambios locales inmediatos). */
  const [brandColorLiveHex, setBrandColorLiveHex] = useState<string | null>(null)

  const { data } = useQuery<Template[]>({
    queryKey: keys.onboarding.templates,
    queryFn: fetchOnboardingTemplates,
    staleTime: 0,
    refetchOnMount: 'always',
  })
  const templates = useMemo(() => (Array.isArray(data) ? data : EMPTY_TEMPLATES), [data])
  const businessIsPro = useAuthStore((s) => s.business?.is_pro ?? false)
  const businessPlan = useAuthStore((s) => s.business?.plan)
  const step3Pro = businessIsPro || businessPlan === 'pending'
  const galleryProExperience = businessIsPro || businessPlan === 'pending' || postCheckoutProGallery
  const step8OrLater = currentStep >= 8
  const needsBusinessGallery = currentStep >= 4 && currentStep <= 8
  const businessSnapQuery = useQuery({
    queryKey: keys.dashboard.business,
    queryFn: getBusiness,
    enabled: needsBusinessGallery || step8OrLater,
  })
  const step9Active = currentStep === 9
  const aboutSectionsQuery = useQuery({
    queryKey: keys.dashboard.aboutSections,
    queryFn: getAboutSections,
    enabled: (currentStep === 3 || step8OrLater) && step3Pro,
  })
  const brandColorQuery = useBrandColor({
    enabled: step9Active && (businessIsPro || businessPlan === 'pending'),
  })

  useEffect(() => {
    if (!step9Active) {
      setBrandColorLiveHex(null)
      return
    }
    if (!brandColorQuery.data?.is_supported) {
      return
    }
    const hex = brandColorQuery.data.current ?? brandColorQuery.data.effective
    if (hex) {
      setBrandColorLiveHex(hex.toLowerCase())
    }
  }, [step9Active, brandColorQuery.data])

  const brandPreviewHex = useMemo(() => {
    if (!step9Active) return null
    if (brandColorLiveHex) return brandColorLiveHex
    if (!brandColorQuery.data?.is_supported) return null
    return brandColorQuery.data.current ?? brandColorQuery.data.effective ?? null
  }, [step9Active, brandColorLiveHex, brandColorQuery.data])
  const servicesSnapQuery = useQuery({
    queryKey: keys.dashboard.services,
    queryFn: getServices,
    enabled: step9Active,
  })

  const syncPreviewServicesFromCache = useCallback(() => {
    const fromQuery =
      servicesSnapQuery.data ??
      queryClient.getQueryData<BusinessService[]>(keys.dashboard.services) ??
      businessSnapQuery.data?.services
    setPreviewServices(mapServicesForTemplatePreview(fromQuery))
  }, [servicesSnapQuery.data, queryClient, businessSnapQuery.data?.services])

  useEffect(() => {
    if (!step9Active) {
      setPreviewServices([])
      return
    }
    syncPreviewServicesFromCache()
  }, [step9Active, syncPreviewServicesFromCache])

  const handleServicesPreviewMutate = useCallback(() => {
    syncPreviewServicesFromCache()
  }, [syncPreviewServicesFromCache])

  const reservedSubdomain = useMemo(() => {
    const fromBiz = businessSubdomain?.trim() ?? ''
    const fromDraft =
      serverDraft && typeof serverDraft.subdomain === 'string' ? serverDraft.subdomain.trim() : ''
    return fromBiz || fromDraft
  }, [businessSubdomain, serverDraft])

  const handleGalleryPhotosChange = useCallback(
    (next: File[] | ((prev: File[]) => File[])) => {
      setGalleryPhotoFiles(next)
      setGalleryDirty(true)
    },
    [],
  )

  const registerContinueHandler = useCallback((handler: (() => unknown) | null) => {
    continueHandlerRef.current = handler
  }, [])

  /** Paso 7: sin plan elegido no se puede continuar (el paso actualiza con registerContinueEnabled). */
  const [planContinueOk, setPlanContinueOk] = useState(true)

  useLayoutEffect(() => {
    if (currentStep === 7) {
      setPlanContinueOk(false)
    } else {
      setPlanContinueOk(true)
    }
  }, [currentStep])

  useEffect(() => {
    if (currentStep === 5) setGalleryDirty(false)
  }, [currentStep])

  const registerContinueEnabled = useCallback((enabled: boolean) => {
    setPlanContinueOk(enabled)
  }, [])

  const onPreviewMapCoordsChange = useCallback((lat: number | null, lng: number | null) => {
    if (lat == null || lng == null || !Number.isFinite(lat) || !Number.isFinite(lng)) {
      setPreviewMapLat(undefined)
      setPreviewMapLng(undefined)
    } else {
      setPreviewMapLat(lat)
      setPreviewMapLng(lng)
    }
  }, [])

  // Handlers estables para evitar bucles de render:
  // el hijo depende de la identidad de `onPhoneChange`/`onAddressChange`/`onEmailChange`.
  const handlePhoneChange = useCallback((phone?: string) => {
    const next = phone ?? ''
    setPreviewPhone((prev) => (prev === next ? prev : next))
  }, [])

  const handleAddressChange = useCallback((addr?: string) => {
    const next = addr ?? ''
    setPreviewAddress((prev) => (prev === next ? prev : next))
  }, [])

  const handleEmailChange = useCallback((em?: string) => {
    const next = em ?? ''
    setPreviewEmail((prev) => (prev === next ? prev : next))
  }, [])

  // Mismo patrón que `aboutTeamFile` (que funciona sin congelar): crea la object URL para el iframe
  // y la revoca síncronamente al cambiar el archivo. La miniatura del paso usa su propia URL local.
  useEffect(() => {
    if (!coverFile) {
      setCoverLiveObjectUrl(undefined)
      return
    }
    const url = URL.createObjectURL(coverFile)
    setCoverLiveObjectUrl(url)
    return () => {
      URL.revokeObjectURL(url)
    }
  }, [coverFile])

  useEffect(() => {
    if (!coverFile2) { setCoverLiveObjectUrl2(undefined); return }
    const url = URL.createObjectURL(coverFile2)
    setCoverLiveObjectUrl2(url)
    return () => { URL.revokeObjectURL(url) }
  }, [coverFile2])

  useEffect(() => {
    if (!coverFile3) { setCoverLiveObjectUrl3(undefined); return }
    const url = URL.createObjectURL(coverFile3)
    setCoverLiveObjectUrl3(url)
    return () => { URL.revokeObjectURL(url) }
  }, [coverFile3])

  useEffect(() => {
    if (!coverFile) {
      setCoverPersistDataUrl(undefined)
      return
    }
    let cancelled = false
    const reader = new FileReader()
    reader.onload = () => {
      if (cancelled) return
      const value = typeof reader.result === 'string' ? reader.result : undefined
      setCoverPersistDataUrl(value)
    }
    reader.onerror = () => {
      if (cancelled) return
      setCoverPersistDataUrl(undefined)
    }
    reader.readAsDataURL(coverFile)
    return () => {
      cancelled = true
      try {
        if (reader.readyState === 1 /* LOADING */) reader.abort()
      } catch {
        /* ignore: abort can throw in some edge browsers */
      }
    }
  }, [coverFile])

  useEffect(() => {
    if (!aboutTeamFile) {
      setAboutLiveObjectUrl(undefined)
      return
    }
    const url = URL.createObjectURL(aboutTeamFile)
    setAboutLiveObjectUrl(url)
    return () => {
      URL.revokeObjectURL(url)
    }
  }, [aboutTeamFile])

  useEffect(() => {
    if (!aboutTeamFile) {
      setAboutPersistDataUrl(undefined)
      return
    }
    let cancelled = false
    const reader = new FileReader()
    reader.onload = () => {
      if (cancelled) return
      setAboutPersistDataUrl(typeof reader.result === 'string' ? reader.result : undefined)
    }
    reader.onerror = () => {
      if (cancelled) return
      setAboutPersistDataUrl(undefined)
    }
    reader.readAsDataURL(aboutTeamFile)
    return () => {
      cancelled = true
      try {
        if (reader.readyState === 1) reader.abort()
      } catch {
        /* ignore */
      }
    }
  }, [aboutTeamFile])

  useEffect(() => {
    if (galleryPhotoFiles.length > 0) {
      const urls = galleryPhotoFiles.map((f) => URL.createObjectURL(f))
      setGalleryLiveObjectUrls(urls)
      return () => {
        urls.forEach((u) => URL.revokeObjectURL(u))
      }
    }
    setGalleryLiveObjectUrls([])
  }, [galleryPhotoFiles])

  useEffect(() => {
    wizardHydratedRef.current = false
    setGalleryPreviewUrls([])
    setGalleryPhotoFiles([])
    setSchedulePreview(DEFAULT_SCHEDULE)
    setStep1PreviewVariant('urban-bold')
    setStep1LogoPreviewUrl(undefined)
    setStep1LogoScale(1)
    setStep1LogoFile(null)
    setStep1PendingRemoveLogo(false)
    setCoverFile(null)
    setAboutTeamFile(null)
    setPreviewName('')
    setPreviewTagline('')
    setPreviewPhone('')
    setCoverPersistDataUrl(undefined)
    setCoverLiveObjectUrl(undefined)
    setPreviewDescription('')
    setAboutPersistDataUrl(undefined)
    setAboutLiveObjectUrl(undefined)
    setGalleryLiveObjectUrls([])
    setPreviewAddress('')
    setPreviewEmail('')
    setPreviewMapLat(undefined)
    setPreviewMapLng(undefined)
    setProSetupPhase('services')
    setProOffersServices(true)
  }, [persistUserId])

  useEffect(() => {
    if (currentStep !== 9) {
      setProSetupPhase('services')
      setProOffersServices(true)
    }
  }, [currentStep])

  useEffect(() => {
    if (isPendingStatus || serverDraft === undefined || wizardHydratedRef.current) return
    wizardHydratedRef.current = true

    const p = loadOnboardingPersist(persistUserId)
    const d = serverDraft
    const maxGallerySlots = galleryProExperience ? 20 : 3

    // RegisterPage guarda nombre/sector/ciudad en localStorage (persiste entre pestañas).
    // Si el wizard arranca limpio propagamos esos valores para que el paso 3 no falle
    // silenciosamente por business_name vacío al saltar el paso 2.
    let signupBusinessName = ''
    let signupLocation = emptyLocation()
    const parsed = readSignupPrefill()
    if (parsed) {
      if (typeof parsed.business_name === 'string') {
        signupBusinessName = parsed.business_name.trim()
      }
      const signupCity = typeof parsed.city === 'string' ? parsed.city.trim() : ''
      const signupCountry = typeof parsed.country === 'string' ? parsed.country.trim() : ''
      const signupCountryCode =
        typeof parsed.country_code === 'string'
          ? parsed.country_code.trim().toUpperCase()
          : ''
      signupLocation = coerceLocation({
        countryCode: signupCountryCode || undefined,
        country: signupCountry,
        city: signupCity,
      })
    }

    const serverName =
      typeof d.business_name === 'string' ? d.business_name.trim() : ''
    const persistedName = typeof p?.previewName === 'string' ? p.previewName.trim() : ''
    setPreviewName(
      String(serverName || authBusinessName || signupBusinessName || persistedName || ''),
    )
    const serverTagline = typeof d.tagline === 'string' ? d.tagline.trim() : ''
    const persistedTagline = typeof p?.previewTagline === 'string' ? p.previewTagline.trim() : ''
    setPreviewTagline(String(serverTagline || persistedTagline || ''))
    setPreviewPhone(String(p?.previewPhone ?? d.phone ?? ''))
    setPreviewDescription(String(p?.previewDescription ?? d.description ?? ''))
    setPreviewAboutTitle(
      String(
        p?.previewAboutTitle ??
          (typeof d.about_title === 'string' ? d.about_title : '') ??
          '',
      ),
    )
    setPreviewAddress(String(p?.previewAddress ?? d.address ?? ''))
    setPreviewLocation(
      coerceLocation({
        countryCode:
          (typeof d.country_code === 'string' && d.country_code.trim()) ||
          authBusinessCountryCode ||
          signupLocation.countryCode ||
          (typeof p?.previewCountryCode === 'string' && p.previewCountryCode) ||
          undefined,
        country:
          (typeof d.country === 'string' && d.country.trim()) ||
          authBusinessCountry ||
          signupLocation.country ||
          (typeof p?.previewCountry === 'string' && p.previewCountry) ||
          undefined,
        city:
          (typeof d.city === 'string' && d.city.trim()) ||
          authBusinessCity ||
          signupLocation.city ||
          (typeof p?.previewCity === 'string' && p.previewCity) ||
          undefined,
      }),
    )
    setPreviewEmail(String(p?.previewEmail ?? d.email ?? ''))

    if (
      typeof p?.step1PreviewVariant === 'string' &&
      (STEP1_PREVIEW_VARIANTS as string[]).includes(p.step1PreviewVariant)
    ) {
      setStep1PreviewVariant(p.step1PreviewVariant as Step1PreviewVariant)
    }

    if (
      typeof p?.step1LogoScale === 'number' &&
      Number.isFinite(p.step1LogoScale) &&
      p.step1LogoScale >= 0.75 &&
      p.step1LogoScale <= 1.5
    ) {
      setStep1LogoScale(p.step1LogoScale)
    }

    if (isPersistableSchedule(p?.schedule)) {
      setSchedulePreview(p.schedule)
    } else if (isPersistableSchedule(d.schedule)) {
      setSchedulePreview(d.schedule as Schedule)
    }

    const serverGalleryUrls = galleryPreviewUrlsFromDraft(d as Record<string, unknown>)
    if (p?.galleryDataUrls?.length) {
      setGalleryPreviewUrls(p.galleryDataUrls)
      void Promise.all(p.galleryDataUrls.map((url, i) => dataUrlToFile(url, `gallery-${i}.jpg`))).then(
        (files) => {
          const ok = files.filter((f): f is File => f != null)
          if (ok.length) setGalleryPhotoFiles((prev) => mergeGalleryFiles(prev, ok, maxGallerySlots))
        },
      )
    } else if (serverGalleryUrls.length > 0) {
      void hydrateGalleryFromServerUrls(serverGalleryUrls)
        .then((files) => {
          if (files.length) setGalleryPhotoFiles((prev) => mergeGalleryFiles(prev, files, maxGallerySlots))
        })
        .catch(() => {
          /* URLs inaccesibles: el usuario puede volver a subir la galería */
        })
    }

    if (p?.coverDataUrl) {
      setCoverPersistDataUrl(p.coverDataUrl)
      void dataUrlToFile(p.coverDataUrl, 'portada.jpg').then((f) => f && setCoverFile(f))
    }

    if (p?.aboutDataUrl) {
      setAboutPersistDataUrl(p.aboutDataUrl)
      void dataUrlToFile(p.aboutDataUrl, 'equipo.jpg').then((f) => f && setAboutTeamFile(f))
    }
  }, [
    isPendingStatus,
    serverDraft,
    persistUserId,
    galleryProExperience,
    authBusinessName,
    authBusinessCity,
    authBusinessCountry,
    authBusinessCountryCode,
  ])

  /** Al entrar en el paso 4, cargar la galería guardada en un solo listado editable. */
  const galleryHydratedForStepRef = useRef(false)
  useEffect(() => {
    if (currentStep !== 4) {
      galleryHydratedForStepRef.current = false
      return
    }
    if (isPendingStatus || galleryHydratedForStepRef.current) return
    if (galleryPhotoFiles.length > 0) {
      galleryHydratedForStepRef.current = true
      return
    }

    const fromBusiness =
      businessSnapQuery.data?.images?.gallery
        ?.map((g) => g.url)
        .filter((u): u is string => typeof u === 'string' && u.trim().length > 0) ?? []
    const fromDraft = galleryPreviewUrlsFromDraft(serverDraft as Record<string, unknown> | undefined)
    const urls = fromBusiness.length > 0 ? fromBusiness : fromDraft

    if (urls.length === 0) return

    galleryHydratedForStepRef.current = true
    void hydrateGalleryFromServerUrls(urls)
      .then((files) => {
        if (files.length > 0) {
          const cap = galleryProExperience ? 20 : 3
          setGalleryPhotoFiles(files.slice(0, cap))
        }
      })
      .catch(() => {
        galleryHydratedForStepRef.current = false
      })
  }, [
    currentStep,
    isPendingStatus,
    galleryPhotoFiles.length,
    businessSnapQuery.data?.images?.gallery,
    serverDraft,
    galleryProExperience,
  ])

  useEffect(() => {
    if (isPendingStatus) return
    if (serverDraft === undefined) return
    if (typeof serverDraft.logo_preview_url !== 'string' || !serverDraft.logo_preview_url.trim()) {
      return
    }
    let cancelled = false
    void apiClient
      .get('/onboarding/draft-logo', { responseType: 'blob' })
      .then((res) => {
        if (cancelled) return
        const blob = res.data as Blob
        const reader = new FileReader()
        reader.onload = () => {
          if (cancelled) return
          const s = reader.result
          if (typeof s === 'string') {
            setStep1LogoPreviewUrl(s)
          }
        }
        reader.readAsDataURL(blob)
      })
      .catch(() => undefined)
    return () => {
      cancelled = true
    }
  }, [isPendingStatus, serverDraft?.logo_preview_url])

  useEffect(() => {
    if (isPendingStatus || !wizardHydratedRef.current || persistUserId == null) return
    scheduleSaveOnboardingPersist(persistUserId, {
      step: currentStep,
      previewName,
      previewTagline,
      previewPhone,
      previewDescription,
      previewAboutTitle,
      previewAddress,
      previewCity: previewLocation.city,
      previewCountry: previewLocation.country,
      previewCountryCode: previewLocation.countryCode,
      previewEmail,
      schedule: schedulePreview,
      step1PreviewVariant,
      step1LogoScale,
      coverDataUrl: coverPersistDataUrl,
      aboutDataUrl: aboutPersistDataUrl,
      galleryDataUrls:
        galleryPhotoFiles.length === 0
          ? []
          : galleryPreviewUrls.length > 0
            ? galleryPreviewUrls
            : undefined,
    })
  }, [
    isPendingStatus,
    persistUserId,
    currentStep,
    previewName,
    previewTagline,
    previewPhone,
    previewDescription,
    previewAboutTitle,
    previewAddress,
    previewLocation,
    previewEmail,
    schedulePreview,
    step1PreviewVariant,
    step1LogoScale,
    coverPersistDataUrl,
    aboutPersistDataUrl,
    galleryPreviewUrls,
    galleryPhotoFiles.length,
    serverDraft,
  ])

  const templatePreviewData = useMemo<TemplatePreviewData>(() => {
    const b = businessSnapQuery.data
    const useServer = step8OrLater
    const serverCover =
      useServer && b?.images?.cover?.[0]?.url ? String(b.images.cover[0].url).trim() : ''
    const serverCover2 =
      useServer && b?.images?.cover?.[1]?.url ? String(b.images.cover[1].url).trim() : ''
    const serverCover3 =
      useServer && b?.images?.cover?.[2]?.url ? String(b.images.cover[2].url).trim() : ''
    const serverAbout =
      useServer && b?.images?.about?.[0]?.url ? String(b.images.about[0].url).trim() : ''
    const galleryUrls =
      galleryLiveObjectUrls.length > 0
        ? galleryLiveObjectUrls
        : useServer && b?.images?.gallery?.length
          ? b.images.gallery.map((g) => g.url).filter(Boolean)
          : []
    const schedule = useServer && b?.schedule ? b.schedule : schedulePreview
    const mapLat =
      useServer && b?.lat != null && Number.isFinite(Number(b.lat)) ? Number(b.lat) : previewMapLat
    const mapLng =
      useServer && b?.lng != null && Number.isFinite(Number(b.lng)) ? Number(b.lng) : previewMapLng
    const draftName =
      serverDraft && typeof serverDraft.business_name === 'string'
        ? serverDraft.business_name.trim()
        : ''
    const name = (previewName.trim() || draftName || b?.name || authBusinessName).trim() || undefined
    const templateServices: TemplatePreviewData['templateServices'] = step9Active
      ? proOffersServices
        ? previewServices
        : []
      : undefined

    return {
      logoUrl: step1LogoPreviewUrl ?? (useServer ? b?.logo_url ?? undefined : undefined),
      logoScale: step1LogoScale,
      businessName: name,
      tagline: previewTagline || undefined,
      phone: (previewPhone.trim() || b?.phone || '').trim() || undefined,
      coverUrl: coverLiveObjectUrl || serverCover || undefined,
      coverUrl2: coverLiveObjectUrl2 || serverCover2 || undefined,
      coverUrl3: coverLiveObjectUrl3 || serverCover3 || undefined,
      description: previewDescription || undefined,
      aboutTitle:
        (previewAboutTitle.trim() || (useServer ? (b?.about_title ?? '') : '') || '').trim() || undefined,
      aboutSections:
        aboutSectionsQuery.data?.map((s) => ({
          title: s.title ?? '',
          description: s.description ?? '',
          image_url: s.image_url ?? '',
        })) ??
        (useServer && b?.about_sections
          ? b.about_sections.map((s) => ({
              title: s.title ?? '',
              description: s.description ?? '',
              image_url: s.image_url ?? '',
            }))
          : undefined),
      aboutPhotoUrl: aboutLiveObjectUrl || serverAbout || undefined,
      address: (previewAddress.trim() || b?.address || '').trim() || undefined,
      city: (previewLocation.city.trim() || b?.city || '').trim() || undefined,
      country: (previewLocation.country.trim() || b?.country || '').trim() || undefined,
      foundedYear: b?.created_at ? String(new Date(b.created_at).getFullYear()) : undefined,
      email: (previewEmail.trim() || b?.email || '').trim() || undefined,
      galleryUrls,
      schedule,
      mapLat,
      mapLng,
      templateServices,
      googleBusinessUrl: step9Active ? (b?.google_business_url ?? '') : undefined,
      vcardEnabled: step9Active ? Boolean(b?.vcard_enabled) : undefined,
      isProCustomer: step9Active ? Boolean(b?.is_pro || b?.plan === 'pending') : undefined,
      customerSubdomain: useServer ? (b?.subdomain ?? '') : undefined,
      instagramUrl: step9Active ? (b?.instagram_url ?? '') : undefined,
      tiktokUrl: step9Active ? (b?.tiktok_url ?? '') : undefined,
      facebookUrl: step9Active ? (b?.facebook_url ?? '') : undefined,
      brandColorOverride: brandPreviewHex ?? undefined,
      brandVariable: step9Active
        ? (TEMPLATE_BRAND_VARIABLE[step1PreviewVariant] ?? null)
        : undefined,
    }
  }, [
    step1LogoPreviewUrl,
    step1LogoScale,
    businessSnapQuery.data,
    coverLiveObjectUrl,
    coverLiveObjectUrl2,
    coverLiveObjectUrl3,
    galleryLiveObjectUrls,
    aboutLiveObjectUrl,
    previewDescription,
    previewAboutTitle,
    previewName,
    authBusinessName,
    serverDraft,
    previewPhone,
    previewTagline,
    previewAddress,
    previewLocation,
    previewEmail,
    previewMapLat,
    previewMapLng,
    proOffersServices,
    previewServices,
    schedulePreview,
    step8OrLater,
    step9Active,
    brandPreviewHex,
    step1PreviewVariant,
    aboutSectionsQuery.data,
  ])

  const navValue = useMemo(
    () => ({
      onJumpToStep: jumpToStep,
      registerContinueHandler,
      registerContinueEnabled,
      footer:
        currentStep === 9 ? (
          <Btn
            kind="ghost"
            icon="chevronLeft"
            size="md"
            type="button"
            disabled={isLoading}
            onClick={goPrev}
          >
            Atrás
          </Btn>
        ) : (
          <>
            <Btn
              kind="ghost"
              icon="chevronLeft"
              size="md"
              type="button"
              disabled={currentStep === 1 || currentStep === 8 || isLoading}
              onClick={goPrev}
              style={currentStep === 8 ? { visibility: 'hidden' } : undefined}
            >
              Atrás
            </Btn>
            <Btn
              kind="primary"
              iconRight="arrowRight"
              size="md"
              type="button"
              loading={isLoading}
              disabled={isLoading || (currentStep === 7 && !planContinueOk)}
              onClick={() => {
                const payload = continueHandlerRef.current?.()
                if (payload === null) return
                if (currentStep === 2 && payload && typeof payload === 'object') {
                  const p = payload as Record<string, unknown>
                  if (coverFile2Ref.current) p.cover2 = coverFile2Ref.current
                  if (coverFile3Ref.current) p.cover3 = coverFile3Ref.current
                }
                void goNext(payload)
              }}
            >
              {currentStep === 8 ? 'Ir a mi dashboard' : 'Continuar'}
            </Btn>
          </>
        ),
    }),
    [
      currentStep,
      goNext,
      goPrev,
      isLoading,
      jumpToStep,
      registerContinueHandler,
      registerContinueEnabled,
      planContinueOk,
    ],
  )

  const selectedTemplate = useMemo(
    () => templates.find((t) => resolveStep1PreviewVariant(t) === step1PreviewVariant),
    [templates, step1PreviewVariant],
  )
  const heroPhotoSlots = selectedTemplate?.hero_photo_slots ?? 1
  const selectedTemplateRequiresPro = selectedTemplate?.requires_pro ?? false

  const previewTitle = useMemo(() => {
    const match = selectedTemplate
    const name = match?.name?.trim()
    if (name) return name
    return step1PreviewVariant
      .split('-')
      .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
      .join(' ')
  }, [selectedTemplate, step1PreviewVariant])

  const step1PreviewOverrides = useMemo<TemplatePreviewData>(
    () => ({
      logoUrl: step1LogoPreviewUrl,
      logoScale: step1LogoScale,
      businessName: templatePreviewData.businessName,
      tagline: templatePreviewData.tagline,
      phone: templatePreviewData.phone,
      aboutTitle: templatePreviewData.aboutTitle,
      description: templatePreviewData.description,
    }),
    [
      step1LogoPreviewUrl,
      step1LogoScale,
      templatePreviewData.businessName,
      templatePreviewData.tagline,
      templatePreviewData.phone,
      templatePreviewData.aboutTitle,
      templatePreviewData.description,
    ],
  )

  const previewFocusDescription = useMemo(() => {
    switch (currentStep) {
      case 2:
        return 'Se abrirá en la portada, con nombre, tagline y foto si ya los has añadido.'
      case 3:
        return 'Enfocamos la sección «Sobre nosotros».'
      case 4:
        return 'Enfocamos la galería de fotos.'
      case 5:
        return 'Enfocamos el bloque de horarios.'
      case 6:
        return 'Enfocamos contacto y mapa.'
      case 7:
        return 'Ves la web completa con todo lo que llevas en el asistente.'
      case 8:
        return 'Última revisión visual antes de publicar.'
      case 9:
        if (proSetupPhase === 'services') {
          return 'Enfocamos la sección de servicios de tu plantilla.'
        }
        if (proSetupPhase === 'brand') {
          return 'Ves tu web con el color de marca que elijas.'
        }
        return 'Enfocamos enlaces y datos de contacto (Google Business, vCard…).'
      default:
        return ''
    }
  }, [currentStep, proSetupPhase])

  const renderPreview = useCallback(() => {
    switch (currentStep) {
      case 1:
        return <TplPreview variant={step1PreviewVariant} previewData={step1PreviewOverrides} />
      case 2:
        return <PortadaPreview variant={step1PreviewVariant} previewData={templatePreviewData} />
      case 3:
        return <SobrePreview variant={step1PreviewVariant} previewData={templatePreviewData} />
      case 4:
        return <GaleriaPreview variant={step1PreviewVariant} previewData={templatePreviewData} />
      case 5:
        return <HorariosPreview variant={step1PreviewVariant} previewData={templatePreviewData} />
      case 6:
        return <UbicacionPreview variant={step1PreviewVariant} previewData={templatePreviewData} />
      case 7:
        return <PlanPreview variant={step1PreviewVariant} previewData={templatePreviewData} />
      case 8:
        return <PlanPreview variant={step1PreviewVariant} previewData={templatePreviewData} />
      case 9: {
        if (proSetupPhase === 'services') {
          return (
            <ServiciosPreview variant={step1PreviewVariant} previewData={templatePreviewData} />
          )
        }
        const step9PreviewHash = proSetupPhase === 'extras' ? '#contacto' : ''
        return (
          <PlanPreview
            variant={step1PreviewVariant}
            previewData={templatePreviewData}
            initialHash={step9PreviewHash}
          />
        )
      }
      default:
        return null
    }
  }, [currentStep, proSetupPhase, step1PreviewVariant, step1PreviewOverrides, templatePreviewData])

  const stepBody = useMemo(() => {
    const common = { errors, isLoading }
    switch (currentStep) {
      case 1:
        return (
          <Step1Plantilla
            {...common}
            templates={templates}
            onTemplatePreviewChange={setStep1PreviewVariant}
            logoFile={step1LogoFile}
            pendingRemoveLogo={step1PendingRemoveLogo}
            previewOverrides={step1PreviewOverrides}
          />
        )
      case 2:
        return (
          <Step2Portada
            {...common}
            currentCoverFile={coverFile}
            onCoverChange={setCoverFile}
            currentCoverFile2={coverFile2}
            onCoverChange2={setCoverFile2}
            currentCoverFile3={coverFile3}
            onCoverChange3={setCoverFile3}
            heroPhotoSlots={heroPhotoSlots}
            businessName={previewName}
            onBusinessNameChange={setPreviewName}
            tagline={previewTagline}
            onTaglineChange={setPreviewTagline}
            logoPreviewUrl={step1LogoPreviewUrl}
            onLogoPreviewUrlChange={setStep1LogoPreviewUrl}
            logoScale={step1LogoScale}
            onLogoScaleChange={setStep1LogoScale}
            logoFile={step1LogoFile}
            onLogoFileChange={setStep1LogoFile}
            pendingRemoveLogo={step1PendingRemoveLogo}
            onPendingRemoveLogoChange={setStep1PendingRemoveLogo}
          />
        )
      case 3:
        return (
          <Step3Sobre
            {...common}
            initialBusinessName={previewName}
            initialTagline={previewTagline}
            aboutTitle={previewAboutTitle}
            onAboutTitleChange={setPreviewAboutTitle}
            description={previewDescription}
            onDescriptionChange={setPreviewDescription}
            contactPhone={previewPhone}
            onContactPhoneChange={setPreviewPhone}
            currentAboutPhotoFile={aboutTeamFile}
            onAboutPhotoChange={setAboutTeamFile}
            isPro={step3Pro}
            onAboutSectionsChange={() => {
              void aboutSectionsQuery.refetch()
              void businessSnapQuery.refetch()
            }}
          />
        )
      case 4:
        return (
          <Step4Galeria
            {...common}
            pro={galleryProExperience}
            postCheckoutProBanner={postCheckoutProGallery}
            photos={galleryPhotoFiles}
            onPhotosChange={handleGalleryPhotosChange}
            onGalleryPreviewUrlsChange={setGalleryPreviewUrls}
            dirty={galleryDirty}
          />
        )
      case 5:
        return (
          <Step5Horarios {...common} schedule={schedulePreview} onScheduleChange={setSchedulePreview} />
        )
      case 6:
        return (
          <Step6Ubicacion
            {...common}
            initialPhone={previewPhone}
            initialAddress={previewAddress}
            initialLocation={previewLocation}
            initialEmail={previewEmail}
            mapLat={previewMapLat}
            mapLng={previewMapLng}
            onPhoneChange={handlePhoneChange}
            onAddressChange={handleAddressChange}
            onLocationChange={setPreviewLocation}
            onEmailChange={handleEmailChange}
            onMapCoordsChange={onPreviewMapCoordsChange}
          />
        )
      case 7:
        return (
          <Step7Plan
            {...common}
            templateRequiresPro={selectedTemplateRequiresPro}
            onChangeTemplate={() => jumpToStep(1)}
          />
        )
      case 8:
        return <Step8Publicar {...common} reservedSubdomain={reservedSubdomain} />
      case 9:
        return (
          <Step9ProSetup
            {...common}
            onFinishToDashboard={resetProExtrasFlow}
            setupPhase={proSetupPhase}
            onSetupPhaseChange={setProSetupPhase}
            offersServices={proOffersServices}
            onOffersServicesChange={setProOffersServices}
            onServicesPreviewMutate={handleServicesPreviewMutate}
            brandColorDefault={brandColorQuery.data?.default ?? '#000000'}
            brandColorPickerValue={brandColorLiveHex}
            onBrandColorLiveChange={setBrandColorLiveHex}
          />
        )
      default:
        return null
    }
  }, [
    currentStep,
    errors,
    isLoading,
    templates,
    coverFile,
    previewName,
    previewTagline,
    previewPhone,
    previewDescription,
    previewAboutTitle,
    aboutTeamFile,
    galleryPhotoFiles,
    schedulePreview,
    previewAddress,
    previewEmail,
    previewMapLat,
    previewMapLng,
    handlePhoneChange,
    handleAddressChange,
    handleEmailChange,
    onPreviewMapCoordsChange,
    reservedSubdomain,
    galleryProExperience,
    postCheckoutProGallery,
    proOffersServices,
    handleServicesPreviewMutate,
    proSetupPhase,
    resetProExtrasFlow,
    step1LogoFile,
    step1PendingRemoveLogo,
    step1LogoPreviewUrl,
    step1LogoScale,
  ])

  useEffect(() => {
    if (templates.length === 0) return
    setStep1PreviewVariant(resolveStep1PreviewVariant(templates[0]))
  }, [templates])

  if (isPendingStatus) {
    return <OnboardingSkeleton />
  }

  return (
    <WizardNavContext.Provider value={navValue}>
      <WizardLayout
        step={currentStep}
        renderPreview={renderPreview}
        previewTitle={previewTitle}
        previewFocusDescription={previewFocusDescription}
      >
        {stepBody}
      </WizardLayout>
    </WizardNavContext.Provider>
  )
}
