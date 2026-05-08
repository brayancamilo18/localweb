import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { useMemo, useState } from 'react'
import { fetchAdminTopPages } from '../../api/admin'
import { keys } from '../../api/queryKeys'
import type { AdminTopPageRow } from '../../types/api'
import { Card } from '../../components/primitives/primitives'
import Select from '../../components/primitives/Select'

type RangeKey = '7d' | '30d' | '90d' | 'all'
type EventKey = 'visit' | 'whatsapp_click' | 'phone_click' | 'all'

const RANGE_OPTIONS = [
  { value: '7d', label: 'Últimos 7 días' },
  { value: '30d', label: 'Últimos 30 días' },
  { value: '90d', label: 'Últimos 90 días' },
  { value: 'all', label: 'Todo el histórico' },
]

const EVENT_OPTIONS = [
  { value: 'visit', label: 'Visitas página' },
  { value: 'whatsapp_click', label: 'Clicks WhatsApp' },
  { value: 'phone_click', label: 'Clicks teléfono' },
  { value: 'all', label: 'Todos los eventos (suma)' },
]

const LIMIT_OPTIONS = [
  { value: '20', label: 'Top 20' },
  { value: '30', label: 'Top 30' },
  { value: '50', label: 'Top 50' },
]

function metricForRow(row: AdminTopPageRow, eventType: EventKey): number {
  if (eventType === 'visit') return row.visits
  if (eventType === 'whatsapp_click') return row.whatsapp_clicks
  if (eventType === 'phone_click') return row.phone_clicks
  return row.visits + row.whatsapp_clicks + row.phone_clicks
}

function metricLabel(eventType: EventKey): string {
  if (eventType === 'visit') return 'Visitas'
  if (eventType === 'whatsapp_click') return 'Clicks WhatsApp'
  if (eventType === 'phone_click') return 'Clicks teléfono'
  return 'Total eventos'
}

export default function AdminTopPagesPage() {
  const [range, setRange] = useState<RangeKey>('30d')
  const [eventType, setEventType] = useState<EventKey>('visit')
  const [limitStr, setLimitStr] = useState('20')

  const params = useMemo(
    () => ({
      range,
      event_type: eventType,
      limit: Number(limitStr) || 20,
    }),
    [range, eventType, limitStr],
  )

  const { data, isLoading, isError } = useQuery({
    queryKey: keys.admin.topPages(params),
    queryFn: () => fetchAdminTopPages(params),
  })

  const rows = data?.pages ?? []
  const colTitle = metricLabel(eventType)

  return (
    <div>
      <p className="lw-small" style={{ marginTop: 0, marginBottom: 14, color: 'var(--lw-text-3)' }}>
        Negocios publicados con más actividad según page_visits (ventana temporal y tipo de evento).
      </p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: 12,
          marginBottom: 16,
          alignItems: 'end',
        }}
      >
        <Select label="Rango" value={range} onChange={(e) => setRange(e.target.value as RangeKey)} options={RANGE_OPTIONS} />
        <Select
          label="Tipo de evento"
          value={eventType}
          onChange={(e) => setEventType(e.target.value as EventKey)}
          options={EVENT_OPTIONS}
        />
        <Select label="Cantidad" value={limitStr} onChange={(e) => setLimitStr(e.target.value)} options={LIMIT_OPTIONS} />
      </div>

      {isLoading ? (
        <div className="lw-shimmer" style={{ height: 280, borderRadius: 12 }} />
      ) : isError ? (
        <p style={{ color: 'var(--lw-danger)' }}>No se pudieron cargar los datos.</p>
      ) : (
        <Card padding={0} style={{ overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: 'var(--lw-surface)', textAlign: 'left' }}>
                  <th style={{ padding: '12px 14px', fontWeight: 600, width: 56 }}>#</th>
                  <th style={{ padding: '12px 14px', fontWeight: 600 }}>Negocio</th>
                  <th style={{ padding: '12px 14px', fontWeight: 600 }}>Subdominio</th>
                  <th style={{ padding: '12px 14px', fontWeight: 600 }}>Sector</th>
                  <th style={{ padding: '12px 14px', fontWeight: 600 }}>Plan</th>
                  <th style={{ padding: '12px 14px', fontWeight: 600, textAlign: 'right' }}>{colTitle}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={row.business_id} style={{ borderTop: '1px solid var(--lw-border)' }}>
                    <td style={{ padding: '10px 14px', fontVariantNumeric: 'tabular-nums', color: 'var(--lw-text-3)' }}>
                      {i + 1}
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <Link
                        to={`/admin/businesses/${row.business_id}`}
                        style={{ fontWeight: 600, color: 'var(--lw-accent)', textDecoration: 'none' }}
                      >
                        {row.name}
                      </Link>
                    </td>
                    <td style={{ padding: '10px 14px', color: 'var(--lw-text-2)', fontFamily: 'ui-monospace, monospace' }}>
                      {row.subdomain}
                    </td>
                    <td style={{ padding: '10px 14px' }}>{row.sector}</td>
                    <td style={{ padding: '10px 14px' }}>{row.plan}</td>
                    <td style={{ padding: '10px 14px', textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>
                      {metricForRow(row, eventType)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}
