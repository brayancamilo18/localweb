import { useMutation, useQuery } from '@tanstack/react-query'
import { Btn, Card, Icon } from '../../../components/primitives/primitives'
import { getBillingStatus, postCheckout, postPortal } from '../../../api/billing'

export default function Suscripcion() {
  const statusQ = useQuery({
    queryKey: ['billing', 'status'],
    queryFn: getBillingStatus,
  })

  const checkoutM = useMutation({
    mutationFn: postCheckout,
    onSuccess: (url) => {
      window.location.href = url
    },
  })

  const portalM = useMutation({
    mutationFn: postPortal,
    onSuccess: (url) => {
      window.location.href = url
    },
  })

  const pro = statusQ.data?.is_pro

  if (statusQ.isLoading) {
    return <p className="lw-small">Cargando suscripción…</p>
  }

  if (pro) {
    const renewal = statusQ.data?.renewal_date
    const renewalLabel =
      renewal != null ? new Date(renewal * 1000).toLocaleDateString('es') : '—'
    return (
      <div style={{ maxWidth: 560 }}>
        <h1 className="lw-h2" style={{ marginBottom: 16 }}>
          Suscripción Pro
        </h1>
        <Card padding={20} style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <Icon name="sparkle" size={22} color="var(--lw-pro)" />
            <div>
              <div style={{ fontWeight: 600 }}>Plan activo</div>
              <div className="lw-small">Estado Stripe: {statusQ.data?.subscription_status ?? '—'}</div>
            </div>
          </div>
          <p className="lw-small" style={{ marginBottom: 8 }}>
            Renovación / fin de periodo: {renewalLabel}
          </p>
          {statusQ.data?.cancel_at_period_end ? (
            <p className="lw-small" style={{ color: 'var(--lw-warning)' }}>
              La suscripción se cancelará al final del periodo.
            </p>
          ) : null}
        </Card>
        <Btn kind="outline" type="button" loading={portalM.isPending} onClick={() => portalM.mutate()}>
          Abrir portal de facturación
        </Btn>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 720 }}>
      <h1 className="lw-h2" style={{ marginBottom: 8 }}>
        Plan Gratis
      </h1>
      <p className="lw-small" style={{ marginBottom: 20 }}>
        Compara y pasa a Pro cuando quieras.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14, marginBottom: 20 }}>
        <Card padding={18}>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>Gratis</div>
          <ul className="lw-small" style={{ paddingLeft: 18, lineHeight: 1.6 }}>
            <li>Página pública básica</li>
            <li>Hasta 3 fotos en galería</li>
            <li>Hasta 3 servicios</li>
            <li>Ubicación en Google Maps</li>
            <li>Estadísticas limitadas</li>
          </ul>
        </Card>
        <Card padding={18} style={{ borderColor: 'var(--lw-pro)', background: 'var(--lw-pro-soft)' }}>
          <div style={{ fontWeight: 600, marginBottom: 8, color: 'var(--lw-pro)' }}>Pro</div>
          <ul className="lw-small" style={{ paddingLeft: 18, lineHeight: 1.6 }}>
            <li>Hasta 20 fotos en galería</li>
            <li>Hasta 15 servicios</li>
            <li>Estadísticas completas (90 días)</li>
            <li>Sin publicidad LocalWeb</li>
            <li>Subdominio personalizado</li>
            <li>Soporte prioritario</li>
          </ul>
        </Card>
      </div>
      <Btn kind="primary" iconRight="sparkle" type="button" loading={checkoutM.isPending} onClick={() => checkoutM.mutate()}>
        Mejorar a Pro
      </Btn>
    </div>
  )
}
