import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Btn } from '../../components/primitives'
import { getBusiness } from '../../api/dashboard'
import { getServices } from '../../api/services'
import { fetchOnboardingTemplates, hydrateGalleryFromServerUrls } from '../../api/onboarding'
import { keys } from '../../api/queryKeys'
import type { Schedule, Template } from '../../types/api'
import { useOnboarding } from './useOnboarding'
import Step9ProSetup from './steps/Step9ProSetup'
import {
  dataUrlToFile,
  isPersistableSchedule,
  loadOnboardingPersist,
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
  /** Conserva las fotos de galería al navegar entre pasos (igual que portada / sobre nosotros). */
  const [galleryPhotoFiles, setGalleryPhotoFiles] = useState<File[]>([])
  const [schedulePreview, setSchedulePreview] = useState<Schedule>(DEFAULT_SCHEDULE)
  const [step1PreviewVariant, setStep1PreviewVariant] = useState<Step1PreviewVariant>('noir-elite')
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [previewName, setPreviewName] = useState('')
  const [previewTagline, setPreviewTagline] = useState('')
  const [previewPhone, setPreviewPhone] = useState('')
  const [coverPreviewUrl, setCoverPreviewUrl] = useState<string | undefined>(undefined)
  const [previewDescription, setPreviewDescription] = useState('')
  const [aboutTeamFile, setAboutTeamFile] = useState<File | null>(null)
  const [previewAboutPhotoUrl, setPreviewAboutPhotoUrl] = useState<string | undefined>(undefined)
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

  useEffect(() => {
    if (!coverFile) {
      setCoverPreviewUrl(undefined)
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      const value = typeof reader.result === 'string' ? reader.result : undefined
      setCoverPreviewUrl(value)
    }
    reader.onerror = () => setCoverPreviewUrl(undefined)
    reader.readAsDataURL(coverFile)
  }, [coverFile])

  useEffect(() => {
    if (!aboutTeamFile) {
      setPreviewAboutPhotoUrl(undefined)
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      setPreviewAboutPhotoUrl(typeof reader.result === 'string' ? reader.result : undefined)
    }
    reader.onerror = () => setPreviewAboutPhotoUrl(undefined)
    reader.readAsDataURL(aboutTeamFile)
  }, [aboutTeamFile])

  useEffect(() => {
    wizardHydratedRef.current = false
    setGalleryPreviewUrls([])
    setGalleryPhotoFiles([])
    setSchedulePreview(DEFAULT_SCHEDULE)
    setStep1PreviewVariant('noir-elite')
    setCoverFile(null)
    setAboutTeamFile(null)
    setPreviewName('')
    setPreviewTagline('')
    setPreviewPhone('')
    setCoverPreviewUrl(undefined)
    setPreviewDescription('')
    setPreviewAboutPhotoUrl(undefined)
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

    setPreviewName(String(p?.previewName ?? d.business_name ?? ''))
    setPreviewTagline(String(p?.previewTagline ?? d.tagline ?? ''))
    setPreviewPhone(String(p?.previewPhone ?? d.phone ?? ''))
    setPreviewDescription(String(p?.previewDescription ?? d.description ?? ''))
    setPreviewAddress(String(p?.previewAddress ?? d.address ?? ''))
    setPreviewEmail(String(p?.previewEmail ?? d.email ?? ''))

    if (p?.step1PreviewVariant === 'noir-elite' || p?.step1PreviewVariant === 'bloom-studio') {
      setStep1PreviewVariant(p.step1PreviewVariant)
    }

    if (isPersistableSchedule(p?.schedule)) {
      setSchedulePreview(p.schedule)
    } else if (isPersistableSchedule(d.schedule)) {
      setSchedulePreview(d.schedule as Schedule)
    }

    const serverGalleryUrls = Array.isArray(d.gallery_preview_urls)
      ? (d.gallery_preview_urls as unknown[]).filter((u): u is string => typeof u === 'string' && u.trim().length > 0)
      : []

    if (p?.galleryDataUrls?.length) {
      setGalleryPreviewUrls(p.galleryDataUrls)
      void Promise.all(p.galleryDataUrls.map((url, i) => dataUrlToFile(url, `gallery-${i}.jpg`))).then(
        (files) => {
          const ok = files.filter((f): f is File => f != null)
          if (ok.length) setGalleryPhotoFiles(ok)
        },
      )
    } else if (serverGalleryUrls.length > 0) {
      void hydrateGalleryFromServerUrls(serverGalleryUrls)
        .then((files) => {
          if (files.length) setGalleryPhotoFiles(files)
        })
        .catch(() => {
          /* URLs inaccesibles: el usuario puede volver a subir la galería */
        })
    }

    if (p?.coverDataUrl) {
      setCoverPreviewUrl(p.coverDataUrl)
      void dataUrlToFile(p.coverDataUrl, 'portada.jpg').then((f) => f && setCoverFile(f))
    }

    if (p?.aboutDataUrl) {
      setPreviewAboutPhotoUrl(p.aboutDataUrl)
      void dataUrlToFile(p.aboutDataUrl, 'equipo.jpg').then((f) => f && setAboutTeamFile(f))
    }
  }, [isPendingStatus, serverDraft, persistUserId])

  useEffect(() => {
    if (isPendingStatus || !wizardHydratedRef.current || persistUserId == null) return
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
      coverDataUrl: coverPreviewUrl,
      aboutDataUrl: previewAboutPhotoUrl,
      galleryDataUrls:
        galleryPhotoFiles.length === 0 ? [] : galleryPreviewUrls.length > 0 ? galleryPreviewUrls : undefined,
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
    coverPreviewUrl,
    previewAboutPhotoUrl,
    galleryPreviewUrls,
    galleryPhotoFiles.length,
  ])

  const templatePreviewData = useMemo<TemplatePreviewData>(() => {
    const b = businessSnapQuery.data
    const galleryUrls =
      galleryPreviewUrls.length > 0
        ? galleryPreviewUrls
        : step9Active && b?.images?.gallery?.length
          ? b.images.gallery.map((g) => g.url).filter(Boolean)
          : galleryPreviewUrls
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
      businessName: name,
      tagline: previewTagline || undefined,
      phone: (previewPhone.trim() || b?.phone || '').trim() || undefined,
      coverUrl: coverPreviewUrl,
      description: previewDescription || undefined,
      aboutPhotoUrl: previewAboutPhotoUrl,
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
    }
  }, [
    businessSnapQuery.data,
    coverPreviewUrl,
    galleryPreviewUrls,
    previewAboutPhotoUrl,
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

  const preview = useMemo(() => {
    switch (currentStep) {
      case 1:
        return <TplPreview variant={step1PreviewVariant} />
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
  }, [currentStep, proSetupPhase, schedulePreview, step1PreviewVariant, templatePreviewData])

  const stepBody = useMemo(() => {
    const common = { errors, isLoading }
    switch (currentStep) {
      case 1:
        return (
          <Step1Plantilla
            {...common}
            templates={templates}
            onTemplatePreviewChange={setStep1PreviewVariant}
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
            onBusinessMetaChange={({ businessName, tagline }) => {
              setPreviewName(businessName ?? '')
              setPreviewTagline(tagline ?? '')
            }}
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
            onPhoneChange={(phone) => setPreviewPhone(phone ?? '')}
            onAddressChange={(addr) => setPreviewAddress(addr ?? '')}
            onEmailChange={(em) => setPreviewEmail(em ?? '')}
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
    previewName,
    previewTagline,
    previewPhone,
    previewDescription,
    aboutTeamFile,
    galleryPhotoFiles,
    schedulePreview,
    previewAddress,
    previewEmail,
    previewMapLat,
    previewMapLng,
    onPreviewMapCoordsChange,
    reservedSubdomain,
    galleryProExperience,
    postCheckoutProGallery,
    proOffersServices,
    proSetupPhase,
    resetProExtrasFlow,
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
      <WizardLayout step={currentStep} preview={preview}>
        {stepBody}
      </WizardLayout>
    </WizardNavContext.Provider>
  )
}
