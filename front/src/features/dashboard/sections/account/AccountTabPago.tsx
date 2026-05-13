import { useMutation, useQuery } from '@tanstack/react-query'
import { Badge, Btn, Card, Icon } from '../../../../components/primitives/primitives'
import { useToast } from '../../../../components/ui/Toast'
import {
  getBillingStatus,
  getPaymentMethod,
  getUpcoming,
  postCheckout,
  postPortal,
  type BillingPaymentMethod,
} from '../../../../api/billing'
import { keys } from '../../../../api/queryKeys'
import { navigateExternal } from '../../../../utils/navigate'

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

function formatMoney(cents: number, currency: string): string {
  try {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(cents / 100)
  } catch {
    return `${(cents / 100).toFixed(2)} ${currency.toUpperCase()}`
  }
}

function brandLabel(brand: string): string {
  const map: Record<string, string> = {
    visa: 'Visa',
    mastercard: 'Mastercard',
    amex: 'American Express',
    discover: 'Discover',
    diners: 'Diners Club',
    jcb: 'JCB',
    unionpay: 'UnionPay',
  }
  return map[brand?.toLowerCase()] ?? (brand ? brand[0].toUpperCase() + brand.slice(1) : 'Tarjeta')
}

function formatExpiry(month: number, year: number): string {
  const mm = String(month).padStart(2, '0')
  const yy = String(year).slice(-2)
  return `${mm}/${yy}`
}

/** Stripe usa `exp_month` 1–12. Último instante válido: fin del último día de ese mes. */
function lastValidMs(monthStripe: number, year: number): number {
  const lastDay = new Date(year, monthStripe, 0)
  lastDay.setHours(23, 59, 59, 999)
  return lastDay.getTime()
}

function isExpired(monthStripe: number, year: number): boolean {
  return Date.now() > lastValidMs(monthStripe, year)
}

/** True si aún no caducó y quedan menos de 60 días hasta fin del mes de caducidad. */
function isExpiringSoon(monthStripe: number, year: number): boolean {
  if (isExpired(monthStripe, year)) return false
  const end = lastValidMs(monthStripe, year)
  const diffMs = end - Date.now()
  return diffMs > 0 && diffMs < 60 * 24 * 60 * 60 * 1000
}

export default function AccountTabPago() {
  const { showToast } = useToast()

  const statusQ = useQuery({
    queryKey: keys.account.billingStatus,
    queryFn: getBillingStatus,
  })

  const isPro = !!statusQ.data?.is_pro

  const pmQ = useQuery({
    queryKey: keys.account.paymentMethod,
    queryFn: getPaymentMethod,
    enabled: isPro,
  })

  const upcomingQ = useQuery({
    queryKey: keys.account.upcoming,
    queryFn: getUpcoming,
    enabled: isPro,
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

  if (statusQ.isLoading || (isPro && pmQ.isLoading)) {
    return (
      <Card padding={20}>
        <p className="lw-small">Cargando datos de pago…</p>
      </Card>
    )
  }

  if (statusQ.isError) {
    return (
      <Card padding={20}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Icon name="alert" size={16} color="var(--lw-danger)" />
          <p className="lw-small" style={{ color: 'var(--lw-danger)' }}>
            No se pudieron cargar tus datos de pago.
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

  if (!isPro) {
    return (
      <Card padding={20}>
        <div className="lw-account-empty-state">
          <span className="lw-account-empty-state-icon">
            <Icon name="creditCard" size={20} color="var(--lw-text-3)" />
          </span>
          <h3 className="lw-h4">Aún no tienes método de pago</h3>
          <p className="lw-small" style={{ maxWidth: 380 }}>
            Cuando mejores a Pro, podrás añadir una tarjeta y gestionar tu facturación desde aquí.
          </p>
          <Btn
            kind="primary"
            iconRight="sparkle"
            type="button"
            loading={checkoutM.isPending}
            onClick={() => checkoutM.mutate()}
            style={{ marginTop: 8 }}
          >
            Mejorar a Pro
          </Btn>
        </div>
      </Card>
    )
  }

  const pm = pmQ.data ?? null
  const upcoming = upcomingQ.data ?? null

  if (!pm) {
    return (
      <Card padding={20}>
        <div className="lw-account-empty-state">
          <span className="lw-account-empty-state-icon">
            <Icon name="alert" size={20} color="var(--lw-warning)" />
          </span>
          <h3 className="lw-h4">Sin método de pago</h3>
          <p className="lw-small" style={{ maxWidth: 380 }}>
            No tenemos un método de pago guardado. Añade una tarjeta desde el portal de facturación
            para que podamos cobrar tu renovación.
          </p>
          <Btn
            kind="primary"
            icon="creditCard"
            type="button"
            loading={portalM.isPending}
            onClick={() => portalM.mutate()}
            style={{ marginTop: 8 }}
          >
            Añadir tarjeta
          </Btn>
        </div>
      </Card>
    )
  }

  return (
    <>
      <Card padding={20} className="lw-account-section-card">
        <div>
          <h2 className="lw-h3" style={{ marginBottom: 4 }}>
            Método de pago
          </h2>
          <p className="lw-small">
            Tu tarjeta se gestiona de forma segura desde Stripe. Cambia o actualiza desde el portal de
            facturación.
          </p>
        </div>

        <CardRow pm={pm} />

        <div className="lw-account-actions-row">
          <Btn
            kind="primary"
            type="button"
            icon="creditCard"
            loading={portalM.isPending}
            onClick={() => portalM.mutate()}
          >
            Cambiar método de pago
          </Btn>
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

      <Card padding={20} className="lw-account-section-card">
        <div>
          <h2 className="lw-h3" style={{ marginBottom: 4 }}>
            Próximo cobro
          </h2>
          <p className="lw-small">
            La renovación se cobra automáticamente con la tarjeta guardada.
          </p>
        </div>

        {upcoming ? (
          <div className="lw-account-upcoming-row">
            <div>
              <div className="lw-small" style={{ marginBottom: 2 }}>
                Fecha
              </div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>
                {formatLongDateEs(upcoming.date)}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className="lw-small" style={{ marginBottom: 2 }}>
                Importe
              </div>
              <div style={{ fontSize: 18, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                {formatMoney(upcoming.total, upcoming.currency)}
              </div>
            </div>
          </div>
        ) : (
          <p className="lw-small">No hay próximo cobro programado.</p>
        )}
      </Card>

      <Card padding={20} className="lw-account-section-card">
        <div>
          <h2 className="lw-h3" style={{ marginBottom: 4 }}>
            Dirección de facturación
          </h2>
          <p className="lw-small">
            Para añadir o editar tu dirección de facturación, NIF/CIF o información fiscal, accede al
            portal de Stripe.
          </p>
        </div>
        <div className="lw-account-actions-row">
          <Btn
            kind="outline"
            type="button"
            icon="settings"
            loading={portalM.isPending}
            onClick={() => portalM.mutate()}
          >
            Gestionar datos fiscales
          </Btn>
        </div>
      </Card>
    </>
  )
}

function CardRow({ pm }: { pm: BillingPaymentMethod }) {
  const expired = isExpired(pm.exp_month, pm.exp_year)
  const expiringSoon = !expired && isExpiringSoon(pm.exp_month, pm.exp_year)

  return (
    <div className="lw-account-payment-card-row">
      <div className="lw-account-payment-card-brand">
        <Icon name="creditCard" size={22} color="var(--lw-text)" />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 14, fontWeight: 600 }}>
            {brandLabel(pm.brand)} ····{pm.last4}
          </span>
          {expired ? (
            <Badge tone="danger">Caducada</Badge>
          ) : expiringSoon ? (
            <Badge tone="warning">Caduca pronto</Badge>
          ) : null}
        </div>
        <div className="lw-small lw-mono" style={{ marginTop: 2 }}>
          Caduca {formatExpiry(pm.exp_month, pm.exp_year)}
        </div>
      </div>
    </div>
  )
}
