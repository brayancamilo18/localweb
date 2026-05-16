import { useQuery } from '@tanstack/react-query'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  fetchAdminOverview,
  fetchAdminSectors,
  fetchAdminStatsTemplateUsage,
  fetchAdminTimeSeries,
} from '../../api/admin'
import { keys } from '../../api/queryKeys'
import type { AdminOverview, AdminTimeSeries } from '../../types/api'
import type { UseQueryResult } from '@tanstack/react-query'
import { Card, Icon, Segmented } from '../../components/primitives/primitives'
import { useMemo, useState } from 'react'

type RangeKey = '7d' | '30d' | '90d'

function pctVsPrevious(current: number, previous: number): { text: string; tone: 'up' | 'down' | 'flat' | 'new' } {
  if (previous === 0 && current === 0) return { text: '0% vs. anterior', tone: 'flat' }
  if (previous === 0) return { text: 'sin datos previos', tone: 'new' }
  const pct = ((current - previous) / previous) * 100
  const rounded = pct.toFixed(1)
  if (pct > 0.05) return { text: `↑ ${rounded}% vs. 30 d anteriores`, tone: 'up' }
  if (pct < -0.05) return { text: `↓ ${Math.abs(Number(rounded))}% vs. 30 d anteriores`, tone: 'down' }
  return { text: `${rounded}% vs. 30 d anteriores`, tone: 'flat' }
}

function DeltaRow({ overview }: { overview: AdminOverview }) {
  const nb = pctVsPrevious(overview.new_businesses_last_30d, overview.new_businesses_prev_30d)
  const vi = pctVsPrevious(overview.total_visits_last_30d, overview.visits_prev_30d)
  const toneColor = (t: 'up' | 'down' | 'flat' | 'new') =>
    t === 'up'
      ? 'var(--lw-success)'
      : t === 'down'
        ? 'var(--lw-danger)'
        : t === 'new'
          ? 'var(--lw-accent)'
          : 'var(--lw-text-3)'

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))',
        gap: 12,
        marginBottom: 20,
      }}
    >
      <KpiCard
        label="Nuevos negocios (30 d)"
        value={overview.new_businesses_last_30d}
        delta={nb.text}
        deltaColor={toneColor(nb.tone)}
      />
      <KpiCard
        label="Visitas página (30 d)"
        value={overview.total_visits_last_30d}
        delta={vi.text}
        deltaColor={toneColor(vi.tone)}
      />
      <KpiCard label="Negocios totales" value={overview.total_businesses} />
      <KpiCard label="Usuarios registrados" value={overview.total_users} />
      <KpiCard label="WhatsApp (30 d)" value={overview.whatsapp_clicks_last_30d} />
      <KpiCard label="Conversión Pro" value={`${overview.conversion_rate}%`} isText />
    </div>
  )
}

function KpiCard({
  label,
  value,
  delta,
  deltaColor,
  isText,
}: {
  label: string
  value: number | string
  delta?: string
  deltaColor?: string
  isText?: boolean
}) {
  return (
    <Card padding={16}>
      <div className="lw-small" style={{ marginBottom: 8, color: 'var(--lw-text-2)' }}>
        {label}
      </div>
      <div
        style={{
          fontSize: isText ? 20 : 24,
          fontWeight: 600,
          fontVariantNumeric: 'tabular-nums',
          letterSpacing: '-0.02em',
        }}
      >
        {typeof value === 'number' ? value.toLocaleString('es-ES') : value}
      </div>
      {delta ? (
        <div style={{ marginTop: 8, fontSize: 12, fontWeight: 600, color: deltaColor ?? 'var(--lw-text-3)' }}>
          {delta}
        </div>
      ) : null}
    </Card>
  )
}

function formatBucketLabel(dateStr: string, granularity: string): string {
  const d = new Date(`${dateStr}T12:00:00`)
  if (granularity === 'month') {
    return d.toLocaleDateString('es-ES', { month: 'short', year: '2-digit' })
  }
  if (granularity === 'week') {
    return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
  }
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
}

function sectorDisplayName(key: string): string {
  return key.replace(/_/g, ' ')
}

export default function AdminDashboardPage() {
  const [range, setRange] = useState<RangeKey>('30d')

  const overviewQ = useQuery({
    queryKey: keys.admin.overview,
    queryFn: fetchAdminOverview,
  })

  const sectorsQ = useQuery({
    queryKey: keys.admin.sectors,
    queryFn: async () => {
      const r = await fetchAdminSectors()
      return r.sectors
    },
  })

  const statsTplQ = useQuery({
    queryKey: keys.admin.statsTemplates,
    queryFn: async () => {
      const r = await fetchAdminStatsTemplateUsage()
      return r.templates
    },
  })

  const regSeries = useQuery({
    queryKey: keys.admin.timeseries('registrations', range),
    queryFn: () => fetchAdminTimeSeries({ metric: 'registrations', range }),
  })

  const visitSeries = useQuery({
    queryKey: keys.admin.timeseries('visits', range),
    queryFn: () => fetchAdminTimeSeries({ metric: 'visits', range }),
  })

  const topSectors = useMemo(() => {
    const rows = sectorsQ.data ?? []
    return rows.slice(0, 10).map((s) => ({
      ...s,
      label: sectorDisplayName(s.sector),
    }))
  }, [sectorsQ.data])

  const rangeOptions = [
    { value: '7d', label: '7 d' },
    { value: '30d', label: '30 d' },
    { value: '90d', label: '90 d' },
  ]

  if (overviewQ.isError || !overviewQ.data) {
    return <p style={{ color: 'var(--lw-danger)' }}>No se pudieron cargar las métricas.</p>
  }

  const overview = overviewQ.data

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <p className="lw-small" style={{ margin: 0, color: 'var(--lw-text-2)' }}>
        KPIs comparan la ventana de 30 días con los 30 días anteriores cuando la API lo permite.
      </p>

      <DeltaRow overview={overview} />

      <Card padding={16}>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            marginBottom: 12,
          }}
        >
          <div style={{ fontWeight: 600, fontSize: 15 }}>Series temporales</div>
          <Segmented value={range} onChange={(v) => setRange(v as RangeKey)} options={rangeOptions} size="sm" />
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 16,
          }}
        >
          <SeriesPanel title="Registros de negocios" query={regSeries} range={range} color="var(--lw-accent)" />
          <SeriesPanel title="Visitas" query={visitSeries} range={range} color="var(--lw-success)" />
        </div>
      </Card>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 360px), 1fr))',
          gap: 16,
          alignItems: 'start',
        }}
      >
        <Card padding={16}>
          <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 15 }}>Top sectores</div>
          <p className="lw-small" style={{ margin: '0 0 12px', color: 'var(--lw-text-3)' }}>
            Negocios por sector (top 10).
          </p>
          {sectorsQ.isError ? (
            <p style={{ color: 'var(--lw-danger)', fontSize: 13 }}>Error al cargar sectores.</p>
          ) : sectorsQ.isLoading ? (
            <div className="lw-shimmer" style={{ height: 280, borderRadius: 8 }} />
          ) : (
            <div style={{ width: '100%', height: Math.max(220, topSectors.length * 36) }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart layout="vertical" data={topSectors} margin={{ left: 4, right: 16, top: 4, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal stroke="var(--lw-border)" />
                  <XAxis type="number" tick={{ fontSize: 11 }} stroke="var(--lw-text-3)" />
                  <YAxis
                    type="category"
                    dataKey="label"
                    width={108}
                    tick={{ fontSize: 11 }}
                    stroke="var(--lw-text-3)"
                  />
                  <Tooltip
                    contentStyle={{
                      background: 'var(--lw-bg-elev)',
                      border: '1px solid var(--lw-border)',
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                    formatter={(v) => [Number(v ?? 0), 'Negocios']}
                  />
                  <Bar dataKey="total" fill="var(--lw-accent)" radius={[0, 4, 4, 0]} maxBarSize={22} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        <Card padding={12}>
          <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 15 }}>Plantillas</div>
          <p className="lw-small" style={{ margin: '0 0 10px', color: 'var(--lw-text-3)' }}>
            Uso por plantilla (negocios activos).
          </p>
          {statsTplQ.isError ? (
            <p style={{ color: 'var(--lw-danger)', fontSize: 13 }}>Error al cargar plantillas.</p>
          ) : statsTplQ.isLoading ? (
            <div className="lw-shimmer" style={{ height: 160, borderRadius: 8 }} />
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ textAlign: 'left', color: 'var(--lw-text-3)', borderBottom: '1px solid var(--lw-border)' }}>
                    <th style={{ padding: '6px 8px', fontWeight: 600 }}>Plantilla</th>
                    <th style={{ padding: '6px 8px', fontWeight: 600 }}>Slug</th>
                    <th style={{ padding: '6px 8px', fontWeight: 600 }}>Uso</th>
                    <th style={{ padding: '6px 8px', fontWeight: 600 }}>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {(statsTplQ.data ?? []).map((t) => (
                    <tr key={t.id} style={{ borderBottom: '1px solid var(--lw-border)' }}>
                      <td style={{ padding: '6px 8px', fontWeight: 500 }}>{t.name}</td>
                      <td style={{ padding: '6px 8px', color: 'var(--lw-text-2)', fontFamily: 'ui-monospace, monospace' }}>
                        {t.slug}
                      </td>
                      <td style={{ padding: '6px 8px', fontVariantNumeric: 'tabular-nums' }}>{t.total_usage}</td>
                      <td style={{ padding: '6px 8px' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          {t.is_active ? (
                            <Icon name="check" size={12} color="var(--lw-success)" />
                          ) : (
                            <Icon name="minus" size={12} color="var(--lw-text-4)" />
                          )}
                          <span className="lw-small">{t.is_active ? 'Activa' : 'Off'}</span>
                          {t.requires_pro ? (
                            <span className="lw-small" style={{ color: 'var(--lw-warning)' }}>
                              Pro
                            </span>
                          ) : null}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}

function SeriesPanel({
  title,
  query,
  range,
  color,
}: {
  title: string
  query: UseQueryResult<AdminTimeSeries, Error>
  range: RangeKey
  color: string
}) {
  const data = query.data?.points ?? []
  const granularity = query.data?.granularity ?? 'day'

  const chartData = data.map((p) => ({
    ...p,
    label: formatBucketLabel(p.date, granularity),
  }))

  if (query.isError) {
    return (
      <div style={{ minHeight: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ color: 'var(--lw-danger)', fontSize: 13 }}>Error al cargar serie.</span>
      </div>
    )
  }

  if (query.isPending && !query.data) {
    return (
      <div>
        <div className="lw-small" style={{ marginBottom: 8, fontWeight: 600 }}>
          {title}
        </div>
        <div className="lw-shimmer" style={{ height: 220, borderRadius: 8 }} />
      </div>
    )
  }

  return (
    <div style={{ minWidth: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
        <span style={{ fontWeight: 600, fontSize: 14 }}>{title}</span>
        <span className="lw-small" style={{ color: 'var(--lw-text-4)' }}>
          {range === '7d' ? '7 d' : range === '30d' ? '30 d' : '90 d'} ·{' '}
          {granularity === 'week' ? 'semanal' : granularity === 'month' ? 'mensual' : 'diario'}
        </span>
      </div>
      <div style={{ width: '100%', height: 240 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ left: 0, right: 8, top: 4, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--lw-border)" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10 }}
              stroke="var(--lw-text-3)"
              interval="preserveStartEnd"
              minTickGap={18}
            />
            <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="var(--lw-text-3)" width={36} />
            <Tooltip
              contentStyle={{
                background: 'var(--lw-bg-elev)',
                border: '1px solid var(--lw-border)',
                borderRadius: 8,
                fontSize: 12,
              }}
              labelFormatter={(label) => String(label)}
              formatter={(v) => [Number(v ?? 0), title]}
            />
            <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
