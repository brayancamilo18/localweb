import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { login } from '../api/auth'
import { keys } from '../api/queryKeys'
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
  const queryClient = useQueryClient()
  const [searchParams] = useSearchParams()
  const returnTo = safeNextPath(searchParams.get('next'))
  const setAuth = useAuthStore((state) => state.setAuth)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const mutation = useMutation({
    mutationFn: () => login(email, password),
    async onSuccess(data) {
      setAuth(data.user, data.business)
      // /auth/me ya no necesita refetch — la respuesta de login trae el mismo payload
      // que /auth/me. Solo marcamos la query como fresh para que el useAuth global no
      // se quede en estado loading inicial.
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
    <AuthSplitLayout hero="login">
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
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
            <Link to="/forgot-password" className="lw-link-underline-hover" style={{ color: 'var(--lw-accent)' }}>
              ¿Olvidaste tu contraseña?
            </Link>
          </div>
        </form>
      </div>
    </AuthSplitLayout>
  )
}
