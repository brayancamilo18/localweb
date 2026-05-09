import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useMemo, useState } from 'react'
import {
  fetchAdminBusinesses,
  softDeleteAdminBusiness,
  toggleAdminBusinessPublish,
} from '../../api/admin'
import { keys } from '../../api/queryKeys'
import type { AdminBusinessListItem } from '../../types/api'
import { ADMIN_SECTOR_OPTIONS } from './sectors'
import { Btn, Card, Icon, Input } from '../../components/primitives/primitives'
import Select from '../../components/primitives/Select'
import { useToast } from '../../components/ui/Toast'

const PLAN_OPTIONS = [
  { value: '', label: 'Todos los planes' },
  { value: 'free', label: 'Free' },
  { value: 'pro', label: 'Pro' },
  { value: 'pending', label: 'Pending' },
]

const PUBLISHED_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: '1', label: 'Publicados' },
  { value: '0', label: 'No publicados' },
]

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}

function statusLabel(row: AdminBusinessListItem): { text: string; tone: 'ok' | 'warn' | 'bad' } {
  if (row.deleted_at) return { text: 'Eliminado', tone: 'bad' }
  if (row.is_published) return { text: 'Publicado', tone: 'ok' }
  return { text: 'No publicado', tone: 'warn' }
}

export default function AdminBusinessesPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { showToast } = useToast()

  const [search, setSearch] = useState('')
  const [sector, setSector] = useState('')
  const [plan, setPlan] = useState('')
  const [published, setPublished] = useState('')
  const [withTrashed, setWithTrashed] = useState(false)
  const [page, setPage] = useState(1)

  const params = useMemo(() => {
    const p: Parameters<typeof fetchAdminBusinesses>[0] = {
      page,
      per_page: 15,
      sort: 'created_at',
      direction: 'desc',
      search: search.trim() || undefined,
      sector: sector || undefined,
      plan: plan || undefined,
      with_trashed: withTrashed || undefined,
    }
    if (published === '1') p.is_published = true
    if (published === '0') p.is_published = false
    return p
  }, [page, search, sector, plan, published, withTrashed])

  const { data, isLoading, isError } = useQuery({
    queryKey: keys.admin.businesses(params),
    queryFn: () => fetchAdminBusinesses(params),
  })

  const togglePub = useMutation({
    mutationFn: (id: number) => toggleAdminBusinessPublish(id),
    onSuccess: (_d, id) => {
      showToast('Estado de publicación actualizado', 'success')
      void qc.invalidateQueries({ queryKey: ['admin', 'businesses'] })
      void qc.invalidateQueries({ queryKey: keys.admin.business(id) })
    },
    onError: () =>
      showToast({
        type: 'error',
        title: 'No se pudo cambiar la publicación',
        description: 'Revisa que el negocio tenga datos completos.',
      }),
  })

  const softDel = useMutation({
    mutationFn: (id: number) => softDeleteAdminBusiness(id),
    onSuccess: (_void, id) => {
      showToast({
        type: 'success',
        title: 'Negocio archivado',
        description: 'Puedes restaurarlo desde el filtro «incluir archivados».',
      })
      void qc.invalidateQueries({ queryKey: ['admin', 'businesses'] })
      void qc.invalidateQueries({ queryKey: keys.admin.business(id) })
    },
    onError: () => showToast('No se pudo eliminar', 'error'),
  })

  function confirmDelete(row: AdminBusinessListItem) {
    if (
      !confirm(
        `¿Archivar "${row.name}"? El negocio pasará a papelera (soft delete). Podrás restaurarlo desde el detalle.`,
      )
    ) {
      return
    }
    softDel.mutate(row.id)
  }

  const pg = data?.pagination
  const items = data?.items ?? []

  return (
    <div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
          gap: 12,
          marginBottom: 16,
          alignItems: 'end',
        }}
      >
        <div style={{ gridColumn: 'span 2', minWidth: 0 }}>
          <label className="lw-small" style={{ display: 'block', marginBottom: 6 }}>
            Buscar
          </label>
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            placeholder="Nombre o subdominio"
            prefix={<Icon name="search" size={16} color="var(--lw-text-3)" />}
          />
        </div>
        <Select
          label="Sector"
          value={sector}
          onChange={(e) => {
            setSector(e.target.value)
            setPage(1)
          }}
          options={ADMIN_SECTOR_OPTIONS}
        />
        <Select
          label="Plan"
          value={plan}
          onChange={(e) => {
            setPlan(e.target.value)
            setPage(1)
          }}
          options={PLAN_OPTIONS}
        />
        <Select
          label="Publicado"
          value={published}
          onChange={(e) => {
            setPublished(e.target.value)
            setPage(1)
          }}
          options={PUBLISHED_OPTIONS}
        />
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}>
          <input
            type="checkbox"
            checked={withTrashed}
            onChange={(e) => {
              setWithTrashed(e.target.checked)
              setPage(1)
            }}
          />
          Incluir eliminados
        </label>
      </div>

      {isLoading ? (
        <div className="lw-shimmer" style={{ height: 240, borderRadius: 12 }} />
      ) : isError ? (
        <p style={{ color: 'var(--lw-danger)' }}>Error al cargar negocios.</p>
      ) : (
        <>
          <Card padding={0} style={{ overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: 'var(--lw-surface)', textAlign: 'left' }}>
                    <th style={{ padding: '10px 12px', fontWeight: 600 }}>Nombre</th>
                    <th style={{ padding: '10px 12px', fontWeight: 600 }}>Subdominio</th>
                    <th style={{ padding: '10px 12px', fontWeight: 600 }}>Sector</th>
                    <th style={{ padding: '10px 12px', fontWeight: 600 }}>Plan</th>
                    <th style={{ padding: '10px 12px', fontWeight: 600 }}>Estado</th>
                    <th style={{ padding: '10px 12px', fontWeight: 600 }}>Visitas</th>
                    <th style={{ padding: '10px 12px', fontWeight: 600 }}>Alta</th>
                    <th style={{ padding: '10px 12px', fontWeight: 600, textAlign: 'right' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((row) => {
                    const st = statusLabel(row)
                    const deleted = Boolean(row.deleted_at)
                    return (
                      <tr key={row.id} style={{ borderTop: '1px solid var(--lw-border)' }}>
                        <td style={{ padding: '8px 12px', fontWeight: 500 }}>{row.name}</td>
                        <td style={{ padding: '8px 12px' }}>
                          <a
                            href={`/${row.subdomain}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: 'var(--lw-accent)', textDecoration: 'none', fontWeight: 500 }}
                          >
                            {row.subdomain}
                            <Icon name="arrowUpRight" size={12} color="var(--lw-accent)" style={{ marginLeft: 4 }} />
                          </a>
                        </td>
                        <td style={{ padding: '8px 12px', color: 'var(--lw-text-2)' }}>{row.sector}</td>
                        <td style={{ padding: '8px 12px' }}>{row.plan}</td>
                        <td style={{ padding: '8px 12px' }}>
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 600,
                              padding: '2px 8px',
                              borderRadius: 999,
                              background:
                                st.tone === 'ok'
                                  ? 'var(--lw-success-soft)'
                                  : st.tone === 'bad'
                                    ? 'rgba(220,38,38,.12)'
                                    : 'var(--lw-warning-soft)',
                              color:
                                st.tone === 'ok'
                                  ? 'var(--lw-success)'
                                  : st.tone === 'bad'
                                    ? 'var(--lw-danger)'
                                    : 'var(--lw-warning)',
                            }}
                          >
                            {st.text}
                          </span>
                        </td>
                        <td style={{ padding: '8px 12px', fontVariantNumeric: 'tabular-nums' }}>{row.total_visits}</td>
                        <td style={{ padding: '8px 12px', color: 'var(--lw-text-2)', whiteSpace: 'nowrap' }}>
                          {formatDate(row.created_at)}
                        </td>
                        <td style={{ padding: '8px 12px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                          <Btn
                            type="button"
                            kind="ghost"
                            size="sm"
                            icon="eye"
                            title="Ver detalle"
                            onClick={() => navigate(`/admin/businesses/${row.id}`)}
                          >
                            Ver
                          </Btn>
                          <Btn
                            type="button"
                            kind="ghost"
                            size="sm"
                            title={row.is_published ? 'Despublicar' : 'Publicar'}
                            disabled={deleted || togglePub.isPending}
                            onClick={() => togglePub.mutate(row.id)}
                          >
                            {row.is_published ? 'Despub.' : 'Publicar'}
                          </Btn>
                          <Btn
                            type="button"
                            kind="ghost"
                            size="sm"
                            icon="trash"
                            title="Eliminar (archivar)"
                            disabled={deleted || softDel.isPending}
                            onClick={() => confirmDelete(row)}
                          />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          {pg && pg.last_page > 1 ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
                marginTop: 16,
                flexWrap: 'wrap',
              }}
            >
              <span className="lw-small" style={{ color: 'var(--lw-text-3)' }}>
                {pg.total} resultados · página {pg.current_page} de {pg.last_page}
              </span>
              <div style={{ display: 'flex', gap: 8 }}>
                <Btn
                  type="button"
                  kind="outline"
                  size="sm"
                  disabled={pg.current_page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Anterior
                </Btn>
                <Btn
                  type="button"
                  kind="outline"
                  size="sm"
                  disabled={pg.current_page >= pg.last_page}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Siguiente
                </Btn>
              </div>
            </div>
          ) : (
            <div className="lw-small" style={{ marginTop: 12, color: 'var(--lw-text-3)' }}>
              Total: {pg?.total ?? 0}
            </div>
          )}
        </>
      )}
    </div>
  )
}
