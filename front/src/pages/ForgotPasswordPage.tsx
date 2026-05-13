import { useMutation } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { forgotPassword } from '../api/auth'
import { Btn, Icon, Input } from '../components/primitives/primitives'
import { AuthSplitLayout } from '../layouts/AuthSplitLayout'
import { useApiError } from '../hooks/useApiError'

const RESEND_COOLDOWN_SECONDS = 60

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [cooldown, setCooldown] = useState(0)
  const [okMessage, setOkMessage] = useState('')

  const mutation = useMutation({
    mutationFn: () => forgotPassword(email),
    onSuccess() {
      setOkMessage(
        'Si el correo existe, te hemos enviado un enlace para restablecer la contraseña. Revisa tu bandeja (y la carpeta de spam).',
      )
      setCooldown(RESEND_COOLDOWN_SECONDS)
    },
    onError(err) {
      const status = (err as { response?: { status?: number } })?.response?.status
      if (status === 429) {
        setCooldown(RESEND_COOLDOWN_SECONDS)
      }
    },
  })

  useEffect(() => {
    if (cooldown <= 0) return
    const id = window.setInterval(() => setCooldown((s) => Math.max(0, s - 1)), 1000)
    return () => window.clearInterval(id)
  }, [cooldown])

  const { fieldErrors, generalError } = useApiError(mutation.error)
  const status = (mutation.error as { response?: { status?: number } })?.response?.status
  const bannerError = useMemo(() => {
    if (!mutation.isError) return ''
    if (status === 429) return 'Demasiados intentos. Espera unos minutos.'
    return generalError
  }, [mutation.isError, status, generalError])

  const cooldownLabel = useMemo(() => (cooldown > 0 ? `Disponible en ${cooldown}s` : null), [cooldown])

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
          ¿Olvidaste tu contraseña?
        </h1>
        <p className="lw-body" style={{ marginBottom: 28 }}>
          Escribe tu correo y te enviaremos un enlace para restablecerla. ¿Ya la recuerdas?{' '}
          <Link to="/login" style={{ color: 'var(--lw-accent)', fontWeight: 500 }}>
            Volver al login
          </Link>
          .
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
            if (cooldown > 0 || mutation.isPending) return
            setOkMessage('')
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
          <Btn
            type="submit"
            kind="primary"
            size="lg"
            fullWidth
            loading={mutation.isPending}
            disabled={mutation.isPending || cooldown > 0}
          >
            {cooldownLabel ?? (mutation.isPending ? 'Enviando…' : 'Enviar enlace')}
          </Btn>
        </form>
      </div>
    </AuthSplitLayout>
  )
}
