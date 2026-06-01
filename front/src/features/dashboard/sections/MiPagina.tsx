import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Btn, Icon } from '../../../components/primitives/primitives'
import { useDashboard } from '../context/DashboardContext'
import { buildPublicBusinessUrl } from '../../../lib/tenant'
import MiPaginaQrSection from './MiPaginaQrSection'
import DashboardSectionHeader from '../components/DashboardSectionHeader'
import '../components/dashboardSectionHeader.css'

/** Valores fijos de ejemplo para el resumen Free (no son métricas reales del negocio). */
const DEMO_SUMMARY = {
  visitsToday: '12',
  visitsWeek: '84',
  whatsapp: '7',
  phone: '4',
} as const

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

function MiPaginaStat({
  label,
  value,
  icon,
  tint,
  iconColor,
  locked,
  demo,
}: {
  label: string
  value: string
  icon: string
  tint: string
  iconColor: string
  locked?: boolean
  demo?: boolean
}) {
  return (
    <div
      style={{
        background: 'var(--lw-bg-elev)',
        border: '1px solid var(--lw-border)',
        borderRadius: 18,
        padding: 20,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 18,
        }}
      >
        <span style={{ fontSize: 13, color: 'var(--lw-text-3)', fontWeight: 500 }}>{label}</span>
        <span
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: tint,
            color: iconColor,
            display: 'grid',
            placeItems: 'center',
          }}
        >
          <Icon name={icon} size={18} />
        </span>
      </div>
      <div
        style={{
          fontSize: 32,
          fontWeight: 700,
          letterSpacing: '-0.02em',
          lineHeight: 1,
          color: locked && !demo ? 'var(--lw-text-4)' : 'var(--lw-text)',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        {locked && demo ? <Icon name="lock" size={16} color="var(--lw-text-4)" /> : null}
        <span>{value}</span>
        {demo ? (
          <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--lw-text-4)' }}>ejemplo</span>
        ) : null}
      </div>
    </div>
  )
}

export default function MiPagina() {
  const { business, stats } = useDashboard()
  const navigate = useNavigate()
  const [copied, setCopied] = useState(false)
  const pro = business.is_pro
  const visitsToday = pro ? visitsTodayFromDaily(stats.daily_visits) : undefined
  const visitsWeek = pro ? visitsWeekFromDaily(stats.daily_visits) : undefined
  const wa = pro ? stats.whatsapp_clicks : undefined
  const ph = pro ? stats.phone_clicks : undefined

  const canonicalPublicUrl = business.subdomain ? buildPublicBusinessUrl(business.subdomain) : ''
  const devReachableUrl =
    typeof window !== 'undefined' && business.subdomain ? `${window.location.origin}/${business.subdomain}` : ''
  const localHost =
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  // En local (localhost), el wildcard DNS de subdominios no existe por defecto.
  // Mostramos una URL que sí carga aquí y mantenemos la canónica para producción.
  const publicUrl = localHost ? devReachableUrl : canonicalPublicUrl

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
      <DashboardSectionHeader
        badgeIcon="sparkle"
        badgeLabel="Mi página"
        title="Resumen y enlace público"
        subtitle="Comparte tu página, mira cómo va y descarga tu cartel con QR listo para imprimir."
        aside={
          <div style={{ display: 'flex', gap: 8 }}>
            <Btn kind="outline" icon="bell" size="md" style={{ width: 38, padding: 0 }} />
            <Btn kind="outline" icon="user" size="md" type="button" onClick={() => navigate('/dashboard/account')}>
              Cuenta
            </Btn>
          </div>
        }
      />

      <section
        className="lw-mipagina-hero"
        data-tour="mi-pagina-main"
        style={{
          background: 'linear-gradient(135deg, var(--lw-accent) 0%, var(--lw-accent-hover) 100%)',
          borderRadius: 'var(--lw-r-xl)',
          padding: '28px 32px',
          color: '#fff',
          boxShadow: '0 20px 40px -24px rgba(15,110,86,0.5)',
        }}
      >
        <div className="lw-mipagina-hero__clip" aria-hidden>
          <div
            style={{
              position: 'absolute',
              top: -60,
              right: -60,
              width: 240,
              height: 240,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.06)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: -80,
              right: 80,
              width: 180,
              height: 180,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.04)',
            }}
          />
        </div>

        <div className="lw-mipagina-hero__content">
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
          {business.images?.cover?.[0]?.url ? (
            <img
              src={business.images.cover[0].url}
              alt=""
              style={{
                width: 64,
                height: 64,
                borderRadius: 16,
                objectFit: 'cover',
                border: '1px solid rgba(255,255,255,0.25)',
              }}
            />
          ) : (
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: 16,
                background: 'rgba(255,255,255,0.18)',
                border: '1px solid rgba(255,255,255,0.25)',
                display: 'grid',
                placeItems: 'center',
                fontSize: 24,
                fontWeight: 700,
              }}
            >
              {(name?.[0] ?? 'N').toUpperCase()}
            </div>
          )}

          <div style={{ flex: '1 1 280px', minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.01em' }}>{name}</span>
              {business.is_published ? (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    fontSize: 11,
                    fontWeight: 600,
                    padding: '3px 8px',
                    borderRadius: 999,
                    background: 'rgba(255,255,255,0.18)',
                    border: '1px solid rgba(255,255,255,0.25)',
                  }}
                >
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#5CE5A8' }} /> Publicado
                </span>
              ) : (
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    padding: '3px 8px',
                    borderRadius: 999,
                    background: 'rgba(255,255,255,0.18)',
                    border: '1px solid rgba(255,255,255,0.25)',
                  }}
                >
                  Borrador
                </span>
              )}
              {pro ? (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    fontSize: 11,
                    fontWeight: 700,
                    padding: '3px 8px',
                    borderRadius: 999,
                    background: '#FFD66B',
                    color: 'var(--lw-text)',
                    letterSpacing: '0.04em',
                  }}
                >
                  <Icon name="sparkle" size={11} /> PRO
                </span>
              ) : null}
            </div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 4 }}>{sub || '—'}</div>
          </div>

          <Btn
            kind="outline"
            iconRight="arrowUpRight"
            type="button"
            onClick={() => {
              if (publicUrl) window.open(publicUrl, '_blank', 'noopener,noreferrer')
            }}
            style={{ background: '#fff', color: 'var(--lw-accent)', border: 'none' }}
          >
            Ver mi página
          </Btn>
        </div>

        <div
          style={{
            marginTop: 22,
            display: 'flex',
            alignItems: 'center',
            gap: 0,
            background: 'rgba(255,255,255,0.12)',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: 12,
            padding: '4px 4px 4px 16px',
          }}
        >
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', marginRight: 10 }}>URL</span>
          <span
            style={{
              flex: 1,
              fontFamily: 'var(--lw-font-mono)',
              fontSize: 14,
              color: '#fff',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              minWidth: 0,
            }}
          >
            {publicUrl || '—'}
          </span>
          <button
            type="button"
            onClick={copyPublicUrl}
            disabled={!publicUrl}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 14px',
              background: copied ? '#5CE5A8' : '#fff',
              color: copied ? 'var(--lw-text)' : 'var(--lw-accent)',
              border: 'none',
              borderRadius: 10,
              fontWeight: 600,
              fontSize: 13,
              cursor: publicUrl ? 'pointer' : 'not-allowed',
              transition: 'all .15s',
              fontFamily: 'inherit',
            }}
          >
            {copied ? <Icon name="check" size={14} /> : null}
            {copied ? 'Copiado' : 'Copiar'}
          </button>
        </div>
        </div>
      </section>

      <div className="lw-mipagina-stats-grid">
        <MiPaginaStat
          label="Visitas hoy"
          value={pro ? fmtStat(visitsToday) : DEMO_SUMMARY.visitsToday}
          icon="eye"
          tint="var(--lw-accent-soft)"
          iconColor="var(--lw-accent)"
          locked={pro ? visitsToday === undefined : true}
          demo={!pro}
        />
        <MiPaginaStat
          label="Visitas (7 días)"
          value={pro ? fmtStat(visitsWeek) : DEMO_SUMMARY.visitsWeek}
          icon="trending"
          tint="var(--lw-warning-soft)"
          iconColor="var(--lw-warning)"
          locked={pro ? visitsWeek === undefined : true}
          demo={!pro}
        />
        <MiPaginaStat
          label="Clics WhatsApp"
          value={pro ? fmtStat(wa) : DEMO_SUMMARY.whatsapp}
          icon="whatsapp"
          tint="var(--lw-success-soft)"
          iconColor="var(--lw-success)"
          locked={pro ? wa === undefined : true}
          demo={!pro}
        />
        <MiPaginaStat
          label="Clics teléfono"
          value={pro ? fmtStat(ph) : DEMO_SUMMARY.phone}
          icon="phone"
          tint="var(--lw-accent-soft)"
          iconColor="var(--lw-accent)"
          locked={pro ? ph === undefined : true}
          demo={!pro}
        />
      </div>

      <MiPaginaQrSection />
    </>
  )
}
