import axios from 'axios'
import { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { DayPicker } from 'react-day-picker'
import { es } from 'react-day-picker/locale'
import 'react-day-picker/style.css'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Btn, Card, Icon } from '../../../components/primitives/primitives'
import { getStats } from '../../../api/dashboard'
import { keys } from '../../../api/queryKeys'
import type { StatsBucket } from '../../../types/api'
import { useDashboard } from '../context/DashboardContext'

function toYmd(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function SingleDatePopover({
  label,
  value,
  minDate,
  maxDate,
  onChange,
}: {
  label: string
  value: string
  minDate?: string
  maxDate?: string
  onChange: (date: string) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const selected = value ? new Date(`${value}T12:00:00`) : undefined

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open])

  const fmt = (d: Date | undefined) =>
    d ? d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

  const disabledMatchers = [
    ...(minDate ? [{ before: new Date(`${minDate}T00:00:00`) }] : []),
    ...(maxDate ? [{ after: new Date(`${maxDate}T23:59:59`) }] : []),
  ]

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span style={{ fontSize: 12, color: 'var(--lw-text-3)', fontWeight: 500 }}>{label}</span>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '7px 14px',
            borderRadius: 'var(--lw-r-sm)',
            border: `1px solid ${open ? 'var(--lw-accent)' : 'var(--lw-border-2)'}`,
            background: 'var(--lw-bg-elev)',
            color: 'var(--lw-text)',
            fontSize: 13,
            fontWeight: 500,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            outline: 'none',
          }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          {fmt(selected)}
        </button>
      </div>

      {open ? (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            zIndex: 100,
            background: 'var(--lw-bg-elev)',
            border: '1px solid var(--lw-border)',
            borderRadius: 'var(--lw-r)',
            boxShadow: '0 8px 24px rgba(0,0,0,.14)',
            padding: 12,
          }}
        >
          <DayPicker
            mode="single"
            locale={es}
            selected={selected}
            defaultMonth={selected}
            onSelect={(date) => {
              if (date) {
                onChange(toYmd(date))
                setOpen(false)
              }
            }}
            disabled={disabledMatchers.length ? disabledMatchers : undefined}
          />
        </div>
      ) : null}
    </div>
  )
}

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
      <Btn kind="primary" iconRight="sparkle" type="button" onClick={() => (window.location.href = '/dashboard/account?tab=plan')}>
        Mejorar a Pro
      </Btn>
    </Card>
  )
}

function formatBucketLabel(bucket: string, granularity: 'day' | 'hour'): string {
  if (granularity === 'hour') {
    const time = bucket.split(' ')[1] ?? ''
    return time.slice(0, 5)
  }
  const d = new Date(`${bucket}T12:00:00`)
  return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })
}

function formatBucketTooltip(bucket: string, granularity: 'day' | 'hour'): string {
  if (granularity === 'hour') {
    const [datePart, timePart] = bucket.split(' ')
    const d = new Date(`${datePart}T12:00:00`)
    const dateLabel = d.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
    return `${dateLabel} · ${(timePart ?? '00:00:00').slice(0, 5)}`
  }
  const d = new Date(`${bucket}T12:00:00`)
  return d.toLocaleDateString('es-ES', {
    weekday: 'long',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

type ChartPoint = { label: string; tooltipLabel: string; count: number }

function StatChart({
  title,
  icon,
  iconColor,
  total,
  series,
  color,
  granularity,
}: {
  title: string
  icon: 'barChart' | 'phone'
  iconColor: string
  total: number | undefined
  series: StatsBucket[]
  color: string
  granularity: 'day' | 'hour'
}) {
  const data: ChartPoint[] = series.map((s) => ({
    label: formatBucketLabel(s.bucket, granularity),
    tooltipLabel: formatBucketTooltip(s.bucket, granularity),
    count: s.count,
  }))

  const gradientId = `grad-${title.replace(/\s+/g, '-')}`

  return (
    <Card padding={20}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 14,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Icon name={icon} size={18} color={iconColor} />
          <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--lw-text-2)' }}>{title}</div>
        </div>
        <div
          style={{
            fontSize: 24,
            fontWeight: 600,
            fontVariantNumeric: 'tabular-nums',
            letterSpacing: '-0.02em',
          }}
        >
          {total ?? '—'}
        </div>
      </div>

      <div style={{ width: '100%', height: 260 }}>
        {data.length === 0 ? (
          <div
            style={{
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--lw-text-4)',
              fontSize: 13,
            }}
          >
            Sin datos en este rango
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 12, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={color} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--lw-border)" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: 'var(--lw-text-3)' }}
                tickLine={false}
                axisLine={{ stroke: 'var(--lw-border)' }}
                interval="preserveStartEnd"
                minTickGap={20}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 11, fill: 'var(--lw-text-3)' }}
                tickLine={false}
                axisLine={false}
                width={36}
              />
              <Tooltip
                cursor={{ stroke: 'var(--lw-border-2)', strokeWidth: 1 }}
                contentStyle={{
                  background: 'var(--lw-bg-elev)',
                  border: '1px solid var(--lw-border)',
                  borderRadius: 'var(--lw-r-sm)',
                  fontSize: 12,
                  padding: '8px 12px',
                  boxShadow: '0 4px 12px rgba(0,0,0,.08)',
                }}
                labelStyle={{
                  color: 'var(--lw-text)',
                  fontWeight: 600,
                  marginBottom: 4,
                  textTransform: 'capitalize',
                }}
                itemStyle={{ color, padding: 0, fontWeight: 500 }}
                formatter={(value: number) => [value, title]}
                labelFormatter={(_label, payload) => {
                  const p = payload?.[0]?.payload as { tooltipLabel?: string } | undefined
                  return p?.tooltipLabel ?? ''
                }}
              />
              <Area
                type="monotone"
                dataKey="count"
                stroke={color}
                strokeWidth={2}
                fill={`url(#${gradientId})`}
                dot={false}
                activeDot={{ r: 5, strokeWidth: 0, fill: color }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </Card>
  )
}

/** Coincide con `now()->subDays(90)` del backend Pro: hoy + 89 días anteriores = ventana de 90 días. */
const PLAN_DAYS = 90

export default function Estadisticas() {
  const { business } = useDashboard()
  const today = new Date().toISOString().slice(0, 10)
  const planMinDate = (() => {
    const d = new Date()
    d.setDate(d.getDate() - (PLAN_DAYS - 1))
    return d.toISOString().slice(0, 10)
  })()

  const [from, setFrom] = useState<string>(() => {
    const d = new Date()
    d.setDate(d.getDate() - 29)
    return d.toISOString().slice(0, 10)
  })
  const [to, setTo] = useState<string>(today)

  const handleFromChange = (date: string) => {
    if (date > to) {
      setFrom(to)
      setTo(date)
    } else {
      setFrom(date)
    }
  }

  const handleToChange = (date: string) => {
    if (date < from) {
      setFrom(date)
      setTo(from)
    } else {
      setTo(date)
    }
  }

  const granularity: 'day' | 'hour' = from === to ? 'hour' : 'day'

  const q = useQuery({
    queryKey: [...keys.dashboard.stats, from, to, granularity],
    queryFn: () => getStats({ from, to, granularity }),
    enabled: business.is_pro,
    retry: false,
  })

  if (!business.is_pro) {
    return <StatsProUpsell />
  }

  const locked =
    q.isError &&
    axios.isAxiosError(q.error) &&
    q.error.response?.status === 403 &&
    Boolean((q.error.response?.data as { upgrade_required?: boolean })?.upgrade_required)

  if (locked) {
    return <StatsProUpsell />
  }

  const activeGranularity: 'day' | 'hour' = q.data?.granularity ?? granularity

  return (
    <>
      <style>{`
        .rdp-root {
          --rdp-accent-color: var(--lw-accent);
          --rdp-accent-background-color: var(--lw-accent-soft);
          font-size: 13px;
        }
        .rdp-selected .rdp-day_button {
          background: var(--lw-accent) !important;
          color: #fff !important;
          border-radius: var(--lw-r-sm) !important;
        }
        .rdp-day_button:hover {
          background: var(--lw-surface) !important;
        }
        /* Recharts a veces deja outlines/rectángulos de focus tras hacer click; los suprimimos. */
        .recharts-wrapper,
        .recharts-wrapper *,
        .recharts-surface,
        .recharts-surface *,
        .recharts-layer,
        .recharts-active-dot,
        .recharts-active-dot circle {
          outline: none !important;
        }
        .recharts-wrapper:focus,
        .recharts-wrapper *:focus,
        .recharts-surface:focus,
        .recharts-surface *:focus {
          outline: none !important;
        }
      `}</style>
      <div style={{ maxWidth: 1100 }}>
        <h1 className="lw-h2" style={{ marginBottom: 8 }}>
          Estadísticas
        </h1>
        <p className="lw-small" style={{ marginBottom: 18 }}>
          Las gráficas reflejan el rango de fechas seleccionado. Los totales mostrados son acumulados desde el inicio.
          Periodo máximo según tu plan: {q.data?.days_limit ?? '—'} días.
        </p>

        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: 8 }}>
          <SingleDatePopover
            label="Desde"
            value={from}
            minDate={planMinDate}
            maxDate={today}
            onChange={handleFromChange}
          />
          <SingleDatePopover
            label="Hasta"
            value={to}
            minDate={planMinDate}
            maxDate={today}
            onChange={handleToChange}
          />
        </div>
        <p className="lw-small" style={{ marginBottom: 20, color: 'var(--lw-text-3)' }}>
          {activeGranularity === 'hour'
            ? 'Mostrando datos por hora del día seleccionado.'
            : `Mostrando datos por día (${q.data?.daily_visits?.length ?? 0} puntos).`}
        </p>

        {q.isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[0, 1, 2].map((i) => (
              <div key={i} className="lw-shimmer" style={{ height: 320, borderRadius: 'var(--lw-r)' }} />
            ))}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <StatChart
              title="Visitas totales"
              icon="barChart"
              iconColor="var(--lw-accent)"
              total={q.data?.total}
              series={q.data?.daily_visits ?? []}
              color="var(--lw-accent)"
              granularity={activeGranularity}
            />
            <StatChart
              title="Clics WhatsApp"
              icon="phone"
              iconColor="#16a34a"
              total={q.data?.whatsapp_clicks}
              series={q.data?.daily_whatsapp_clicks ?? []}
              color="#16a34a"
              granularity={activeGranularity}
            />
            <StatChart
              title="Clics teléfono"
              icon="phone"
              iconColor="#2563eb"
              total={q.data?.phone_clicks}
              series={q.data?.daily_phone_clicks ?? []}
              color="#2563eb"
              granularity={activeGranularity}
            />
          </div>
        )}
      </div>
    </>
  )
}
