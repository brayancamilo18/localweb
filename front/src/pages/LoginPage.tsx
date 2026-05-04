import { useMutation } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { login } from '../api/auth'
import { Btn, Icon, Input } from '../components/primitives/primitives'
import { AuthSplitLayout } from '../layouts/AuthSplitLayout'
import { useAuthStore } from '../store/authStore'
import { useApiError } from '../hooks/useApiError'

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
  const [searchParams] = useSearchParams()
  const returnTo = safeNextPath(searchParams.get('next'))
  const setAuth = useAuthStore((state) => state.setAuth)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const mutation = useMutation({
    mutationFn: () => login(email, password),
    onSuccess(data) {
      setAuth(data.token, data.user, data.business)
      if (returnTo) {
        navigate(returnTo)
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
    <AuthSplitLayout hero="login">
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          maxWidth: 400,
          width: '100%',
        }}
      >
        <h1 className="lw-h1" style={{ margin: '0 0 10px' }}>
          Hola de nuevo.
        </h1>
        <p className="lw-body" style={{ marginBottom: 28 }}>
          Inicia sesión para gestionar tu web. ¿No tienes cuenta?{' '}
          <Link to="/register" style={{ color: 'var(--lw-accent)', fontWeight: 500 }}>
            Crear una
          </Link>
          .
        </p>
        {bannerError ? (
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
            {bannerError}
          </div>
        ) : null}
        <form
          onSubmit={(e) => {
            e.preventDefault()
            mutation.mutate()
          }}
          style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
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
            style={{ height: 44 }}
          />
          <Input
            label="Contraseña"
            type="password"
            autoComplete="current-password"
            placeholder="Tu contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={fieldErrors.password}
            prefix={<Icon name="lock" size={15} color="var(--lw-text-2)" />}
            style={{ height: 44 }}
          />
          <Btn type="submit" kind="primary" size="lg" fullWidth loading={mutation.isPending}>
            {mutation.isPending ? 'Entrando…' : 'Iniciar sesión'}
          </Btn>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, flexWrap: 'wrap', gap: 8 }}>
            <a
              href="#"
              className="lw-link-underline-hover"
              onClick={(e) => e.preventDefault()}
            >
              ¿Olvidaste tu contraseña?
            </a>
          </div>
        </form>
      </div>
    </AuthSplitLayout>
  )
}
