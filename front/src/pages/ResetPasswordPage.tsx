import { useMutation } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { resetPassword } from '../api/auth'
import { Btn, Icon, Input } from '../components/primitives/primitives'
import { AuthSplitLayout } from '../layouts/AuthSplitLayout'
import { useApiError } from '../hooks/useApiError'

export default function ResetPasswordPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = (searchParams.get('token') ?? '').trim()
  const email = (searchParams.get('email') ?? '').trim()

  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [clientError, setClientError] = useState<{ password?: string; confirm?: string }>({})
  const [okMessage, setOkMessage] = useState('')

  const mutation = useMutation({
    mutationFn: () => resetPassword(token, email, password, passwordConfirmation),
    onSuccess() {
      setOkMessage('Contraseña actualizada. Ya puedes iniciar sesión.')
    },
  })

  useEffect(() => {
    if (!okMessage) return
    const id = window.setTimeout(() => navigate('/login', { replace: true }), 2000)
    return () => window.clearTimeout(id)
  }, [okMessage, navigate])

  const { fieldErrors, generalError } = useApiError(mutation.error)
  const tokenInvalid = Boolean(fieldErrors.token)
  const bannerError = useMemo(() => {
    if (!mutation.isError) return ''
    if (tokenInvalid) return ''
    return generalError
  }, [mutation.isError, tokenInvalid, generalError])

  const linkMissing = !token || !email

  if (linkMissing) {
    return (
      <AuthSplitLayout hero="login">
        <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
          <h1 className="lw-h1" style={{ margin: '0 0 10px' }}>
            Nueva contraseña
          </h1>
          <p className="lw-body" style={{ marginBottom: 20 }}>
            Elige una contraseña nueva para tu cuenta.
          </p>
          <div
            role="alert"
            style={{
              border: '1px solid var(--lw-danger)',
              background: 'var(--lw-danger-soft)',
              color: 'var(--lw-danger)',
              padding: '10px 12px',
              borderRadius: 'var(--lw-r-sm)',
              fontSize: 13,
            }}
          >
            El enlace no es válido o está incompleto. Pide uno nuevo desde{' '}
            <Link to="/forgot-password" style={{ color: 'inherit', fontWeight: 600, textDecoration: 'underline' }}>
              aquí
            </Link>
            .
          </div>
        </div>
      </AuthSplitLayout>
    )
  }

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
          Nueva contraseña
        </h1>
        <p className="lw-body" style={{ marginBottom: 8 }}>
          Elige una contraseña nueva para tu cuenta.
        </p>
        <p className="lw-body-sm" style={{ marginBottom: 24, color: 'var(--lw-text-2)', fontSize: 13 }}>
          Para: <strong>{email}</strong>
        </p>

        {okMessage ? (
          <div
            role="status"
            style={{
              marginBottom: 16,
              border: '1px solid var(--lw-success, #2f9e62)',
              background: 'rgba(47,158,98,0.08)',
              color: 'var(--lw-success, #2f9e62)',
              padding: '10px 12px',
              borderRadius: 'var(--lw-r-sm)',
              fontSize: 13,
            }}
          >
            {okMessage}
          </div>
        ) : null}

        {tokenInvalid ? (
          <div
            role="alert"
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
            El enlace ha caducado. Pide uno nuevo desde la{' '}
            <Link to="/forgot-password" style={{ color: 'inherit', fontWeight: 600, textDecoration: 'underline' }}>
              pantalla de recuperación
            </Link>
            .
          </div>
        ) : null}

        {bannerError ? (
          <div
            role="alert"
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
            if (mutation.isPending || okMessage) return
            const next: { password?: string; confirm?: string } = {}
            if (password.length < 8) {
              next.password = 'La contraseña debe tener al menos 8 caracteres.'
            }
            if (password !== passwordConfirmation) {
              next.confirm = 'Las contraseñas no coinciden.'
            }
            setClientError(next)
            if (next.password || next.confirm) return
            mutation.mutate()
          }}
          style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
        >
          <Input
            label="Nueva contraseña"
            type="password"
            autoComplete="new-password"
            placeholder="Mínimo 8 caracteres"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={clientError.password ?? fieldErrors.password}
            prefix={<Icon name="lock" size={15} color="var(--lw-text-2)" />}
            style={{ height: 44 }}
          />
          <Input
            label="Confirmar contraseña"
            type="password"
            autoComplete="new-password"
            placeholder="Repite tu nueva contraseña"
            value={passwordConfirmation}
            onChange={(e) => setPasswordConfirmation(e.target.value)}
            error={clientError.confirm}
            prefix={<Icon name="lock" size={15} color="var(--lw-text-2)" />}
            style={{ height: 44 }}
          />
          <Btn
            type="submit"
            kind="primary"
            size="lg"
            fullWidth
            loading={mutation.isPending}
            disabled={mutation.isPending || Boolean(okMessage)}
          >
            {mutation.isPending ? 'Cambiando…' : 'Cambiar contraseña'}
          </Btn>
        </form>
      </div>
    </AuthSplitLayout>
  )
}
