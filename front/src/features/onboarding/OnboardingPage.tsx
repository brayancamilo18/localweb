import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Btn } from '../../components/primitives'
import { apiClient } from '../../api/client'
import { getBusiness } from '../../api/dashboard'
import { getServices } from '../../api/services'
import { fetchOnboardingTemplates, hydrateGalleryFromServerUrls } from '../../api/onboarding'
import { keys } from '../../api/queryKeys'
import type { Schedule, Template } from '../../types/api'
import { useOnboarding } from './useOnboarding'
import Step9ProSetup from './steps/Step9ProSetup'
import {
  dataUrlToFile,
  galleryPreviewUrlsFromDraft,
  isDraftGallerySyncedFromBusiness,
  isPersistableSchedule,
  loadOnboardingPersist,
  mergeGalleryFiles,
  scheduleSaveOnboardingPersist,
} from './onboardingPersist'
import { useAuthStore } from '../../store/authStore'
import {
  DEFAULT_SCHEDULE,
  GaleriaPreview,
  HorariosPreview,
  PlanPreview,
  PortadaPreview,
  PublicarPreview,
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
  type Step1PreviewVariant,
  type TemplatePreviewData,
} from './wizard'

const EMPTY_TEMPLATES: Template[] = []

function OnboardingSkeleton() {
  return (
    <div style={{ height: '100vh', padding: 32, background: 'var(--lw-bg)' }}>
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
  /** Modo append (negocio ya en BD): URLs R2 ya guardadas — solo vista. */
  const [existingGalleryUrls, setExistingGalleryUrls] = useState<string[]>([])
  /** Modo append: solo estas se envían en step4. */
  const [newGalleryFiles, setNewGalleryFiles] = useState<File[]>([])
  const [schedulePreview, setSchedulePreview] = useState<Schedule>(DEFAULT_SCHEDULE)
  const [step1PreviewVariant, setStep1PreviewVariant] = useState<Step1PreviewVariant>('noir-elite')
  const [step1LogoPreviewUrl, setStep1LogoPreviewUrl] = useState<string | undefined>(undefined)
  const [step1LogoScale, setStep1LogoScale] = useState(1)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [previewName, setPreviewName] = useState('')
  const [previewTagline, setPreviewTagline] = useState('')
  const [previewPhone, setPreviewPhone] = useState('')
  /** Base64 solo para guardar el borrador local (localStorage); no usar en postMessage al iframe. */
  const [coverPersistDataUrl, setCoverPersistDataUrl] = useState<string | undefined>(undefined)
  /** URL efímera para vista previa en vivo (misma pestaña que el iframe → mismo origen). */
  const [coverLiveObjectUrl, setCoverLiveObjectUrl] = useState<string | undefined>(undefined)
  const [previewDescription, setPreviewDescription] = useState('')
  const [aboutTeamFile, setAboutTeamFile] = useState<File | null>(null)
  const [aboutPersistDataUrl, setAboutPersistDataUrl] = useState<string | undefined>(undefined)
  const [aboutLiveObjectUrl, setAboutLiveObjectUrl] = useState<string | undefined>(undefined)
  /** Objetos blob por archivo de galería; evita enviar base64 enorme al iframe. */
  const [galleryLiveObjectUrls, setGalleryLiveObjectUrls] = useState<string[]>([])
  const [previewAddress, setPreviewAddress] = useState('')
  const [previewEmail, setPreviewEmail] = useState('')
  const [previewMapLat, setPreviewMapLat] = useState<number | undefined>(undefined)
  const [previewMapLng, setPreviewMapLng] = useState<number | undefined>(undefined)
  const [proSetupPhase, setProSetupPhase] = useState<'services' | 'extras'>('services')
  const [proOffersServices, setProOffersServices] = useState(true)

  const { data } = useQuery<Template[]>({
    queryKey: keys.onboarding.templates,
    queryFn: fetchOnboardingTemplates,
    staleTime: 0,
    refetchOnMount: 'always',
  })
  const templates = data ?? EMPTY_TEMPLATES
  const businessIsPro = useAuthStore((s) => s.business?.is_pro ?? false)
  const businessPlan = useAuthStore((s) => s.business?.plan)
  const galleryProExperience = businessIsPro || businessPlan === 'pending' || postCheckoutProGallery

  /** Paso 4 con negocio ya creado: galería en R2; no mezclar con `File[]` del borrador. */
  const galleryAppendMode = useMemo(() => {
    if (currentStep !== 4) return false
    return (
      postCheckoutProGallery ||
      isDraftGallerySyncedFromBusiness(serverDraft as Record<string, unknown> | undefined)
    )
  }, [currentStep, postCheckoutProGallery, serverDraft])

  const step9Active = currentStep === 9
  const businessSnapQuery = useQuery({
    queryKey: keys.dashboard.business,
    queryFn: getBusiness,
    enabled: step9Active,
  })
  const servicesSnapQuery = useQuery({
    queryKey: keys.dashboard.services,
    queryFn: getServices,
    enabled: step9Active,
  })

  const reservedSubdomain = useMemo(() => {
    const fromBiz = businessSubdomain?.trim() ?? ''
    const fromDraft =
      serverDraft && typeof serverDraft.subdomain === 'string' ? serverDraft.subdomain.trim() : ''
    return fromBiz || fromDraft
  }, [businessSubdomain, serverDraft])

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

  /**
   * Handler estable para evitar bucles: con un arrow inline, `Step2Portada` ve una identidad nueva
   * en cada render del padre y dispara su `useEffect` continuamente, lo que multiplica los renders
   * y los `postMessage` al iframe — y deja la UI inutilizable al cambiar la portada.
   */
  const handleBusinessMetaChange = useCallback(
    (payload: { businessName?: string; tagline?: string }) => {
      const nextName = payload.businessName ?? ''
      const nextTagline = payload.tagline ?? ''
      setPreviewName((prev) => (prev === nextName ? prev : nextName))
      setPreviewTagline((prev) => (prev === nextTagline ? prev : nextTagline))
    },
    [],
  )

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
    if (galleryAppendMode) {
      const blobUrls = newGalleryFiles.map((f) => URL.createObjectURL(f))
      setGalleryLiveObjectUrls([...existingGalleryUrls, ...blobUrls])
      return () => {
        blobUrls.forEach((u) => URL.revokeObjectURL(u))
      }
    }
    if (galleryPhotoFiles.length > 0) {
      const urls = galleryPhotoFiles.map((f) => URL.createObjectURL(f))
      setGalleryLiveObjectUrls(urls)
      return () => {
        urls.forEach((u) => URL.revokeObjectURL(u))
      }
    }
    if (existingGalleryUrls.length > 0) {
      setGalleryLiveObjectUrls(existingGalleryUrls)
      return
    }
    setGalleryLiveObjectUrls([])
  }, [galleryAppendMode, galleryPhotoFiles, newGalleryFiles, existingGalleryUrls])

  useEffect(() => {
    wizardHydratedRef.current = false
    setGalleryPreviewUrls([])
    setGalleryPhotoFiles([])
    setSchedulePreview(DEFAULT_SCHEDULE)
    setStep1PreviewVariant('noir-elite')
    setStep1LogoPreviewUrl(undefined)
    setStep1LogoScale(1)
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
    setExistingGalleryUrls([])
    setNewGalleryFiles([])
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

    // RegisterPage guarda lo del onboarding rápido (nombre/sector/ciudad) en sessionStorage.
    // Si el wizard arranca limpio (sin borrador local ni del backend) propagamos esos valores
    // para que el paso 3 no falle silenciosamente por business_name vacío al saltar el paso 2.
    let signupBusinessName = ''
    let signupAddress = ''
    try {
      const raw = sessionStorage.getItem('lw_signup_prefill')
      if (raw?.trim()) {
        const parsed = JSON.parse(raw) as { business_name?: unknown; address?: unknown }
        if (typeof parsed.business_name === 'string') signupBusinessName = parsed.business_name.trim()
        if (typeof parsed.address === 'string') signupAddress = parsed.address.trim()
      }
    } catch {
      /* sandbox / privacy mode: ignorar */
    }

    setPreviewName(String(p?.previewName ?? d.business_name ?? signupBusinessName ?? ''))
    setPreviewTagline(String(p?.previewTagline ?? d.tagline ?? ''))
    setPreviewPhone(String(p?.previewPhone ?? d.phone ?? ''))
    setPreviewDescription(String(p?.previewDescription ?? d.description ?? ''))
    setPreviewAddress(String(p?.previewAddress ?? d.address ?? signupAddress ?? ''))
    setPreviewEmail(String(p?.previewEmail ?? d.email ?? ''))

    if (p?.step1PreviewVariant === 'noir-elite' || p?.step1PreviewVariant === 'bloom-studio') {
      setStep1PreviewVariant(p.step1PreviewVariant)
    }

    if (
      typeof p?.step1LogoScale === 'number' &&
      Number.isFinite(p.step1LogoScale) &&
      p.step1LogoScale >= 0.45 &&
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
    const syncedGallery = isDraftGallerySyncedFromBusiness(d as Record<string, unknown>)

    if (syncedGallery) {
      setExistingGalleryUrls(serverGalleryUrls)
      setGalleryPhotoFiles([])
      setNewGalleryFiles([])
      setGalleryPreviewUrls([])
    } else if (p?.galleryDataUrls?.length) {
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
  }, [isPendingStatus, serverDraft, persistUserId, galleryProExperience])

  /**
   * Solo borrador sintético `draftFromBusiness` (`gallery_paths` = `__synced__`): tras Stripe,
   * `getStatus` sustituye `serverDraft` pero el wizard ya está hidratado; hay que volver a
   * poblar URLs sin tocar el flujo borrador (rutas reales bajo onboarding/...).
   */
  useEffect(() => {
    if (isPendingStatus || serverDraft === undefined) return
    if (!isDraftGallerySyncedFromBusiness(serverDraft as Record<string, unknown>)) return
    const urls = galleryPreviewUrlsFromDraft(serverDraft as Record<string, unknown>)
    setExistingGalleryUrls(urls)
    setGalleryPhotoFiles([])
  }, [isPendingStatus, serverDraft])

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
    const persistGalleryAsDataUrls =
      !galleryAppendMode &&
      !isDraftGallerySyncedFromBusiness(serverDraft as Record<string, unknown> | undefined)
    scheduleSaveOnboardingPersist(persistUserId, {
      step: currentStep,
      previewName,
      previewTagline,
      previewPhone,
      previewDescription,
      previewAddress,
      previewEmail,
      schedule: schedulePreview,
      step1PreviewVariant,
      step1LogoScale,
      coverDataUrl: coverPersistDataUrl,
      aboutDataUrl: aboutPersistDataUrl,
      galleryDataUrls: !persistGalleryAsDataUrls
        ? []
        : galleryPhotoFiles.length === 0
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
    previewAddress,
    previewEmail,
    schedulePreview,
    step1PreviewVariant,
    step1LogoScale,
    coverPersistDataUrl,
    aboutPersistDataUrl,
    galleryPreviewUrls,
    galleryPhotoFiles.length,
    galleryAppendMode,
    serverDraft,
  ])

  const templatePreviewData = useMemo<TemplatePreviewData>(() => {
    const b = businessSnapQuery.data
    const serverCover =
      step9Active && b?.images?.cover?.[0]?.url ? String(b.images.cover[0].url).trim() : ''
    const serverAbout =
      step9Active && b?.images?.about?.[0]?.url ? String(b.images.about[0].url).trim() : ''
    const galleryUrls =
      galleryLiveObjectUrls.length > 0
        ? galleryLiveObjectUrls
        : step9Active && b?.images?.gallery?.length
          ? b.images.gallery.map((g) => g.url).filter(Boolean)
          : []
    const schedule = step9Active && b?.schedule ? b.schedule : schedulePreview
    const mapLat =
      step9Active && b?.lat != null && Number.isFinite(Number(b.lat)) ? Number(b.lat) : previewMapLat
    const mapLng =
      step9Active && b?.lng != null && Number.isFinite(Number(b.lng)) ? Number(b.lng) : previewMapLng
    const name = (previewName.trim() || b?.name || '').trim() || undefined
    let templateServices: TemplatePreviewData['templateServices'] = undefined
    if (step9Active) {
      templateServices = !proOffersServices
        ? []
        : servicesSnapQuery.data
          ? servicesSnapQuery.data.map((s) => ({
              name: s.name,
              price: s.price,
              description: s.description ?? null,
            }))
          : undefined
    }

    return {
      logoUrl: step1LogoPreviewUrl ?? (step9Active ? b?.logo_url ?? undefined : undefined),
      logoScale: step1LogoScale,
      businessName: name,
      tagline: previewTagline || undefined,
      phone: (previewPhone.trim() || b?.phone || '').trim() || undefined,
      coverUrl: coverLiveObjectUrl || serverCover || undefined,
      description: previewDescription || undefined,
      aboutPhotoUrl: aboutLiveObjectUrl || serverAbout || undefined,
      address: (previewAddress.trim() || b?.address || '').trim() || undefined,
      email: previewEmail.trim() || undefined,
      galleryUrls,
      schedule,
      mapLat,
      mapLng,
      templateServices,
      googleBusinessUrl: step9Active ? (b?.google_business_url ?? '') : undefined,
      vcardEnabled: step9Active ? Boolean(b?.vcard_enabled) : undefined,
      isProCustomer: step9Active ? Boolean(b?.is_pro || b?.plan === 'pending') : undefined,
      customerSubdomain: step9Active ? (b?.subdomain ?? '') : undefined,
      instagramUrl: step9Active ? (b?.instagram_url ?? '') : undefined,
      tiktokUrl: step9Active ? (b?.tiktok_url ?? '') : undefined,
      facebookUrl: step9Active ? (b?.facebook_url ?? '') : undefined,
    }
  }, [
    step1LogoPreviewUrl,
    step1LogoScale,
    businessSnapQuery.data,
    coverLiveObjectUrl,
    galleryLiveObjectUrls,
    aboutLiveObjectUrl,
    previewDescription,
    previewName,
    previewPhone,
    previewTagline,
    previewAddress,
    previewEmail,
    previewMapLat,
    previewMapLng,
    proOffersServices,
    schedulePreview,
    servicesSnapQuery.data,
    step9Active,
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
              disabled={currentStep === 1 || isLoading}
              onClick={goPrev}
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
                void goNext(payload)
              }}
            >
              {currentStep === 8 ? 'Publicar' : 'Continuar'}
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

  const previewTitle = useMemo(() => {
    const match = templates.find((t, i) => resolveStep1PreviewVariant(t, i) === step1PreviewVariant)
    const name = match?.name?.trim()
    if (name) return name
    return step1PreviewVariant === 'bloom-studio' ? 'Bloom Studio' : 'Noir Elite'
  }, [templates, step1PreviewVariant])

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
        return proSetupPhase === 'services'
          ? 'Enfocamos la sección de servicios de tu plantilla.'
          : 'Enfocamos enlaces y datos de contacto (Google Business, vCard…).'
      default:
        return ''
    }
  }, [currentStep, proSetupPhase])

  const renderPreview = useCallback(() => {
    switch (currentStep) {
      case 1:
        return (
          <TplPreview
            variant={step1PreviewVariant}
            previewData={{ logoUrl: step1LogoPreviewUrl, logoScale: step1LogoScale }}
          />
        )
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
        return <PublicarPreview />
      case 9:
        return proSetupPhase === 'services' ? (
          <ServiciosPreview variant={step1PreviewVariant} previewData={templatePreviewData} />
        ) : (
          <UbicacionPreview variant={step1PreviewVariant} previewData={templatePreviewData} />
        )
      default:
        return null
    }
  }, [currentStep, proSetupPhase, step1PreviewVariant, step1LogoPreviewUrl, step1LogoScale, templatePreviewData])

  const stepBody = useMemo(() => {
    const common = { errors, isLoading }
    switch (currentStep) {
      case 1:
        return (
          <Step1Plantilla
            {...common}
            templates={templates}
            onTemplatePreviewChange={setStep1PreviewVariant}
            serverLogoPreviewUrl={step1LogoPreviewUrl}
            onStep1LogoPreviewChange={setStep1LogoPreviewUrl}
            logoScale={step1LogoScale}
            onLogoScaleChange={setStep1LogoScale}
          />
        )
      case 2:
        return (
          <Step2Portada
            {...common}
            currentCoverFile={coverFile}
            initialBusinessName={previewName}
            initialTagline={previewTagline}
            onCoverChange={setCoverFile}
            onBusinessMetaChange={handleBusinessMetaChange}
          />
        )
      case 3:
        return (
          <Step3Sobre
            {...common}
            initialBusinessName={previewName}
            initialTagline={previewTagline}
            description={previewDescription}
            onDescriptionChange={setPreviewDescription}
            contactPhone={previewPhone}
            onContactPhoneChange={setPreviewPhone}
            currentAboutPhotoFile={aboutTeamFile}
            onAboutPhotoChange={setAboutTeamFile}
          />
        )
      case 4:
        return (
          <Step4Galeria
            {...common}
            pro={galleryProExperience}
            postCheckoutProBanner={postCheckoutProGallery}
            galleryAppendMode={galleryAppendMode}
            existingPhotoUrls={existingGalleryUrls}
            newPhotos={newGalleryFiles}
            onNewPhotosChange={setNewGalleryFiles}
            photos={galleryPhotoFiles}
            onPhotosChange={setGalleryPhotoFiles}
            onGalleryPreviewUrlsChange={setGalleryPreviewUrls}
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
            initialEmail={previewEmail}
            mapLat={previewMapLat}
            mapLng={previewMapLng}
            onPhoneChange={handlePhoneChange}
            onAddressChange={handleAddressChange}
            onEmailChange={handleEmailChange}
            onMapCoordsChange={onPreviewMapCoordsChange}
          />
        )
      case 7:
        return <Step7Plan {...common} />
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
    handleBusinessMetaChange,
    previewName,
    previewTagline,
    previewPhone,
    previewDescription,
    aboutTeamFile,
    galleryPhotoFiles,
    galleryAppendMode,
    existingGalleryUrls,
    newGalleryFiles,
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
    proSetupPhase,
    resetProExtrasFlow,
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
