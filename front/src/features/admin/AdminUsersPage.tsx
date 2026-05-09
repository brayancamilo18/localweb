import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { useMemo, useState } from 'react'
import { fetchAdminUsers, resendAdminUserVerification } from '../../api/admin'
import { keys } from '../../api/queryKeys'
import type { AdminUserRow } from '../../types/api'
import { Btn, Card, Icon, Input } from '../../components/primitives/primitives'
import { useToast } from '../../components/ui/Toast'

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

export default function AdminUsersPage() {
  const qc = useQueryClient()
  const { showToast } = useToast()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const params = useMemo(
    () => ({
      page,
      per_page: 15,
      search: search.trim() || undefined,
    }),
    [page, search],
  )

  const { data, isLoading, isError } = useQuery({
    queryKey: keys.admin.users(params),
    queryFn: () => fetchAdminUsers(params),
  })

  const resend = useMutation({
    mutationFn: (userId: number) => resendAdminUserVerification(userId),
    onSuccess: () => {
      showToast({
        type: 'success',
        title: 'Correo de verificación enviado',
        description: 'El usuario lo recibirá en unos minutos.',
      })
      void qc.invalidateQueries({ queryKey: ['admin', 'users'] })
    },
    onError: () => showToast('No se pudo reenviar el correo', 'error'),
  })

  const pg = data?.pagination
  const items = data?.items ?? []

  return (
    <div>
      <div style={{ marginBottom: 16, maxWidth: 400 }}>
        <label className="lw-small" style={{ display: 'block', marginBottom: 6 }}>
          Buscar por nombre o email
        </label>
        <Input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(1)
          }}
          placeholder="Nombre o email"
          prefix={<Icon name="search" size={16} color="var(--lw-text-3)" />}
        />
      </div>

      {isLoading ? (
        <div className="lw-shimmer" style={{ height: 220, borderRadius: 12 }} />
      ) : isError ? (
        <p style={{ color: 'var(--lw-danger)' }}>Error al cargar usuarios.</p>
      ) : (
        <>
          <Card padding={0} style={{ overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: 'var(--lw-surface)', textAlign: 'left' }}>
                    <th style={{ padding: '12px 14px', fontWeight: 600 }}>Nombre</th>
                    <th style={{ padding: '12px 14px', fontWeight: 600 }}>Email</th>
                    <th style={{ padding: '12px 14px', fontWeight: 600 }}>Rol</th>
                    <th style={{ padding: '12px 14px', fontWeight: 600 }}>Negocio</th>
                    <th style={{ padding: '12px 14px', fontWeight: 600 }}>Registro</th>
                    <th style={{ padding: '12px 14px', fontWeight: 600, textAlign: 'right' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((row: AdminUserRow) => (
                    <tr key={row.id} style={{ borderTop: '1px solid var(--lw-border)' }}>
                      <td style={{ padding: '10px 14px', fontWeight: 500 }}>{row.name}</td>
                      <td style={{ padding: '10px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <span style={{ color: 'var(--lw-text)' }}>{row.email}</span>
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 700,
                              letterSpacing: '0.04em',
                              textTransform: 'uppercase',
                              padding: '2px 8px',
                              borderRadius: 999,
                              background: row.email_verified_at ? 'var(--lw-success-soft)' : 'var(--lw-warning-soft)',
                              color: row.email_verified_at ? 'var(--lw-success)' : 'var(--lw-warning)',
                            }}
                          >
                            {row.email_verified_at ? 'Verificado' : 'Sin verificar'}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        {row.is_admin ? (
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 600,
                              padding: '3px 10px',
                              borderRadius: 999,
                              background: 'rgba(59,130,246,.12)',
                              color: 'var(--lw-accent)',
                            }}
                          >
                            Admin
                          </span>
                        ) : (
                          <span style={{ color: 'var(--lw-text-3)', fontSize: 13 }}>—</span>
                        )}
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        {row.business ? (
                          <Link
                            to={`/admin/businesses/${row.business.id}`}
                            style={{
                              color: 'var(--lw-accent)',
                              fontWeight: 500,
                              textDecoration: 'none',
                            }}
                          >
                            {row.business.name}
                            <span style={{ display: 'block', fontSize: 11, color: 'var(--lw-text-3)', marginTop: 2 }}>
                              {row.business.subdomain}
                            </span>
                          </Link>
                        ) : (
                          <span style={{ color: 'var(--lw-text-4)' }}>—</span>
                        )}
                      </td>
                      <td style={{ padding: '10px 14px', color: 'var(--lw-text-2)', whiteSpace: 'nowrap' }}>
                        {formatDate(row.created_at)}
                      </td>
                      <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                        {!row.email_verified_at ? (
                          <Btn
                            type="button"
                            kind="outline"
                            size="sm"
                            icon="mail"
                            loading={resend.isPending && resend.variables === row.id}
                            onClick={() => resend.mutate(row.id)}
                          >
                            Reenviar verificación
                          </Btn>
                        ) : (
                          <span className="lw-small" style={{ color: 'var(--lw-text-4)' }}>
                            —
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
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
                {pg.total} usuarios · página {pg.current_page} de {pg.last_page}
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
