import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Badge, Btn, Card, Icon } from '../../../../components/primitives/primitives'
import { CancelProDialog } from '../../../../components/ui/CancelProDialog'
import { useToast } from '../../../../components/ui/Toast'
import {
  getBillingStatus,
  getUpcoming,
  postCancelSubscription,
  postCheckout,
  postPortal,
  postResumeSubscription,
} from '../../../../api/billing'
import { keys } from '../../../../api/queryKeys'
import {
  ProCheckoutLegalNotice,
  ProCheckoutTermsCheckbox,
} from '../../../../components/legal/RegisterLegalNotices'
import ReferralInviteBanner from '../../../../components/referrals/ReferralInviteBanner'
import { navigateExternal } from '../../../../utils/navigate'

/**
 * `Suscripcion.tsx` (legacy) usa un formato corto «12 nov». Aquí preferimos el
 * formato largo «12 de noviembre de 2026» porque la sección «Mi cuenta» dispone
 * de más espacio horizontal y el dato es el ancla de los avisos de cancelación.
 * Mantenemos esta función local para no acoplarnos al helper del dashboard.
 */
function formatLongDateEs(unixSeconds: number | null | undefined): string {
  if (unixSeconds == null || !Number.isFinite(unixSeconds) || unixSeconds <= 0) return '—'
  try {
    return new Intl.DateTimeFormat('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date(unixSeconds * 1000))
  } catch {
    return '—'
  }
}

function formatMoney(amountCents: number, currency: string): string {
  try {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amountCents / 100)
  } catch {
    return `${(amountCents / 100).toFixed(2)} ${currency.toUpperCase()}`
  }
}

const PRO_FEATURES = [
  'Hasta 20 fotos en galería',
  'Hasta 15 servicios',
  'Estadísticas completas (90 días)',
  'Sin publicidad ONEZ',
  'Subdominio personalizado',
  'Soporte prioritario',
]

const FREE_FEATURES = [
  'Página pública básica',
  'Hasta 3 fotos en galería',
  'Hasta 3 servicios',
  'Ubicación en Google Maps',
  'Estadísticas limitadas',
]

export default function AccountTabPlan() {
  const { showToast } = useToast()
  const qc = useQueryClient()
  const [confirmCancelOpen, setConfirmCancelOpen] = useState(false)
  const [acceptProCheckout, setAcceptProCheckout] = useState(false)
  const [proCheckoutError, setProCheckoutError] = useState<string | undefined>()

  const statusQ = useQuery({
    queryKey: keys.account.billingStatus,
    queryFn: getBillingStatus,
  })

  const upcomingQ = useQuery({
    queryKey: keys.account.upcoming,
    queryFn: getUpcoming,
    enabled: !!statusQ.data?.is_pro,
  })

  const checkoutM = useMutation({
    mutationFn: postCheckout,
    onSuccess: (url) => {
      navigateExternal(url)
    },
    onError: () => {
      showToast({
        type: 'error',
        title: 'No se pudo abrir el checkout',
        description: 'Inténtalo de nuevo en unos segundos.',
        action: { label: 'Reintentar', onClick: () => checkoutM.mutate() },
      })
    },
  })

  const portalM = useMutation({
    mutationFn: postPortal,
    onSuccess: (url) => {
      navigateExternal(url)
    },
    onError: () => {
      showToast({
        type: 'error',
        title: 'No se pudo abrir el portal de facturación',
        description: 'Inténtalo de nuevo en unos segundos.',
      })
    },
  })

  const cancelM = useMutation({
    mutationFn: postCancelSubscription,
    onSuccess: async () => {
      setConfirmCancelOpen(false)
      await qc.invalidateQueries({ queryKey: keys.account.billingStatus })
      // El sidebar legacy (`dashboard.tsx`) lee el estado con la clave
      // `['billing', 'status']`, distinta de la nuestra. Invalidamos las dos
      // para que el cambio se refleje sin recargar.
      await qc.invalidateQueries({ queryKey: ['billing', 'status'] })
      showToast({
        type: 'success',
        title: 'Suscripción cancelada',
        description: 'Mantienes el acceso hasta el final del periodo actual.',
      })
    },
    onError: () => {
      showToast({
        type: 'error',
        title: 'No se pudo cancelar',
        description: 'Inténtalo de nuevo en unos segundos.',
      })
    },
  })

  const resumeM = useMutation({
    mutationFn: postResumeSubscription,
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: keys.account.billingStatus })
      await qc.invalidateQueries({ queryKey: ['billing', 'status'] })
      showToast({
        type: 'success',
        title: 'Suscripción reanudada',
        description: 'Seguirás siendo Pro tras el final del periodo.',
      })
    },
    onError: () => {
      showToast({
        type: 'error',
        title: 'No se pudo reanudar',
        description: 'Inténtalo de nuevo en unos segundos.',
      })
    },
  })

  if (statusQ.isLoading) {
    return (
      <Card padding={20}>
        <p className="lw-small">Cargando información del plan…</p>
      </Card>
    )
  }

  if (statusQ.isError || !statusQ.data) {
    return (
      <Card padding={20}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Icon name="alert" size={16} color="var(--lw-danger)" />
          <p className="lw-small" style={{ color: 'var(--lw-danger)' }}>
            No se pudo cargar tu plan.
          </p>
        </div>
        <Btn
          kind="outline"
          size="sm"
          icon="refresh"
          type="button"
          onClick={() => statusQ.refetch()}
          style={{ marginTop: 10 }}
        >
          Reintentar
        </Btn>
      </Card>
    )
  }

  const s = statusQ.data
  const upcoming = upcomingQ.data
  const status = s.subscription_status ?? null
  const cancelAtPeriodEnd = !!s.cancel_at_period_end
  const isPastDue = status === 'past_due' || status === 'unpaid'

  // ─── Plan Free ─────────────────────────────────────────────────
  if (!s.is_pro) {
    return (
      <>
        <Card padding={20} className="lw-account-section-card">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              flexWrap: 'wrap',
            }}
          >
            <div>
              <h2 className="lw-h3" style={{ marginBottom: 4 }}>
                Tu plan actual
              </h2>
              <p className="lw-small">Estás en el plan Gratis. Mejora a Pro cuando quieras.</p>
            </div>
            <Badge tone="neutral">Plan Gratis</Badge>
          </div>
        </Card>

        <div className="lw-account-plan-grid">
          <Card padding={18}>
            <div style={{ fontWeight: 600, marginBottom: 10, fontSize: 15 }}>Gratis</div>
            <div
              style={{
                fontSize: 24,
                fontWeight: 600,
                marginBottom: 14,
                letterSpacing: '-0.01em',
              }}
            >
              0 €
              <span className="lw-small" style={{ fontWeight: 500, marginLeft: 4 }}>
                /mes
              </span>
            </div>
            <ul className="lw-account-plan-features">
              {FREE_FEATURES.map((f) => (
                <li key={f}>
                  <Icon name="check" size={14} color="var(--lw-text-3)" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </Card>

          <Card
            padding={18}
            style={{ borderColor: 'var(--lw-pro)', background: 'var(--lw-pro-soft)' }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 10,
              }}
            >
              <span style={{ fontWeight: 600, fontSize: 15, color: 'var(--lw-pro)' }}>Pro</span>
              <Badge tone="pro" icon="sparkle">
                Recomendado
              </Badge>
            </div>
            <div
              style={{
                fontSize: 24,
                fontWeight: 600,
                marginBottom: 14,
                letterSpacing: '-0.01em',
                color: 'var(--lw-pro)',
              }}
            >
              9,99 €
              <span
                className="lw-small"
                style={{ fontWeight: 500, marginLeft: 4, color: 'var(--lw-pro)' }}
              >
                /mes
              </span>
            </div>
            <ul className="lw-account-plan-features">
              {PRO_FEATURES.map((f) => (
                <li key={f}>
                  <Icon name="check" size={14} color="var(--lw-pro)" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <ReferralInviteBanner />
            <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <ProCheckoutLegalNotice />
              <ProCheckoutTermsCheckbox
                checked={acceptProCheckout}
                onChange={(v) => {
                  setAcceptProCheckout(v)
                  if (v) setProCheckoutError(undefined)
                }}
                error={proCheckoutError}
              />
              <Btn
                kind="primary"
                fullWidth
                iconRight="sparkle"
                type="button"
                loading={checkoutM.isPending}
                onClick={() => {
                  if (!acceptProCheckout) {
                    setProCheckoutError('Debes aceptar las condiciones del plan Pro para continuar.')
                    return
                  }
                  checkoutM.mutate()
                }}
              >
                Pagar — Mejorar a Pro
              </Btn>
            </div>
          </Card>
        </div>
      </>
    )
  }

  // ─── Plan Pro ──────────────────────────────────────────────────
  return (
    <>
      {/* Estado actual */}
      <Card padding={20} className="lw-account-section-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 'var(--lw-r-sm)',
              background: 'var(--lw-pro-soft)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Icon name="sparkle" size={22} color="var(--lw-pro)" />
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 16, fontWeight: 600 }}>Plan Pro</span>
              {isPastDue ? (
                <Badge tone="danger">Pago fallido</Badge>
              ) : cancelAtPeriodEnd ? (
                <Badge tone="warning">Cancelación programada</Badge>
              ) : (
                <Badge tone="success" dot>
                  Activo
                </Badge>
              )}
            </div>
            <div className="lw-small" style={{ marginTop: 4 }}>
              {cancelAtPeriodEnd
                ? `Tu plan terminará el ${formatLongDateEs(s.renewal_date)}`
                : `Próxima renovación: ${formatLongDateEs(s.renewal_date)}`}
            </div>
          </div>
        </div>

        {isPastDue && (
          <div
            style={{
              padding: 12,
              borderRadius: 'var(--lw-r-sm)',
              background: 'var(--lw-danger-soft)',
              border: '1px solid var(--lw-danger)',
              display: 'flex',
              gap: 10,
              alignItems: 'flex-start',
            }}
          >
            <Icon name="alert" size={16} color="var(--lw-danger)" style={{ marginTop: 2 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--lw-danger)' }}>
                Hay un problema con tu pago
              </div>
              <p className="lw-small" style={{ marginTop: 4 }}>
                Actualiza tu método de pago para mantener el acceso a Pro.
              </p>
            </div>
          </div>
        )}

        {!isPastDue && upcoming && !cancelAtPeriodEnd && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 12,
              padding: 12,
              borderRadius: 'var(--lw-r-sm)',
              background: 'var(--lw-surface)',
              flexWrap: 'wrap',
            }}
          >
            <div className="lw-small">Próximo cobro</div>
            <div
              style={{
                fontWeight: 600,
                fontSize: 14,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {formatMoney(upcoming.total, upcoming.currency)}
            </div>
          </div>
        )}

        <div className="lw-account-actions-row">
          {isPastDue ? (
            <Btn
              kind="primary"
              type="button"
              icon="creditCard"
              loading={portalM.isPending}
              onClick={() => portalM.mutate()}
            >
              Actualizar método de pago
            </Btn>
          ) : cancelAtPeriodEnd ? (
            <Btn
              kind="primary"
              type="button"
              icon="refresh"
              loading={resumeM.isPending}
              onClick={() => resumeM.mutate()}
            >
              Reanudar suscripción
            </Btn>
          ) : (
            <Btn
              kind="danger"
              type="button"
              loading={cancelM.isPending}
              onClick={() => setConfirmCancelOpen(true)}
            >
              Cancelar suscripción
            </Btn>
          )}
          <Btn
            kind="outline"
            type="button"
            icon="settings"
            loading={portalM.isPending}
            onClick={() => portalM.mutate()}
          >
            Portal de facturación
          </Btn>
        </div>
      </Card>

      <CancelProDialog
        open={confirmCancelOpen}
        onKeepPro={() => {
          if (!cancelM.isPending) setConfirmCancelOpen(false)
        }}
        onConfirmCancel={() => cancelM.mutate()}
        loading={cancelM.isPending}
        renewalDateLabel={formatLongDateEs(s.renewal_date)}
      />
    </>
  )
}
