import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { logout, me, resendEmailVerification } from '../api/auth'
import { isInPostAuthGracePublic } from '../api/client'
import { keys } from '../api/queryKeys'
import { Btn, Icon } from '../components/primitives/primitives'
import { LoginLayout } from '../layouts/LoginLayout'
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
    // Reutilizamos la data fresca del registro/login para evitar refetch inmediato
    // que podría dar 401 espurio mientras la cookie de sesión termina de propagarse.
    staleTime: 30_000,
    refetchInterval: (query) => {
      const verifiedAt = query.state.data?.user?.email_verified_at
      if (verifiedAt) return false
      return typeof document !== 'undefined' && document.visibilityState === 'hidden' ? false : 5000
    },
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
  })

  useEffect(() => {
    document.title = 'Verifica tu correo · ONEZ'
    const meta = document.querySelector('meta[name="description"]')
    if (meta) {
      meta.setAttribute(
        'content',
        'Confirma tu dirección de email para empezar a configurar tu página profesional con ONEZ.',
      )
    }
  }, [])

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

  const resendJustSent = feedback?.kind === 'ok' && !resendMutation.isPending

  const status401 = isError && (error as { response?: { status?: number } })?.response?.status === 401
  // Solo redirigimos a /login si:
  //   1) Recibimos un 401 fiable (no estamos en ventana de gracia post-auth).
  //   2) No tenemos user en store local (que indicaría que sí estamos logueados).
  // Esto evita el bug de móvil donde un refetch al montar da 401 espurio justo
  // después del registro mientras la cookie de sesión se propaga.
  if (status401 && !isInPostAuthGracePublic() && !storeUser) {
    return <Navigate to="/login" replace />
  }

  const emailIntro = email ? (
    <>
      Te hemos enviado un correo a <strong>{email}</strong>. Haz clic en el enlace del correo para empezar a
      configurar tu página.
    </>
  ) : (
    <>Te hemos enviado un correo de verificación. Haz clic en el enlace para continuar.</>
  )

  return (
    <LoginLayout
      variant="verify-email"
      cardTitle=""
      cardSubtitle=""
      heroBadge="+12.000 negocios confían en ONEZ"
      heroTitle="Tu web profesional en menos de 10 minutos."
      heroSub="Sin saber programar. Sin diseñador. Solo responde unas preguntas y ONEZ hace el resto."
      heroTitleNowrap={false}
      features={[]}
    >
      <div className="lw-verify-email__icon" aria-hidden>
        <Icon name="mail" size={20} color="var(--lw-accent)" />
      </div>

      <h1 className="lw-verify-email__title">Verifica tu correo</h1>
      <p className="lw-verify-email__intro">{emailIntro}</p>

      {businessName ? (
        <p className="lw-verify-email__business">
          Negocio: <strong>{businessName}</strong>
        </p>
      ) : null}

      <p className="lw-verify-email__notice">
        El enlace caduca en 60 minutos. Si no lo encuentras, revisa la carpeta de <em>spam</em> o pídenos otro desde
        aquí. La página detectará la verificación automáticamente.
        {isLoading ? <span className="lw-verify-email__checking"> Comprobando estado…</span> : null}
      </p>

      {feedback ? (
        <div
          role={feedback.kind === 'err' ? 'alert' : 'status'}
          className={`lw-verify-email__feedback lw-verify-email__feedback--${feedback.kind}`}
        >
          {feedback.text}
        </div>
      ) : null}

      <div className="lw-verify-email__actions">
        <Btn
          kind="primary"
          size="lg"
          fullWidth
          loading={resendMutation.isPending}
          disabled={resendMutation.isPending || cooldown > 0}
          iconRight={resendJustSent ? 'check' : undefined}
          onClick={() => {
            setFeedback(null)
            resendMutation.mutate()
          }}
        >
          {resendJustSent ? 'Correo reenviado' : cooldownLabel ?? 'Reenviar correo de verificación'}
        </Btn>
        <Btn
          kind="ghost"
          size="lg"
          fullWidth
          loading={logoutMutation.isPending}
          disabled={logoutMutation.isPending}
          onClick={() => logoutMutation.mutate()}
        >
          Cerrar sesión
        </Btn>
      </div>

      <p className="lw-verify-email__footnote">
        ¿Cambiaste de email? Cierra sesión y vuelve a registrarte con el correo correcto.
      </p>
    </LoginLayout>
  )
}
