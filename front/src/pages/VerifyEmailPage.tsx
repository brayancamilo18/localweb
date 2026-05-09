import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { logout, me, resendEmailVerification } from '../api/auth'
import { keys } from '../api/queryKeys'
import { Btn } from '../components/primitives/primitives'
import { AuthSplitLayout } from '../layouts/AuthSplitLayout'
import { useAuthStore } from '../store/authStore'

const RESEND_COOLDOWN_SECONDS = 60

export default function VerifyEmailPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const setAuth = useAuthStore((s) => s.setAuth)
  const clearAuth = useAuthStore((s) => s.clearAuth)
  const storeUser = useAuthStore((s) => s.user)
  const storeBusiness = useAuthStore((s) => s.business)
  const [cooldown, setCooldown] = useState(0)
  const [feedback, setFeedback] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)

  const { data, isLoading, isError, error } = useQuery({
    queryKey: keys.auth.me,
    queryFn: me,
    retry: false,
    refetchInterval: (query) => {
      const verifiedAt = query.state.data?.user?.email_verified_at
      if (verifiedAt) return false
      return typeof document !== 'undefined' && document.visibilityState === 'hidden' ? false : 5000
    },
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
  })

  useEffect(() => {
    if (data) {
      setAuth(data.user, data.business)
    }
  }, [data, setAuth])

  useEffect(() => {
    if (cooldown <= 0) return
    const id = window.setInterval(() => setCooldown((s) => Math.max(0, s - 1)), 1000)
    return () => window.clearInterval(id)
  }, [cooldown])

  const verifiedAt = data?.user?.email_verified_at ?? storeUser?.email_verified_at ?? null

  useEffect(() => {
    if (verifiedAt) {
      void queryClient.invalidateQueries({ queryKey: keys.auth.me })
      navigate('/onboarding', { replace: true })
    }
  }, [verifiedAt, navigate, queryClient])

  const resendMutation = useMutation({
    mutationFn: resendEmailVerification,
    onSuccess(result) {
      setCooldown(RESEND_COOLDOWN_SECONDS)
      setFeedback({
        kind: 'ok',
        text: result.alreadyVerified
          ? 'Tu correo ya está verificado. Recargando…'
          : 'Correo reenviado. Revisa tu bandeja de entrada (y la carpeta de spam).',
      })
      void queryClient.invalidateQueries({ queryKey: keys.auth.me })
    },
    onError(err) {
      const status = (err as { response?: { status?: number } })?.response?.status
      if (status === 429) {
        setFeedback({ kind: 'err', text: 'Demasiados intentos. Espera unos minutos antes de pedir otro correo.' })
        setCooldown(RESEND_COOLDOWN_SECONDS)
      } else {
        setFeedback({ kind: 'err', text: 'No hemos podido reenviar el correo. Intenta de nuevo en unos segundos.' })
      }
    },
  })

  const logoutMutation = useMutation({
    mutationFn: logout,
    onSettled() {
      clearAuth()
      queryClient.clear()
      navigate('/login', { replace: true })
    },
  })

  const email = data?.user?.email ?? storeUser?.email ?? ''
  const businessName = data?.business?.name ?? storeBusiness?.name ?? ''

  const cooldownLabel = useMemo(() => {
    if (cooldown <= 0) return null
    return `Disponible en ${cooldown}s`
  }, [cooldown])

  // Si /auth/me devuelve 401 directamente, no hay sesión y mandamos al login.
  const status401 = isError && (error as { response?: { status?: number } })?.response?.status === 401
  if (status401) {
    return <Navigate to="/login" replace />
  }

  return (
    <AuthSplitLayout hero="login">
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          maxWidth: 460,
          width: '100%',
        }}
      >
        <h1 className="lw-h1" style={{ margin: '0 0 10px' }}>
          Verifica tu correo
        </h1>
        <p className="lw-body" style={{ marginBottom: 20 }}>
          {email
            ? <>Te hemos enviado un correo a <strong>{email}</strong>. Haz clic en el enlace del correo para empezar a configurar tu página.</>
            : <>Te hemos enviado un correo de verificación. Haz clic en el enlace para continuar.</>}
        </p>
        {businessName ? (
          <p className="lw-body-sm" style={{ marginBottom: 16, color: 'var(--lw-text-2)' }}>
            Negocio: <strong>{businessName}</strong>
          </p>
        ) : null}

        <div
          style={{
            border: '1px solid var(--lw-line)',
            borderRadius: 'var(--lw-r-md)',
            padding: 14,
            background: 'var(--lw-surface-1)',
            marginBottom: 18,
            fontSize: 13,
            color: 'var(--lw-text-2)',
            lineHeight: 1.5,
          }}
        >
          El enlace caduca en 60 minutos. Si no lo encuentras, revisa la carpeta de <em>spam</em> o pídenos otro
          desde aquí. La página detectará la verificación automáticamente.
          {isLoading ? <div style={{ marginTop: 8 }}>Comprobando estado…</div> : null}
        </div>

        {feedback ? (
          <div
            role={feedback.kind === 'err' ? 'alert' : 'status'}
            style={{
              marginBottom: 16,
              border: `1px solid ${feedback.kind === 'err' ? 'var(--lw-danger)' : 'var(--lw-success, #2f9e62)'}`,
              background: feedback.kind === 'err' ? 'var(--lw-danger-soft)' : 'rgba(47,158,98,0.08)',
              color: feedback.kind === 'err' ? 'var(--lw-danger)' : 'var(--lw-success, #2f9e62)',
              padding: '10px 12px',
              borderRadius: 'var(--lw-r-sm)',
              fontSize: 13,
            }}
          >
            {feedback.text}
          </div>
        ) : null}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Btn
            kind="primary"
            size="lg"
            fullWidth
            loading={resendMutation.isPending}
            disabled={resendMutation.isPending || cooldown > 0}
            onClick={() => {
              setFeedback(null)
              resendMutation.mutate()
            }}
          >
            {cooldownLabel ?? 'Reenviar correo de verificación'}
          </Btn>
          <Btn
            kind="ghost"
            size="md"
            fullWidth
            loading={logoutMutation.isPending}
            disabled={logoutMutation.isPending}
            onClick={() => logoutMutation.mutate()}
          >
            Cerrar sesión
          </Btn>
        </div>

        <p className="lw-body-sm" style={{ marginTop: 18, color: 'var(--lw-text-3, var(--lw-text-2))', fontSize: 12 }}>
          ¿Cambiaste de email? Cierra sesión y vuelve a registrarte con el correo correcto.
        </p>
      </div>
    </AuthSplitLayout>
  )
}
