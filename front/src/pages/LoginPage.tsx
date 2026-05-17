import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { login } from '../api/auth'
import { keys } from '../api/queryKeys'
import { PasswordVisibilityToggle } from '../components/auth/PasswordVisibilityToggle'
import { SocialAuthButtons } from '../components/auth/SocialAuthButtons'
import { Btn, Icon, Input } from '../components/primitives/primitives'
import { LoginLayout } from '../layouts/LoginLayout'
import { useAuthStore } from '../store/authStore'
import { useApiError } from '../hooks/useApiError'
import { usePasswordReveal } from '../hooks/usePasswordReveal'

function nextRouteFromBusiness(plan?: string | null) {
  if (!plan || plan === 'pending') return '/onboarding'
  return '/dashboard'
}

/** Ruta interna tras login (evita open redirect). */
function safeNextPath(raw: string | null): string | null {
  if (!raw || !raw.startsWith('/') || raw.startsWith('//')) return null
  return raw
}

export default function LoginPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [searchParams] = useSearchParams()
  const returnTo = safeNextPath(searchParams.get('next'))
  const setAuth = useAuthStore((state) => state.setAuth)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const passwordReveal = usePasswordReveal()

  useEffect(() => {
    document.title = 'Inicia sesión · ONEZ'
    const meta = document.querySelector('meta[name="description"]')
    if (meta) {
      meta.setAttribute(
        'content',
        'Accede a ONEZ para gestionar tu web, estadísticas y soporte en español.',
      )
    }
  }, [])

  const mutation = useMutation({
    mutationFn: () => login(email, password),
    async onSuccess(data) {
      setAuth(data.user, data.business)
      queryClient.setQueryData(keys.auth.me, { user: data.user, business: data.business })
      if (returnTo) {
        navigate(returnTo)
        return
      }
      if (data.user?.is_admin) {
        navigate('/admin')
        return
      }
      if (data.user && data.user.email_verified_at == null) {
        navigate('/verify-email')
        return
      }
      navigate(nextRouteFromBusiness(data.business?.plan))
    },
  })

  const { fieldErrors, generalError } = useApiError(mutation.error)
  const bannerError = useMemo(
    () => (mutation.isError && (mutation.error as { response?: { status?: number } })?.response?.status === 401 ? generalError : ''),
    [mutation.error, mutation.isError, generalError],
  )

  return (
    <LoginLayout>
      <SocialAuthButtons />

      {bannerError ? (
        <div
          role="alert"
          style={{
            marginBottom: 12,
            border: '1px solid var(--lw-danger)',
            background: 'var(--lw-danger-soft)',
            color: 'var(--lw-danger)',
            padding: '10px 12px',
            borderRadius: 'var(--lw-r-sm)',
            fontSize: 14,
          }}
        >
          {bannerError}
        </div>
      ) : null}

      <form
        className="lw-auth-form"
        onSubmit={(e) => {
          e.preventDefault()
          mutation.mutate()
        }}
        style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
      >
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="tu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={fieldErrors.email}
          prefix={<Icon name="mail" size={15} color="var(--lw-text-2)" />}
          style={{ height: 48 }}
        />
        <Input
          ref={passwordReveal.inputRef}
          id="login-password"
          label="Contraseña"
          labelAside={
            <Link to="/forgot-password" className="lw-link-underline-hover">
              ¿Olvidaste?
            </Link>
          }
          type={passwordReveal.inputType}
          inputClassName={passwordReveal.inputClassName}
          autoComplete="current-password"
          placeholder="Tu contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={fieldErrors.password}
          prefix={<Icon name="lock" size={15} color="var(--lw-text-2)" />}
          style={{ height: 48 }}
          suffix={
            <PasswordVisibilityToggle
              visible={passwordReveal.visible}
              onToggle={passwordReveal.toggle}
              onCaptureSelection={passwordReveal.captureSelection}
            />
          }
        />
        <Btn type="submit" kind="primary" size="lg" fullWidth loading={mutation.isPending} style={{ height: 48, marginTop: 4 }}>
          {mutation.isPending ? 'Entrando…' : 'Iniciar sesión'}
        </Btn>
      </form>

      <p className="lw-login-page__form-footnote">
        ¿No tienes cuenta? <Link to="/register">Crear una</Link>
      </p>
    </LoginLayout>
  )
}
