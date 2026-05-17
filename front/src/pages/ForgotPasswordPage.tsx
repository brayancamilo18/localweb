import { useMutation } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { forgotPassword } from '../api/auth'
import { Btn, Icon, Input } from '../components/primitives/primitives'
import { ForgotPasswordLayout } from '../layouts/ForgotPasswordLayout'
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
    document.title = 'Recupera tu contraseña · ONEZ'
    const meta = document.querySelector('meta[name="description"]')
    if (meta) {
      meta.setAttribute(
        'content',
        '¿Olvidaste tu contraseña? Te enviamos un enlace para restablecerla en segundos.',
      )
    }
  }, [])

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
    <ForgotPasswordLayout>
      <Link to="/login" className="lw-forgot-page__back">
        <Icon name="chevronLeft" size={14} color="currentColor" />
        Volver al login
      </Link>

      <div className="lw-forgot-page__intro">
        <h2 className="lw-forgot-page__title">¿Olvidaste tu contraseña?</h2>
        <p className="lw-forgot-page__lead">
          Escribe tu correo y te enviaremos un enlace para restablecerla.
        </p>
      </div>

      {okMessage ? (
        <div className="lw-forgot-page__success" role="status">
          <div className="lw-forgot-page__success-icon" aria-hidden>
            <Icon name="check" size={20} color="var(--lw-accent)" />
          </div>
          <h3 className="lw-forgot-page__success-title">Revisa tu correo</h3>
          <p className="lw-forgot-page__success-text">{okMessage}</p>
          <button
            type="button"
            className="lw-forgot-page__success-retry"
            onClick={() => setOkMessage('')}
          >
            Probar con otro correo
          </button>
        </div>
      ) : (
        <>
          {bannerError ? (
            <div className="lw-forgot-page__alert lw-forgot-page__alert--error" role="alert">
              {bannerError}
            </div>
          ) : null}

          <form
            className="lw-forgot-page__form lw-auth-form"
            onSubmit={(e) => {
              e.preventDefault()
              if (cooldown > 0 || mutation.isPending) return
              setOkMessage('')
              mutation.mutate()
            }}
          >
            <Input
              label="Email"
              type="email"
              autoComplete="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={fieldErrors.email}
              prefix={<Icon name="mail" size={16} color="var(--lw-text-3)" />}
              style={{ height: 48 }}
            />
            <Btn
              type="submit"
              kind="primary"
              size="lg"
              fullWidth
              iconRight="arrowRight"
              loading={mutation.isPending}
              disabled={mutation.isPending || cooldown > 0}
              style={{ height: 48, marginTop: 4 }}
            >
              {cooldownLabel ?? (mutation.isPending ? 'Enviando…' : 'Enviar enlace')}
            </Btn>

            <p className="lw-forgot-page__footnote">
              ¿No tienes cuenta?{' '}
              <Link to="/register" className="lw-forgot-page__inline-link">
                Crea una gratis
              </Link>
            </p>
          </form>
        </>
      )}
    </ForgotPasswordLayout>
  )
}
