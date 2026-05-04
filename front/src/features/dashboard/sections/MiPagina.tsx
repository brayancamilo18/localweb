import { useCallback, useState } from 'react'
import { Btn, Badge, Card, Placeholder } from '../../../components/primitives/primitives'
import { StatCard } from '../dashboard'
import { useDashboard } from '../context/DashboardContext'

function fmtStat(n: number | undefined): string {
  return n === undefined || Number.isNaN(n) ? '—' : String(n)
}

function visitsTodayFromDaily(daily: { date: string; count: number }[]): number | undefined {
  if (!daily.length) return undefined
  const ymd = new Date().toISOString().slice(0, 10)
  const hit = daily.find((d) => String(d.date).slice(0, 10) === ymd)
  return hit?.count ?? 0
}

function visitsWeekFromDaily(daily: { count: number }[]): number | undefined {
  if (!daily.length) return undefined
  return daily.slice(-7).reduce((a, d) => a + d.count, 0)
}

export default function MiPagina() {
  const { business, stats } = useDashboard()
  const [copied, setCopied] = useState(false)
  const pro = business.is_pro
  const visitsToday = pro ? visitsTodayFromDaily(stats.daily_visits) : undefined
  const visitsWeek = pro ? visitsWeekFromDaily(stats.daily_visits) : business.stats?.visit
  const wa = pro ? stats.whatsapp_clicks : business.stats?.whatsapp_click
  const ph = pro ? stats.phone_clicks : business.stats?.phone_click

  const publicUrl =
    typeof window !== 'undefined' && business.subdomain
      ? `${window.location.origin}/${business.subdomain}`
      : ''

  const copyPublicUrl = useCallback(async () => {
    if (!publicUrl) return
    try {
      await navigator.clipboard.writeText(publicUrl)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }, [publicUrl])

  const name = business.name ?? 'Tu negocio'
  const sub = business.subdomain ?? ''

  return (
    <>
      <div className="lw-mipagina-header">
        <div>
          <h1 className="lw-h2">Mi página</h1>
          <p className="lw-small" style={{ marginTop: 4, fontSize: 13 }}>
            Resumen y enlace público de tu negocio
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Btn kind="outline" icon="bell" size="md" style={{ width: 38, padding: 0 }} />
          <Btn kind="outline" icon="user" size="md">
            Cuenta
          </Btn>
        </div>
      </div>

      <Card padding={18} className="lw-mipagina-hero-card">
        {business.images?.cover?.[0]?.url ? (
          <img
            src={business.images.cover[0].url}
            alt=""
            style={{ width: 56, height: 56, borderRadius: 'var(--lw-r-sm)', objectFit: 'cover' }}
          />
        ) : (
          <Placeholder ratio="1:1" w={56} h={56} label="" />
        )}
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 16, fontWeight: 600 }}>{name}</span>
            {business.is_published ? (
              <Badge tone="success" dot>
                Publicado
              </Badge>
            ) : (
              <Badge tone="warning">Borrador</Badge>
            )}
            {pro ? (
              <Badge tone="pro" icon="sparkle">
                PRO
              </Badge>
            ) : null}
          </div>
          <span className="lw-mono" style={{ fontSize: 12, color: 'var(--lw-text-3)' }}>
            {sub || '—'}
          </span>
        </div>
        <Btn
          kind="outline"
          iconRight="arrowUpRight"
          type="button"
          onClick={() => {
            if (sub) window.open(`/${sub}`, '_blank', 'noopener,noreferrer')
          }}
        >
          Ver mi página
        </Btn>
      </Card>

      <div style={{ marginBottom: 12 }}>
        <h2 className="lw-h4" style={{ marginBottom: 8 }}>
          URL pública
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <code
            className="lw-mono"
            style={{
              fontSize: 13,
              padding: '8px 12px',
              background: 'var(--lw-surface)',
              borderRadius: 'var(--lw-r-sm)',
              border: '1px solid var(--lw-border)',
              flex: 1,
              minWidth: 200,
            }}
          >
            {publicUrl || '—'}
          </code>
          <Btn kind="outline" type="button" onClick={copyPublicUrl} disabled={!publicUrl}>
            Copiar
          </Btn>
          {copied ? (
            <span className="lw-small" style={{ color: 'var(--lw-success)', fontWeight: 600 }}>
              ¡Copiado!
            </span>
          ) : null}
        </div>
      </div>

      <div className="lw-mipagina-stats-grid">
        <StatCard
          label="Visitas hoy"
          value={fmtStat(visitsToday)}
          icon="eye"
          locked={!pro || visitsToday === undefined}
        />
        <StatCard
          label="Visitas (7 días)"
          value={fmtStat(visitsWeek)}
          icon="trending"
          locked={visitsWeek === undefined}
        />
        <StatCard label="Clics WhatsApp" value={fmtStat(wa)} icon="whatsapp" locked={wa === undefined} />
        <StatCard label="Clics teléfono" value={fmtStat(ph)} icon="phone" locked={ph === undefined} />
      </div>
    </>
  )
}
