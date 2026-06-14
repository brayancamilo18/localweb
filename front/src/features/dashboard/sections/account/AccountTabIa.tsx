import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, Icon } from '../../../../components/primitives/primitives'
import { getAiUsage, type AiUsageHistoryEntry } from '../../../../api/ai'
import { keys } from '../../../../api/queryKeys'
import DisenoPagination from '../DisenoPagination'

const HISTORY_PAGE_SIZE = 10

// ─── helpers de formato ───────────────────────────────────────

function formatDateEs(iso: string): string {
  try {
    return new Intl.DateTimeFormat('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(iso))
  } catch {
    return iso
  }
}

function formatResetDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date(iso))
  } catch {
    return iso
  }
}

function timeAgo(iso: string): string {
  try {
    const diff = Date.now() - new Date(iso).getTime()
    const mins = Math.floor(diff / 60_000)
    if (mins < 1) return 'ahora mismo'
    if (mins < 60) return `hace ${mins} min`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `hace ${hours}h`
    const days = Math.floor(hours / 24)
    if (days === 1) return 'ayer'
    if (days < 7) return `hace ${days} días`
    return formatDateEs(iso)
  } catch {
    return iso
  }
}

// ─── iconos por feature ───────────────────────────────────────
const FEATURE_ICON: Record<string, string> = {
  business_description: 'edit',
  service_description: 'list',
  improve_text: 'sparkle',
  seo_meta: 'search',
  social_posts: 'bell',
  about_block_description: 'grid',
}

function featureIcon(feature: string): string {
  return FEATURE_ICON[feature] ?? 'sparkle'
}

// ─── sub-componentes ──────────────────────────────────────────

function UsageMeter({ used, limit }: { used: number; limit: number }) {
  const pct = limit > 0 ? Math.min(1, used / limit) : 0
  const danger = pct >= 0.9
  const warn = pct >= 0.7

  const color = danger
    ? 'var(--lw-danger)'
    : warn
      ? '#D97706'
      : 'var(--lw-accent)'

  return (
    <div style={{ width: '100%' }}>
      <div
        style={{
          height: 8,
          borderRadius: 999,
          background: 'var(--lw-surface)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${pct * 100}%`,
            background: color,
            borderRadius: 999,
            transition: 'width .3s ease',
          }}
        />
      </div>
    </div>
  )
}

function HistoryRow({ entry }: { entry: AiUsageHistoryEntry }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '10px 0',
        borderBottom: '1px solid var(--lw-border)',
      }}
    >
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          background: 'var(--lw-accent-soft)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Icon name={featureIcon(entry.feature)} size={14} color="var(--lw-accent-hover)" />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--lw-text)' }}>
          {entry.label}
        </div>
        <div style={{ fontSize: 12, color: 'var(--lw-text-3)', marginTop: 1 }}>
          {formatDateEs(entry.created_at)}
        </div>
      </div>
      <div style={{ fontSize: 12, color: 'var(--lw-text-3)', flexShrink: 0, whiteSpace: 'nowrap' }}>
        {timeAgo(entry.created_at)}
      </div>
    </div>
  )
}

// ─── componente principal ─────────────────────────────────────

export default function AccountTabIa() {
  const { data, isLoading, isError } = useQuery({
    queryKey: keys.ai.usage,
    queryFn: getAiUsage,
    staleTime: 60_000,
    retry: false,
  })

  const history = data?.history ?? []
  const [historyPage, setHistoryPage] = useState(1)
  const totalHistoryPages = Math.max(1, Math.ceil(history.length / HISTORY_PAGE_SIZE))

  useEffect(() => {
    if (historyPage > totalHistoryPages) {
      setHistoryPage(totalHistoryPages)
    }
  }, [historyPage, totalHistoryPages])

  const paginatedHistory = useMemo(() => {
    const start = (historyPage - 1) * HISTORY_PAGE_SIZE
    return history.slice(start, start + HISTORY_PAGE_SIZE)
  }, [history, historyPage])

  if (isLoading) {
    return (
      <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--lw-text-3)', fontSize: 14 }}>
        Cargando uso de IA…
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--lw-text-3)', fontSize: 14 }}>
        No se pudo cargar el uso de IA. Inténtalo de nuevo.
      </div>
    )
  }

  if (!data.enabled) {
    return (
      <Card padding={20}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <Icon name="sparkle" size={20} color="var(--lw-text-3)" />
          <div>
            <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--lw-text)' }}>
              IA no disponible
            </div>
            <p style={{ fontSize: 13, color: 'var(--lw-text-2)', margin: '4px 0 0' }}>
              Las funciones de inteligencia artificial no están habilitadas en este momento.
            </p>
          </div>
        </div>
      </Card>
    )
  }

  const { used, limit, remaining, resets_at } = data

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* ── Resumen mensual ── */}
      <Card padding={20}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: 'var(--lw-accent-soft)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Icon name="sparkle" size={18} color="var(--lw-accent-hover)" />
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--lw-text)' }}>
              Uso mensual de IA
            </div>
            <div style={{ fontSize: 12, color: 'var(--lw-text-3)', marginTop: 1 }}>
              Las peticiones se renuevan el primer día de cada mes
            </div>
          </div>
        </div>

        <UsageMeter used={used} limit={limit} />

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: 10,
            flexWrap: 'wrap',
            gap: 8,
          }}
        >
          <div style={{ fontSize: 13, color: 'var(--lw-text-2)' }}>
            <span style={{ fontWeight: 600, color: 'var(--lw-text)', fontSize: 22 }}>{used}</span>
            {' '}
            <span>de {limit} peticiones usadas</span>
          </div>
          <div
            style={{
              background: remaining === 0 ? 'var(--lw-danger-soft)' : 'var(--lw-success-soft)',
              color: remaining === 0 ? 'var(--lw-danger)' : '#15803D',
              borderRadius: 999,
              padding: '3px 10px',
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            {remaining === 0 ? 'Cuota agotada' : `${remaining} disponibles`}
          </div>
        </div>

        <div
          style={{
            marginTop: 14,
            padding: '10px 14px',
            background: 'var(--lw-surface)',
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: 13,
            color: 'var(--lw-text-2)',
          }}
        >
          <Icon name="refresh" size={14} color="var(--lw-text-3)" />
          <span>
            Se renueva el{' '}
            <strong style={{ color: 'var(--lw-text)' }}>{formatResetDate(resets_at)}</strong>
          </span>
        </div>
      </Card>

      {/* ── Historial ── */}
      <Card padding={20}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <Icon name="list" size={16} color="var(--lw-text-3)" />
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--lw-text)' }}>
            Historial de este mes
          </div>
          {history.length > 0 && (
            <span
              style={{
                marginLeft: 'auto',
                fontSize: 12,
                color: 'var(--lw-text-3)',
              }}
            >
              {history.length} {history.length === 1 ? 'petición' : 'peticiones'}
            </span>
          )}
        </div>

        {history.length === 0 ? (
          <div
            style={{
              padding: '24px 0',
              textAlign: 'center',
              color: 'var(--lw-text-3)',
              fontSize: 13,
            }}
          >
            Aún no has usado la IA este mes. Los botones{' '}
            <Icon name="sparkle" size={12} style={{ display: 'inline' }} /> aparecen en el editor de
            contenido.
          </div>
        ) : (
          <div>
            {paginatedHistory.map((entry, i) => (
              <HistoryRow
                key={`${entry.created_at}-${entry.feature}-${(historyPage - 1) * HISTORY_PAGE_SIZE + i}`}
                entry={entry}
              />
            ))}
            {history.length > HISTORY_PAGE_SIZE && (
              <div style={{ marginTop: 12 }}>
                <DisenoPagination
                  page={historyPage}
                  totalPages={totalHistoryPages}
                  onPageChange={setHistoryPage}
                  ariaLabel="Paginación del historial de IA"
                />
              </div>
            )}
          </div>
        )}
      </Card>

    </div>
  )
}
