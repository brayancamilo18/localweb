import axios from 'axios'
import { useQuery } from '@tanstack/react-query'
import { Btn, Card, Icon } from '../../../components/primitives/primitives'
import { getStats } from '../../../api/dashboard'
import { keys } from '../../../api/queryKeys'
import { useDashboard } from '../context/DashboardContext'
import { MiniLine } from '../dashboard'

function StatsProUpsell() {
  return (
    <Card
      padding={24}
      style={{
        maxWidth: 720,
        display: 'flex',
        alignItems: 'center',
        gap: 18,
        background: 'linear-gradient(180deg, var(--lw-bg-elev), var(--lw-surface))',
      }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: 'var(--lw-r)',
          background: 'var(--lw-pro-soft)',
          color: 'var(--lw-pro)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon name="lock" size={20} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 15, fontWeight: 600 }}>Estadísticas detalladas en Pro</div>
        <p className="lw-small" style={{ fontSize: 13, marginTop: 2 }}>
          Mira cuántas personas visitan tu web, de dónde llegan y qué les interesa más.
        </p>
      </div>
      <Btn kind="primary" iconRight="sparkle" type="button" onClick={() => (window.location.href = '/dashboard/billing')}>
        Mejorar a Pro
      </Btn>
    </Card>
  )
}

export default function Estadisticas() {
  const { business } = useDashboard()

  if (!business.is_pro) {
    return <StatsProUpsell />
  }

  const q = useQuery({
    queryKey: keys.dashboard.stats,
    queryFn: getStats,
    retry: false,
  })

  const locked =
    q.isError &&
    axios.isAxiosError(q.error) &&
    q.error.response?.status === 403 &&
    Boolean((q.error.response?.data as { upgrade_required?: boolean })?.upgrade_required)

  if (locked) {
    return <StatsProUpsell />
  }

  const daily = q.data?.daily_visits ?? []
  const chartData = daily.length ? daily.map((d) => d.count) : [0, 0, 0, 0, 0, 0, 0]
  const total = q.data?.total ?? 0

  return (
    <div style={{ maxWidth: 720 }}>
      <h1 className="lw-h2" style={{ marginBottom: 8 }}>
        Estadísticas
      </h1>
      <p className="lw-small" style={{ marginBottom: 18 }}>
        Visitas diarias (periodo permitido por tu plan: {q.data?.days_limit ?? '—'} días).
      </p>
      <Card padding={20}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
          <div>
            <div className="lw-small">Visitas totales registradas</div>
            <div
              style={{
                fontSize: 22,
                fontWeight: 600,
                fontVariantNumeric: 'tabular-nums',
                letterSpacing: '-0.02em',
              }}
            >
              {total}
            </div>
          </div>
        </div>
        <MiniLine h={120} data={chartData} />
      </Card>
      <p className="lw-small" style={{ marginTop: 16, color: 'var(--lw-text-3)' }}>
        Clics WhatsApp: {q.data?.whatsapp_clicks ?? 0} · Clics teléfono: {q.data?.phone_clicks ?? 0}
      </p>
    </div>
  )
}
