import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { register } from '../api/auth'
import { keys } from '../api/queryKeys'
import { Btn, Field, Icon, Input } from '../components/primitives/primitives'
import { AuthSplitLayout } from '../layouts/AuthSplitLayout'
import { useApiError } from '../hooks/useApiError'
import { clearAllOnboardingPersist } from '../features/onboarding/onboardingPersist'
import { useAuthStore } from '../store/authStore'

const SECTORS_PAGE_SIZE = 8

const SECTORS = [
  { id: 'peluqueria', label: 'Peluquería', icon: 'scissors' as const },
  { id: 'barberia', label: 'Barbería', icon: 'scissors' as const },
  { id: 'estetica', label: 'Estética', icon: 'sparkle' as const },
  { id: 'spa', label: 'Spa', icon: 'clock' as const },
  { id: 'restaurante', label: 'Restaurante', icon: 'list' as const },
  { id: 'cafeteria', label: 'Cafetería', icon: 'list' as const },
  { id: 'bar', label: 'Bar', icon: 'star' as const },
  { id: 'panaderia', label: 'Panadería', icon: 'palette' as const },
  { id: 'tienda_ropa', label: 'Tienda de ropa', icon: 'creditCard' as const },
  { id: 'tienda_calzado', label: 'Calzado', icon: 'layout' as const },
  { id: 'floristeria', label: 'Floristería', icon: 'image' as const },
  { id: 'farmacia', label: 'Farmacia', icon: 'shield' as const },
  { id: 'clinica_dental', label: 'Clínica dental', icon: 'users' as const },
  { id: 'fisioterapia', label: 'Fisioterapia', icon: 'bolt' as const },
  { id: 'gimnasio', label: 'Gimnasio', icon: 'trending' as const },
  { id: 'otros', label: 'Otros', icon: 'grid' as const },
]

function StepDot({ n, active, done, label }: { n: number; active: boolean; done: boolean; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span
        style={{
          width: 24,
          height: 24,
          borderRadius: 999,
          background: active ? 'var(--lw-accent)' : done ? 'var(--lw-success)' : 'var(--lw-surface)',
          color: active || done ? '#fff' : 'var(--lw-text-4)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 12,
          fontWeight: 700,
          transition: 'background .2s',
        }}
      >
        {done ? <Icon name="check" size={13} stroke={2.5} /> : n}
      </span>
      <span
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: active ? 'var(--lw-text)' : done ? 'var(--lw-text-2)' : 'var(--lw-text-4)',
        }}
      >
        {label}
      </span>
    </div>
  )
}

function SocialGoogle() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.6 12.2c0-.7-.1-1.4-.2-2H12v3.8h5.9c-.3 1.4-1 2.5-2.2 3.3v2.7h3.5c2-1.9 3.4-4.7 3.4-7.8z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.9 0 5.4-.9 7.2-2.5l-3.5-2.7c-1 .7-2.2 1-3.7 1-2.8 0-5.2-1.9-6.1-4.5H2.3v2.8C4.1 20.5 7.8 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.9 14.3c-.2-.7-.4-1.4-.4-2.3s.1-1.6.4-2.3V6.9H2.3C1.5 8.4 1 10.1 1 12s.5 3.6 1.3 5.1l3.6-2.8z"
      />
      <path
        fill="#EA4335"
        d="M12 5.4c1.6 0 3 .5 4.1 1.6l3.1-3.1C17.4 2.1 14.9 1 12 1 7.8 1 4.1 3.5 2.3 6.9l3.6 2.8c.9-2.6 3.3-4.3 6.1-4.3z"
      />
    </svg>
  )
}

function SocialApple() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M17.05 12.04c-.03-3.07 2.5-4.55 2.62-4.62-1.43-2.09-3.66-2.38-4.45-2.41-1.9-.19-3.7 1.12-4.66 1.12-.97 0-2.45-1.09-4.04-1.06-2.07.03-3.99 1.21-5.06 3.07-2.16 3.74-.55 9.27 1.55 12.31 1.03 1.49 2.25 3.16 3.85 3.1 1.55-.06 2.13-1 4-1 1.86 0 2.4 1 4.03.97 1.66-.03 2.71-1.51 3.73-3 .96-1.4 1.36-2.77 1.39-2.84-.03-.01-2.66-1.02-2.69-4.04zM14.36 3.94c.85-1.04 1.43-2.49 1.27-3.94-1.23.05-2.72.82-3.61 1.86-.79.91-1.49 2.39-1.3 3.81 1.37.11 2.79-.7 3.64-1.73z" />
    </svg>
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
  const [pwdReveal, setPwdReveal] = useState(false)
  const [pwdConfirmReveal, setPwdConfirmReveal] = useState(false)
  const [accept, setAccept] = useState(false)

  const [bizName, setBizName] = useState('')
  const [sector, setSector] = useState('peluqueria')
  const [sectorPage, setSectorPage] = useState(0)
  const [animDir, setAnimDir] = useState<1 | -1>(1)
  const [animKey, setAnimKey] = useState(0)
  const [city, setCity] = useState('')

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
    mutationFn: () => register(name, email, password, passwordConfirmation),
    onSuccess(data) {
      try {
        sessionStorage.setItem(
          'lw_signup_prefill',
          JSON.stringify({
            business_name: bizName.trim(),
            sector,
            address: city.trim(),
          }),
        )
      } catch {
        /* ignore */
      }
      clearAllOnboardingPersist()
      setAuth(data.user, data.business)
      queryClient.setQueryData(keys.auth.me, { user: data.user, business: data.business })
      // El onboarding está bloqueado tras el muro de verificación de email.
      navigate(data.user?.email_verified_at ? '/onboarding' : '/verify-email')
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
    if (!accept) e.accept = 'Debes aceptar los términos'
    setClientErrors(e)
    return Object.keys(e).length === 0
  }

  const validateStep2 = () => {
    const e: Record<string, string> = {}
    if (!bizName.trim()) e.bizName = 'Pon el nombre de tu negocio'
    if (!city.trim()) e.city = '¿En qué ciudad estáis?'
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

  const headerExtra = (
    <span className="lw-small">
      ¿Ya tienes cuenta?{' '}
      <Link to="/login" style={{ color: 'var(--lw-accent)', fontWeight: 500 }}>
        Inicia sesión
      </Link>
    </span>
  )

  return (
    <AuthSplitLayout hero="signup" headerExtra={headerExtra}>
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          maxWidth: 440,
          width: '100%',
        }}
      >
        <div style={{ display: 'flex', gap: 8, marginBottom: 24, alignItems: 'center' }}>
          <StepDot n={1} active={step === 1} done={step > 1} label="Cuenta" />
          <div
            style={{
              flex: 1,
              height: 2,
              background: step > 1 ? 'var(--lw-success)' : 'var(--lw-border)',
              alignSelf: 'center',
              borderRadius: 2,
              transition: 'background .3s',
            }}
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
              fontSize: 13,
            }}
          >
            {generalError}
          </div>
        ) : null}

        {step === 1 ? (
          <>
            <h1 className="lw-h1" style={{ margin: '0 0 10px' }}>
              Crea tu cuenta
            </h1>
            <p className="lw-body" style={{ marginBottom: 28 }}>
              Empieza gratis. Sin tarjeta de crédito.
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                goNext()
              }}
              style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
            >
              <Input
                label="Tu nombre"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Marta García"
                error={clientErrors.name ?? fieldErrors.name}
                prefix={<Icon name="user" size={15} color="var(--lw-text-2)" />}
                style={{ height: 44 }}
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
                style={{ height: 44 }}
                autoComplete="email"
              />
              <div>
                <Input
                  label="Contraseña"
                  hint={password ? pwdLabels[pwdScore] : undefined}
                  type={pwdReveal ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                  error={clientErrors.password ?? fieldErrors.password}
                  prefix={<Icon name="lock" size={15} color="var(--lw-text-2)" />}
                  style={{ height: 44 }}
                  autoComplete="new-password"
                  suffix={
                    password ? (
                      <button
                        type="button"
                        onClick={() => setPwdReveal(!pwdReveal)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--lw-text-3)',
                          cursor: 'pointer',
                          padding: 4,
                          display: 'inline-flex',
                        }}
                        aria-label={pwdReveal ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                      >
                        <Icon name="eye" size={14} />
                      </button>
                    ) : null
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
                label="Repite tu contraseña"
                type={pwdConfirmReveal ? 'text' : 'password'}
                value={passwordConfirmation}
                onChange={(e) => setPasswordConfirmation(e.target.value)}
                placeholder="Vuelve a escribir la contraseña"
                error={clientErrors.password_confirmation ?? fieldErrors.password_confirmation}
                prefix={<Icon name="lock" size={15} color="var(--lw-text-2)" />}
                style={{ height: 44 }}
                autoComplete="new-password"
                suffix={
                  passwordConfirmation ? (
                    <button
                      type="button"
                      onClick={() => setPwdConfirmReveal(!pwdConfirmReveal)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--lw-text-3)',
                        cursor: 'pointer',
                        padding: 4,
                        display: 'inline-flex',
                      }}
                      aria-label={pwdConfirmReveal ? 'Ocultar repetición de contraseña' : 'Mostrar repetición de contraseña'}
                    >
                      <Icon name="eye" size={14} />
                    </button>
                  ) : null
                }
              />

              <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', cursor: 'pointer', marginTop: 4 }}>
                <span
                  role="checkbox"
                  aria-label="Acepto términos y política de privacidad"
                  aria-checked={accept}
                  tabIndex={0}
                  onKeyDown={(ev) => {
                    if (ev.key === 'Enter' || ev.key === ' ') {
                      ev.preventDefault()
                      setAccept((a) => !a)
                    }
                  }}
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: 4,
                    flexShrink: 0,
                    marginTop: 2,
                    background: accept ? 'var(--lw-accent)' : 'var(--lw-bg-elev)',
                    border: `1.5px solid ${clientErrors.accept ? 'var(--lw-danger)' : accept ? 'var(--lw-accent)' : 'var(--lw-border-2)'}`,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  onClick={(e) => {
                    e.preventDefault()
                    setAccept(!accept)
                  }}
                >
                  {accept ? <Icon name="check" size={11} stroke={3} color="#fff" /> : null}
                </span>
                <span style={{ fontSize: 13, color: 'var(--lw-text-2)', lineHeight: 1.5 }}>
                  Acepto los <span style={{ color: 'var(--lw-accent)' }}>términos</span> y la{' '}
                  <span style={{ color: 'var(--lw-accent)' }}>política de privacidad</span>.
                </span>
              </label>
              {clientErrors.accept ? (
                <div
                  style={{
                    fontSize: 12,
                    color: 'var(--lw-danger)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    marginTop: -6,
                  }}
                >
                  <Icon name="alert" size={12} />
                  {clientErrors.accept}
                </div>
              ) : null}

              <Btn type="submit" kind="primary" size="lg" fullWidth iconRight="arrowRight">
                Continuar
              </Btn>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '8px 0', color: 'var(--lw-text-3)', fontSize: 12 }}>
                <div style={{ flex: 1, height: 1, background: 'var(--lw-border)' }} />
                o regístrate con
                <div style={{ flex: 1, height: 1, background: 'var(--lw-border)' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <Btn kind="outline" size="md" type="button" disabled title="Próximamente">
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                    <SocialGoogle /> Google
                  </span>
                </Btn>
                <Btn kind="outline" size="md" type="button" disabled title="Próximamente">
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                    <SocialApple /> Apple
                  </span>
                </Btn>
              </div>
            </form>
          </>
        ) : (
          <>
            <h1 className="lw-h1" style={{ margin: '0 0 10px' }}>
              Tu negocio
            </h1>
            <p className="lw-body" style={{ marginBottom: 28 }}>
              Cuéntanos lo básico. Podrás cambiarlo más adelante.
            </p>
            <form onSubmit={finish} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <Input
                label="Nombre del negocio"
                value={bizName}
                onChange={(e) => setBizName(e.target.value)}
                placeholder="Estudio Marta"
                error={clientErrors.bizName ?? fieldErrors.name}
                prefix={<Icon name="layout" size={15} color="var(--lw-text-2)" />}
                style={{ height: 44 }}
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
                              fontSize: 12,
                              fontWeight: 500,
                              transition: 'all .12s',
                            }}
                          >
                            <Icon name={s.icon} size={18} />
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

              <Input
                label="Ciudad"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Madrid"
                error={clientErrors.city}
                prefix={<Icon name="pin" size={15} color="var(--lw-text-2)" />}
                style={{ height: 44 }}
                autoComplete="address-level2"
              />

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
                <Btn type="submit" kind="primary" size="lg" iconRight="sparkle" fullWidth loading={mutation.isPending}>
                  {mutation.isPending ? 'Creando cuenta…' : 'Crear mi cuenta'}
                </Btn>
              </div>
            </form>
          </>
        )}
      </div>
    </AuthSplitLayout>
  )
}
