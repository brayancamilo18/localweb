import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { register } from '../api/auth'
import { markPostAuthGrace } from '../api/client'
import { clearReferralStorage, getValidReferralCodeFromStorage } from '../lib/referralStorage'
import { keys } from '../api/queryKeys'
import { LocationPicker } from '../components/location/LocationPicker'
import { PasswordVisibilityToggle } from '../components/auth/PasswordVisibilityToggle'
import { SocialAuthButtons } from '../components/auth/SocialAuthButtons'
import { Btn, Field, Icon, Input } from '../components/primitives/primitives'
import { SectorIcon } from '../components/primitives/SectorIcon'
import { emptyLocation, isValidLocation } from '../lib/location/locationData'
import {
  RegisterFormFooterNotice,
  RegisterMarketingCheckbox,
  RegisterTermsCheckbox,
} from '../components/legal/RegisterLegalNotices'
import { LoginLayout, REGISTER_FEATURES } from '../layouts/LoginLayout'
import { useApiError } from '../hooks/useApiError'
import { usePasswordReveal } from '../hooks/usePasswordReveal'
import { clearAllOnboardingPersist } from '../features/onboarding/onboardingPersist'
import { useAuthStore } from '../store/authStore'

const SECTORS_PAGE_SIZE = 8

/** Mismos ids y etiquetas que el filtro de sector del onboarding (SectorIcon). */
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

function StepDot({ n, active, done, label }: { n: number; active: boolean; done: boolean; label: string }) {
  return (
    <div className="lw-register-step">
      <span
        className={`lw-register-step__dot${active ? ' lw-register-step__dot--active' : ''}${done ? ' lw-register-step__dot--done' : ''}`}
      >
        {done ? <Icon name="check" size={12} stroke={2.5} /> : n}
      </span>
      <span
        className={`lw-register-step__label${active ? ' lw-register-step__label--active' : ''}${done ? ' lw-register-step__label--done' : ''}`}
      >
        {label}
      </span>
    </div>
  )
}

export default function RegisterPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const setAuth = useAuthStore((state) => state.setAuth)
  const [step, setStep] = useState(1)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const passwordReveal = usePasswordReveal()
  const confirmReveal = usePasswordReveal()
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [acceptMarketing, setAcceptMarketing] = useState(false)

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

  useEffect(() => {
    document.title = 'Crea tu cuenta · ONEZ'
    const meta = document.querySelector('meta[name="description"]')
    if (meta) {
      meta.setAttribute(
        'content',
        'Empieza gratis en ONEZ. Tu web profesional lista para abrir en minutos, sin tarjeta.',
      )
    }
  }, [])

  useEffect(() => {
    if (step !== 2) return
    const idx = SECTORS.findIndex((s) => s.id === sector)
    if (idx >= 0) setSectorPage(Math.floor(idx / SECTORS_PAGE_SIZE))
  }, [step])

  const [clientErrors, setClientErrors] = useState<Record<string, string>>({})

  const pwdScore = useMemo(() => {
    let s = 0
    if (password.length >= 8) s++
    if (/[A-Z]/.test(password)) s++
    if (/[0-9]/.test(password)) s++
    if (/[^A-Za-z0-9]/.test(password)) s++
    return s
  }, [password])
  const pwdLabels = ['Demasiado corta', 'Débil', 'Media', 'Buena', 'Excelente']
  const pwdColors = ['#94A3B8', 'var(--lw-danger)', '#D97706', '#16A34A', 'var(--lw-success)']

  const mutation = useMutation({
    mutationFn: () => {
      const referralCode = getValidReferralCodeFromStorage()
      return register(name, email, password, passwordConfirmation, {
        business_name: bizName.trim(),
        sector,
        city: location.city.trim(),
        country: location.country.trim(),
        country_code: location.countryCode.trim().toUpperCase(),
      }, referralCode, acceptMarketing, acceptTerms)
    },
    onSuccess(data) {
      markPostAuthGrace()
      clearReferralStorage()
      clearAllOnboardingPersist()
      setAuth(data.user, data.business)
      queryClient.setQueryData(keys.auth.me, { user: data.user, business: data.business })
      // Tras registro SIEMPRE pasamos por /verify-email. El usuario verifica el email
      // y de ahí baja al onboarding. Esto unifica la experiencia entre móvil y desktop.
      navigate('/verify-email', { replace: true })
    },
  })

  const { fieldErrors, generalError } = useApiError(mutation.error)

  const validateStep1 = () => {
    const e: Record<string, string> = {}
    if (!name.trim()) e.name = 'Necesitamos tu nombre'
    if (!/^[^@]+@[^@]+\.[^@]+$/.test(email)) e.email = 'Email no válido'
    if (password.length < 8) e.password = 'Mínimo 8 caracteres'
    if (passwordConfirmation.trim() === '') {
      e.password_confirmation = 'Repite tu contraseña'
    } else if (password !== passwordConfirmation) {
      e.password_confirmation = 'Las contraseñas no coinciden'
    }
    if (!acceptTerms) e.accept = 'Debes aceptar los términos y la política de privacidad'
    setClientErrors(e)
    return Object.keys(e).length === 0
  }

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
    setClientErrors(e)
    return Object.keys(e).length === 0
  }

  const goNext = () => {
    if (validateStep1()) {
      setStep(2)
      setClientErrors({})
    }
  }

  const finish = (e: FormEvent) => {
    e.preventDefault()
    if (!validateStep2()) return
    mutation.mutate()
  }

  const cardTitle = step === 1 ? 'Crea tu cuenta' : 'Tu negocio'
  const cardSubtitle =
    step === 1
      ? 'Empieza gratis. Sin tarjeta de crédito.'
      : 'Cuéntanos lo básico. Podrás cambiarlo más adelante.'

  return (
    <LoginLayout
      variant="register"
      cardTitle={cardTitle}
      cardSubtitle={cardSubtitle}
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
        <h2 className="lw-login-page__card-title">{cardTitle}</h2>
        <p className="lw-login-page__card-sub">{cardSubtitle}</p>
      </div>

      <div className="lw-register-stepper lw-login-page__card-steps">
        <StepDot n={1} active={step === 1} done={step > 1} label="Cuenta" />
        <span
          className={`lw-register-stepper__line${step > 1 ? ' lw-register-stepper__line--done' : ''}`}
          aria-hidden
        />
        <StepDot n={2} active={step === 2} done={false} label="Negocio" />
      </div>

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

        {step === 1 ? (
          <>
            <form
              className="lw-register-form lw-auth-form"
              onSubmit={(e) => {
                e.preventDefault()
                goNext()
              }}
            >
              <Input
                label="Tu nombre"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Marta García"
                error={clientErrors.name ?? fieldErrors.name}
                prefix={<Icon name="user" size={15} color="var(--lw-text-2)" />}
                style={{ height: 48 }}
                autoComplete="name"
              />
              <Input
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                error={clientErrors.email ?? fieldErrors.email}
                prefix={<Icon name="mail" size={15} color="var(--lw-text-2)" />}
                style={{ height: 48 }}
                autoComplete="email"
              />
              <div>
                <Input
                  ref={passwordReveal.inputRef}
                  label="Contraseña"
                  hint={password ? pwdLabels[pwdScore] : undefined}
                  type={passwordReveal.inputType}
                  inputClassName={passwordReveal.inputClassName}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                  error={clientErrors.password ?? fieldErrors.password}
                  prefix={<Icon name="lock" size={15} color="var(--lw-text-2)" />}
                  style={{ height: 48 }}
                  autoComplete="new-password"
                  suffix={
                    <PasswordVisibilityToggle
                      visible={passwordReveal.visible}
                      onToggle={passwordReveal.toggle}
                      onCaptureSelection={passwordReveal.captureSelection}
                    />
                  }
                />
                {password ? (
                  <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        style={{
                          flex: 1,
                          height: 3,
                          borderRadius: 2,
                          background: i <= pwdScore ? pwdColors[pwdScore] : 'var(--lw-surface)',
                          transition: 'background .15s',
                        }}
                      />
                    ))}
                  </div>
                ) : null}
              </div>

              <Input
                ref={confirmReveal.inputRef}
                label="Repite tu contraseña"
                type={confirmReveal.inputType}
                inputClassName={confirmReveal.inputClassName}
                value={passwordConfirmation}
                onChange={(e) => setPasswordConfirmation(e.target.value)}
                placeholder="Vuelve a escribir la contraseña"
                error={clientErrors.password_confirmation ?? fieldErrors.password_confirmation}
                prefix={<Icon name="lock" size={15} color="var(--lw-text-2)" />}
                style={{ height: 48 }}
                autoComplete="new-password"
                suffix={
                  <PasswordVisibilityToggle
                    visible={confirmReveal.visible}
                    onToggle={confirmReveal.toggle}
                    onCaptureSelection={confirmReveal.captureSelection}
                    labelShow="Mostrar repetición de contraseña"
                    labelHide="Ocultar repetición de contraseña"
                  />
                }
              />

              <RegisterTermsCheckbox
                checked={acceptTerms}
                onChange={setAcceptTerms}
                error={clientErrors.accept}
              />
              <RegisterMarketingCheckbox checked={acceptMarketing} onChange={setAcceptMarketing} />

              <Btn
                type="submit"
                kind="primary"
                size="lg"
                fullWidth
                iconRight="arrowRight"
                style={{ height: 48, marginTop: 4 }}
              >
                Continuar
              </Btn>

              <SocialAuthButtons dividerLabel="o regístrate con" placement="bottom" />

              <p className="lw-login-page__form-footnote lw-register-form__footnote">
                ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
              </p>
            </form>
          </>
        ) : (
          <>
            <form className="lw-register-form lw-auth-form" onSubmit={finish}>
              <Input
                label="Nombre del negocio"
                value={bizName}
                onChange={(e) => setBizName(e.target.value)}
                placeholder="Estudio Marta"
                error={clientErrors.bizName ?? fieldErrors.name}
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

              <RegisterFormFooterNotice />

              <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                <Btn
                  kind="outline"
                  size="lg"
                  icon="chevronLeft"
                  type="button"
                  onClick={() => {
                    setStep(1)
                    setClientErrors({})
                  }}
                >
                  Atrás
                </Btn>
                <Btn
                  type="submit"
                  kind="primary"
                  size="lg"
                  iconRight="sparkle"
                  fullWidth
                  loading={mutation.isPending}
                  style={{ height: 48 }}
                >
                  {mutation.isPending ? 'Creando cuenta…' : 'Crear mi cuenta'}
                </Btn>
              </div>
            </form>

            <p className="lw-login-page__form-footnote">
              ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
            </p>
          </>
        )}
    </LoginLayout>
  )
}
