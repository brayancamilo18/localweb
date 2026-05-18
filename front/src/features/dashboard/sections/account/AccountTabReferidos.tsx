import { useQuery } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { Badge, Btn, Card, Icon, Input } from '../../../../components/primitives/primitives'
import { useToast } from '../../../../components/ui/Toast'
import { getReferrals, type ReferralRow, type ReferralStatus } from '../../../../api/referrals'
import { keys } from '../../../../api/queryKeys'
import { isAxiosError } from 'axios'

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

function statusBadge(status: ReferralStatus) {
  switch (status) {
    case 'registered':
      return (
        <Badge tone="neutral" size="sm">
          Pendiente
        </Badge>
      )
    case 'paid':
      return (
        <Badge tone="success" size="sm">
          Pagó
        </Badge>
      )
    case 'rewarded':
      return (
        <Badge tone="pro" size="sm" icon="star">
          Premiado
        </Badge>
      )
    case 'expired':
      return (
        <Badge tone="danger" size="sm">
          Expirado
        </Badge>
      )
    default:
      return <Badge tone="neutral" size="sm">{status}</Badge>
  }
}

export default function AccountTabReferidos() {
  const { showToast } = useToast()
  const [, setSearchParams] = useSearchParams()

  const referralsQ = useQuery({
    queryKey: keys.account.referrals,
    queryFn: getReferrals,
    retry: (count, err) => {
      if (isAxiosError(err) && err.response?.status === 403) {
        return false
      }
      return count < 2
    },
  })

  if (referralsQ.isLoading) {
    return (
      <Card padding={20} className="lw-account-section-card">
        <p className="lw-small" style={{ color: 'var(--lw-text-3)' }}>
          Cargando referidos…
        </p>
      </Card>
    )
  }

  if (referralsQ.isError && isAxiosError(referralsQ.error) && referralsQ.error.response?.status === 403) {
    return (
      <Card padding={24} className="lw-account-section-card">
        <div className="lw-account-empty-state">
          <span className="lw-account-empty-state-icon">
            <Icon name="users" size={20} color="var(--lw-text-3)" />
          </span>
          <h3 className="lw-h4">Disponible solo para usuarios Pro</h3>
          <p className="lw-small" style={{ maxWidth: 400 }}>
            Mejora a Pro para invitar amigos y conseguir meses gratis en tu suscripción.
          </p>
          <Btn
            kind="primary"
            iconRight="sparkle"
            type="button"
            style={{ marginTop: 8 }}
            onClick={() => {
              setSearchParams({ tab: 'plan' }, { replace: true })
            }}
          >
            Ver planes
          </Btn>
        </div>
      </Card>
    )
  }

  if (referralsQ.isError || !referralsQ.data) {
    return (
      <Card padding={20} className="lw-account-section-card">
        <p className="lw-small" style={{ color: 'var(--lw-danger)' }}>
          No se pudieron cargar tus referidos.
        </p>
        <Btn kind="outline" size="sm" type="button" onClick={() => referralsQ.refetch()} style={{ marginTop: 10 }}>
          Reintentar
        </Btn>
      </Card>
    )
  }

  const data = referralsQ.data
  const paidCount = data.counts.paid + data.counts.rewarded
  const progressPct = Math.min(100, Math.round((paidCount / data.template_gift_at) * 100))
  const templateUnlocked = paidCount >= data.template_gift_at

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(data.link)
      showToast({ type: 'success', title: 'Enlace copiado' })
    } catch {
      showToast({ type: 'error', title: 'No se pudo copiar el enlace' })
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Card padding={20} className="lw-account-section-card">
        <h2 className="lw-h3" style={{ marginBottom: 8 }}>
          Tu enlace de referido
        </h2>
        <p className="lw-small" style={{ marginBottom: 14, color: 'var(--lw-text-2)' }}>
          Compártelo con cualquiera. Por cada amigo que se suscriba a Pro consigues 1 mes gratis.
        </p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Input value={data.link} disabled style={{ flex: 1, minWidth: 200 }} />
          <Btn kind="outline" type="button" onClick={() => void copyLink()}>
            Copiar
          </Btn>
        </div>
      </Card>

      <Card padding={20} className="lw-account-section-card">
        <h2 className="lw-h3" style={{ marginBottom: 8 }}>
          Tu progreso
        </h2>
        <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 10 }}>
          {paidCount} / {data.template_gift_at}
          <span className="lw-small" style={{ fontWeight: 500, marginLeft: 8, color: 'var(--lw-text-3)' }}>
            referidos pagadores
          </span>
        </div>
        <div
          style={{
            height: 8,
            borderRadius: 999,
            background: 'var(--lw-surface)',
            overflow: 'hidden',
            marginBottom: 12,
          }}
        >
          <div
            style={{
              width: `${progressPct}%`,
              height: '100%',
              background: templateUnlocked ? 'var(--lw-pro)' : 'var(--lw-accent)',
              borderRadius: 999,
              transition: 'width .2s ease',
            }}
          />
        </div>
        <p className="lw-small" style={{ color: 'var(--lw-text-2)', marginBottom: templateUnlocked ? 10 : 0 }}>
          Al llegar a {data.template_gift_at} conseguirás una plantilla exclusiva personalizada solo para tu negocio.
        </p>
        {templateUnlocked ? (
          <Badge tone="pro" icon="star" size="sm">
            ¡Plantilla conseguida!
          </Badge>
        ) : null}
      </Card>

      <Card padding={20} className="lw-account-section-card">
        <h2 className="lw-h3" style={{ marginBottom: 12 }}>
          Tus referidos
        </h2>
        {data.referrals.length === 0 ? (
          <p className="lw-small" style={{ color: 'var(--lw-text-2)' }}>
            Aún no tienes referidos. Comparte tu enlace para empezar.
          </p>
        ) : (
          <ReferralsTable rows={data.referrals} />
        )}
      </Card>
    </div>
  )
}

function ReferralsTable({ rows }: { rows: ReferralRow[] }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="lw-account-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
        <thead>
          <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--lw-border)' }}>
            <th style={{ padding: '8px 12px 8px 0', fontWeight: 600 }}>Email</th>
            <th style={{ padding: '8px 12px', fontWeight: 600 }}>Estado</th>
            <th style={{ padding: '8px 12px', fontWeight: 600 }}>Registrado</th>
            <th style={{ padding: '8px 0 8px 12px', fontWeight: 600 }}>Primer pago</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} style={{ borderBottom: '1px solid var(--lw-border)' }}>
              <td style={{ padding: '10px 12px 10px 0' }}>{row.email_masked}</td>
              <td style={{ padding: '10px 12px' }}>{statusBadge(row.status)}</td>
              <td style={{ padding: '10px 12px', color: 'var(--lw-text-2)' }}>
                {formatLongDateEs(row.registered_at)}
              </td>
              <td style={{ padding: '10px 0 10px 12px', color: 'var(--lw-text-2)' }}>
                {formatLongDateEs(row.first_payment_at)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
