import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { completeSocialRegistration, socialMe } from '../api/auth'
import { markPostAuthGrace } from '../api/client'
import { keys } from '../api/queryKeys'
import { SocialRegisterWelcomeModal } from '../components/auth/SocialRegisterWelcomeModal'
import { LocationPicker } from '../components/location/LocationPicker'
import {
  RegisterFormFooterNotice,
  RegisterMarketingCheckbox,
  RegisterTermsCheckbox,
} from '../components/legal/RegisterLegalNotices'
import { Btn, Field, Icon, Input } from '../components/primitives/primitives'
import { SectorIcon } from '../components/primitives/SectorIcon'
import { clearAllOnboardingPersist } from '../features/onboarding/onboardingPersist'
import { useApiError } from '../hooks/useApiError'
import { useAuth } from '../hooks/useAuth'
import { LoginLayout, REGISTER_FEATURES } from '../layouts/LoginLayout'
import { emptyLocation, isValidLocation } from '../lib/location/locationData'
import { clearReferralStorage, getValidReferralCodeFromStorage } from '../lib/referralStorage'
import { useAuthStore } from '../store/authStore'

const SECTORS_PAGE_SIZE = 8

const SECTORS = [
  { id: 'peluqueria', label: 'Peluquería' },
  { id: 'barberia', label: 'Barbería' },
  { id: 'estetica', label: 'Estética' },
  { id: 'spa', label: 'Spa' },
  { id: 'restaurante', label: 'Restaurante' },
  { id: 'cafeteria', label: 'Cafetería' },
  { id: 'bar', label: 'Bar' },
  { id: 'panaderia', label: 'Panadería' },
  { id: 'tienda_ropa', label: 'Tienda de ropa' },
  { id: 'tienda_calzado', label: 'Calzado' },
  { id: 'floristeria', label: 'Floristería' },
  { id: 'farmacia', label: 'Farmacia' },
  { id: 'clinica_dental', label: 'Clínica dental' },
  { id: 'fisioterapia', label: 'Fisioterapia' },
  { id: 'gimnasio', label: 'Gimnasio' },
  { id: 'otros', label: 'Otros' },
]

export default function SocialRegisterPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const setAuth = useAuthStore((state) => state.setAuth)
  const { isLoading: authLoading, isAuthenticated } = useAuth()

  const [bizName, setBizName] = useState('')
  const [sector, setSector] = useState('peluqueria')
  const [sectorPage, setSectorPage] = useState(0)
  const [animDir, setAnimDir] = useState<1 | -1>(1)
  const [animKey, setAnimKey] = useState(0)
  const [location, setLocation] = useState<{
    countryCode: string
    city: string
    country: string
  }>(() => emptyLocation())
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [acceptMarketing, setAcceptMarketing] = useState(false)
  const [clientErrors, setClientErrors] = useState<Record<string, string>>({})
  const [welcomeOpen, setWelcomeOpen] = useState(true)

  const socialMeQuery = useQuery({
    queryKey: ['auth', 'social', 'me'] as const,
    queryFn: socialMe,
    enabled: isAuthenticated,
    retry: false,
  })

  const socialProfile = socialMeQuery.data

  useEffect(() => {
    document.title = 'Termina tu registro · ONEZ'
    const meta = document.querySelector('meta[name="description"]')
    if (meta) {
      meta.setAttribute(
        'content',
        'Completa los datos de tu negocio en ONEZ tras iniciar sesión con Google.',
      )
    }
  }, [])

  useEffect(() => {
    if (!socialProfile) return
    if (socialProfile.business_id != null && socialProfile.terms_accepted_at != null) {
      navigate('/dashboard', { replace: true })
      return
    }
    if (socialProfile.provider == null) {
      navigate('/register', { replace: true })
    }
  }, [socialProfile, navigate])

  const mutation = useMutation({
    mutationFn: () => {
      const referralCode = getValidReferralCodeFromStorage()
      return completeSocialRegistration(
        {
          business_name: bizName.trim(),
          sector,
          city: location.city.trim(),
          country: location.country.trim(),
          country_code: location.countryCode.trim().toUpperCase(),
        },
        acceptTerms,
        acceptMarketing,
        referralCode,
      )
    },
    onSuccess(data) {
      markPostAuthGrace()
      clearReferralStorage()
      clearAllOnboardingPersist()
      setAuth(data.user, data.business)
      queryClient.setQueryData(keys.auth.me, { user: data.user, business: data.business })
      navigate('/onboarding', { replace: true })
    },
    onError(error) {
      const status = (error as { response?: { status?: number } })?.response?.status
      if (status === 409) {
        navigate('/dashboard', { replace: true })
      }
    },
  })

  const { fieldErrors, generalError } = useApiError(mutation.error)

  const validateStep2 = () => {
    const e: Record<string, string> = {}
    if (!bizName.trim()) e.bizName = 'Pon el nombre de tu negocio'
    if (!location.countryCode.trim()) {
      e.country = '¿En qué país estáis?'
    } else if (!location.city.trim()) {
      e.city = '¿En qué ciudad estáis?'
    } else if (!isValidLocation(location)) {
      e.city = 'Elige una ciudad de la lista'
    }
    if (!acceptTerms) e.accept = 'Debes aceptar los términos y la política de privacidad'
    setClientErrors(e)
    return Object.keys(e).length === 0
  }

  const finish = (e: FormEvent) => {
    e.preventDefault()
    if (!validateStep2()) return
    mutation.mutate()
  }

  if (authLoading && !isAuthenticated) {
    return null
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (socialMeQuery.isLoading || socialMeQuery.isFetching) {
    return (
      <LoginLayout variant="register" cardTitle="Termina tu registro" cardSubtitle="Cargando…">
        <p className="lw-login-page__card-sub">Un momento…</p>
      </LoginLayout>
    )
  }

  if (socialMeQuery.isError || !socialProfile) {
    return <Navigate to="/login" replace />
  }

  if (
    socialProfile.business_id != null &&
    socialProfile.terms_accepted_at != null
  ) {
    return null
  }

  if (socialProfile.provider == null) {
    return null
  }

  const providerLabel = socialProfile.provider === 'google' ? 'Google' : 'tu cuenta social'

  return (
    <LoginLayout
      variant="register"
      cardTitle="Termina tu registro"
      cardSubtitle="Cuéntanos lo básico de tu negocio."
      heroBadge="Empieza gratis · sin tarjeta"
      heroTitle={
        <>
          <span className="lw-login-page__hero-title-line">Tu web profesional,</span>
          <br className="lw-login-page__hero-title-br" />
          lista para abrir.
        </>
      }
      heroSub="Sin programar. Sin diseñador. Responde unas preguntas y ONEZ hace el resto."
      features={REGISTER_FEATURES}
    >
      <div className="lw-login-page__card-intro lw-login-page__card-intro--mobile">
        <h2 className="lw-login-page__card-title">Termina tu registro</h2>
        <p className="lw-login-page__card-sub">Cuéntanos lo básico de tu negocio.</p>
      </div>

      <SocialRegisterWelcomeModal
        open={welcomeOpen}
        name={socialProfile.name}
        providerLabel={providerLabel}
        onContinue={() => setWelcomeOpen(false)}
      />

      {mutation.isError && generalError ? (
        <div
          style={{
            marginBottom: 16,
            border: '1px solid var(--lw-danger)',
            background: 'var(--lw-danger-soft)',
            color: 'var(--lw-danger)',
            padding: '10px 12px',
            borderRadius: 'var(--lw-r-sm)',
            fontSize: 14,
          }}
        >
          {generalError}
        </div>
      ) : null}

      <form className="lw-register-form lw-auth-form" onSubmit={finish}>
        <Input
          label="Nombre del negocio"
          value={bizName}
          onChange={(e) => setBizName(e.target.value)}
          placeholder="Estudio Marta"
          error={clientErrors.bizName ?? fieldErrors.business_name}
          prefix={<Icon name="layout" size={15} color="var(--lw-text-2)" />}
          style={{ height: 48 }}
          autoComplete="organization"
        />

        <Field label="¿A qué te dedicas?">
          <div>
            <style>
              {`
@keyframes lw-slide-in-right {
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
}
@keyframes lw-slide-in-left {
  from { transform: translateX(-100%); }
  to { transform: translateX(0); }
}
`}
            </style>
            <div style={{ overflow: 'hidden' }}>
              <div
                key={animKey}
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: 8,
                  ...(animKey > 0
                    ? {
                        animation: `${animDir === 1 ? 'lw-slide-in-right' : 'lw-slide-in-left'} 220ms ease-out`,
                      }
                    : {}),
                }}
              >
                {SECTORS.slice(
                  sectorPage * SECTORS_PAGE_SIZE,
                  sectorPage * SECTORS_PAGE_SIZE + SECTORS_PAGE_SIZE,
                ).map((s, i) => {
                  const globalIdx = sectorPage * SECTORS_PAGE_SIZE + i
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => {
                        setSector(s.id)
                        setSectorPage(Math.floor(globalIdx / SECTORS_PAGE_SIZE))
                      }}
                      style={{
                        padding: '12px 8px',
                        background: sector === s.id ? 'var(--lw-accent-soft)' : 'var(--lw-bg-elev)',
                        border: `1.5px solid ${sector === s.id ? 'var(--lw-accent)' : 'var(--lw-border)'}`,
                        borderRadius: 'var(--lw-r-sm)',
                        color: sector === s.id ? 'var(--lw-accent-hover)' : 'var(--lw-text-2)',
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 6,
                        fontSize: 14,
                        fontWeight: 500,
                        transition: 'all .12s',
                      }}
                    >
                      <SectorIcon id={s.id} size={18} />
                      {s.label}
                    </button>
                  )
                })}
              </div>
            </div>
            <div
              role="tablist"
              aria-label="Página de sectores"
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: 8,
                marginTop: 12,
              }}
            >
              {Array.from({ length: Math.ceil(SECTORS.length / SECTORS_PAGE_SIZE) }).map((_, pi) => {
                const active = pi === sectorPage
                return (
                  <button
                    key={pi}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => {
                      if (pi === sectorPage) return
                      setAnimDir(pi > sectorPage ? 1 : -1)
                      setAnimKey((k) => k + 1)
                      setSectorPage(pi)
                    }}
                    style={{
                      padding: 0,
                      border: 'none',
                      cursor: 'pointer',
                      height: 8,
                      borderRadius: 999,
                      background: active ? 'var(--lw-accent)' : 'var(--lw-border-2)',
                      width: active ? 22 : 8,
                      transition: 'width .25s ease, background .25s ease',
                    }}
                  />
                )
              })}
            </div>
          </div>
        </Field>

        <LocationPicker
          value={location}
          onChange={setLocation}
          cityError={clientErrors.city}
          countryError={clientErrors.country}
        />

        <RegisterTermsCheckbox
          checked={acceptTerms}
          onChange={setAcceptTerms}
          error={clientErrors.accept}
        />
        <RegisterMarketingCheckbox checked={acceptMarketing} onChange={setAcceptMarketing} />

        <RegisterFormFooterNotice />

        <Btn
          type="submit"
          kind="primary"
          size="lg"
          iconRight="sparkle"
          fullWidth
          loading={mutation.isPending}
          style={{ height: 48, marginTop: 8 }}
        >
          {mutation.isPending ? 'Creando cuenta…' : 'Crear mi cuenta'}
        </Btn>
      </form>

      <p className="lw-login-page__form-footnote">
        ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
      </p>
    </LoginLayout>
  )
}
