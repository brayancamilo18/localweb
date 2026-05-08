import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { fetchAdminTemplates, toggleAdminTemplateActive, toggleAdminTemplatePro } from '../../api/admin'
import { keys } from '../../api/queryKeys'
import type { AdminTemplateRow } from '../../types/api'
import { Card } from '../../components/primitives/primitives'
import Toggle from '../../components/primitives/Toggle'

type SortCol = 'usage' | 'name' | 'slug'

function sortTemplates(rows: AdminTemplateRow[], col: SortCol, dir: 'asc' | 'desc'): AdminTemplateRow[] {
  const mult = dir === 'asc' ? 1 : -1
  return [...rows].sort((a, b) => {
    if (col === 'usage') {
      const d = (a.total_usage - b.total_usage) * mult
      return d !== 0 ? d : a.name.localeCompare(b.name, 'es')
    }
    if (col === 'name') {
      return a.name.localeCompare(b.name, 'es') * mult
    }
    return a.slug.localeCompare(b.slug, 'es') * mult
  })
}

function ColorChip({ hex }: { hex: string }) {
  const safe = hex?.trim() || '#ccc'
  return (
    <span
      title={safe}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        fontSize: 12,
        fontFamily: 'ui-monospace, monospace',
        color: 'var(--lw-text-2)',
      }}
    >
      <span
        style={{
          width: 22,
          height: 22,
          borderRadius: 6,
          background: safe,
          border: '1px solid var(--lw-border)',
          boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.15)',
          flexShrink: 0,
        }}
      />
      {safe}
    </span>
  )
}

function SortTh({
  label,
  active,
  dir,
  onClick,
}: {
  label: string
  active: boolean
  dir: 'asc' | 'desc'
  onClick: () => void
}) {
  return (
    <th style={{ padding: '12px 16px', fontWeight: 600, userSelect: 'none' }}>
      <button
        type="button"
        onClick={onClick}
        style={{
          background: 'transparent',
          border: 'none',
          padding: 0,
          cursor: 'pointer',
          font: 'inherit',
          fontWeight: 600,
          color: active ? 'var(--lw-accent)' : 'var(--lw-text)',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
        }}
      >
        {label}
        {active ? <span style={{ fontSize: 11, opacity: 0.85 }}>{dir === 'desc' ? '↓' : '↑'}</span> : null}
      </button>
    </th>
  )
}

export default function AdminTemplatesPage() {
  const qc = useQueryClient()
  const [sortCol, setSortCol] = useState<SortCol>('usage')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  const { data, isLoading, isError } = useQuery({
    queryKey: keys.admin.templates,
    queryFn: async () => {
      const res = await fetchAdminTemplates()
      return res.templates
    },
  })

  const mergeTemplate = (updated: AdminTemplateRow) => {
    qc.setQueryData(keys.admin.templates, (prev: AdminTemplateRow[] | undefined) => {
      const list = prev ?? []
      return list.map((t) => (t.id === updated.id ? updated : t))
    })
  }

  const toggleActive = useMutation({
    mutationFn: (id: number) => toggleAdminTemplateActive(id),
    onSuccess: (res) => mergeTemplate(res.template),
  })

  const togglePro = useMutation({
    mutationFn: (id: number) => toggleAdminTemplatePro(id),
    onSuccess: (res) => mergeTemplate(res.template),
  })

  const sortedRows = useMemo(() => sortTemplates(data ?? [], sortCol, sortDir), [data, sortCol, sortDir])

  function headerClick(col: SortCol) {
    if (sortCol === col) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortCol(col)
      setSortDir(col === 'usage' ? 'desc' : 'asc')
    }
  }

  return (
    <div>
      <p className="lw-small" style={{ marginTop: 0, marginBottom: 14, color: 'var(--lw-text-3)' }}>
        Todas las plantillas (activas e inactivas). Orden por uso descendente por defecto; pulsa una columna para
        reordenar.
      </p>
      {isLoading ? (
        <div className="lw-shimmer" style={{ height: 200, borderRadius: 12 }} />
      ) : isError ? (
        <p style={{ color: 'var(--lw-danger)' }}>Error al cargar plantillas.</p>
      ) : (
        <Card padding={0} style={{ overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: 'var(--lw-surface)', textAlign: 'left' }}>
                  <SortTh
                    label="Nombre"
                    active={sortCol === 'name'}
                    dir={sortDir}
                    onClick={() => headerClick('name')}
                  />
                  <SortTh label="Slug" active={sortCol === 'slug'} dir={sortDir} onClick={() => headerClick('slug')} />
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>Color</th>
                  <SortTh
                    label="Uso"
                    active={sortCol === 'usage'}
                    dir={sortDir}
                    onClick={() => headerClick('usage')}
                  />
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>Activa</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>Pro</th>
                </tr>
              </thead>
              <tbody>
                {sortedRows.map((row) => {
                  const activeBusy = toggleActive.isPending && toggleActive.variables === row.id
                  const proBusy = togglePro.isPending && togglePro.variables === row.id
                  return (
                    <tr key={row.id} style={{ borderTop: '1px solid var(--lw-border)' }}>
                      <td style={{ padding: '10px 16px', fontWeight: 500 }}>{row.name}</td>
                      <td style={{ padding: '10px 16px', color: 'var(--lw-text-2)', fontFamily: 'ui-monospace, monospace' }}>
                        {row.slug}
                      </td>
                      <td style={{ padding: '10px 16px' }}>
                        <ColorChip hex={row.primary_color} />
                      </td>
                      <td style={{ padding: '10px 16px', fontVariantNumeric: 'tabular-nums' }}>
                        {row.total_usage}
                      </td>
                      <td style={{ padding: '10px 16px' }}>
                        <Toggle
                          checked={row.is_active}
                          disabled={activeBusy}
                          label="Activa"
                          onChange={() => toggleActive.mutate(row.id)}
                        />
                      </td>
                      <td style={{ padding: '10px 16px' }}>
                        <Toggle
                          checked={row.requires_pro}
                          disabled={proBusy}
                          label="Pro"
                          onChange={() => togglePro.mutate(row.id)}
                        />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}
