import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useCallback, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  fetchAdminBusiness,
  fetchAdminTemplates,
  forceDeleteAdminBusiness,
  patchAdminBusiness,
  restoreAdminBusiness,
} from '../../api/admin'
import { keys } from '../../api/queryKeys'
import type { AdminBusinessImageRow, AdminBusinessServiceRow, AdminBusinessShow } from '../../types/api'
import { Btn, Card, Field, Icon, Input, Textarea } from '../../components/primitives/primitives'
import Select from '../../components/primitives/Select'
import { useToast } from '../../components/ui/Toast'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { ADMIN_SECTOR_FORM_OPTIONS } from './sectors'

type TabId = 'general' | 'media' | 'stats' | 'billing' | 'owner'

function isoToLocalInput(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`
}

function localInputToIso(v: string): string | null {
  if (!v.trim()) return null
  const d = new Date(v)
  return Number.isNaN(d.getTime()) ? null : d.toISOString()
}

type DraftState = {
  name: string
  subdomain: string
  subdomain_type: string
  sector: string
  template_id: string
  description: string
  tagline: string
  phone: string
  address: string
  google_maps_url: string
  google_business_url: string
  booking_url: string
  instagram_url: string
  tiktok_url: string
  facebook_url: string
  vcard_enabled: boolean
  is_published: boolean
  plan: string
  scheduleJson: string
  planActivatedLocal: string
  onboardingCompletedLocal: string
}

function buildDraft(b: AdminBusinessShow): DraftState {
  return {
    name: b.name ?? '',
    subdomain: b.subdomain ?? '',
    subdomain_type: b.subdomain_type ?? 'random',
    sector: b.sector ?? '',
    template_id: b.template_id != null ? String(b.template_id) : '',
    description: b.description ?? '',
    tagline: b.tagline ?? '',
    phone: b.phone ?? '',
    address: b.address ?? '',
    google_maps_url: b.google_maps_url ?? '',
    google_business_url: b.google_business_url ?? '',
    booking_url: b.booking_url ?? '',
    instagram_url: b.instagram_url ?? '',
    tiktok_url: b.tiktok_url ?? '',
    facebook_url: b.facebook_url ?? '',
    vcard_enabled: Boolean(b.vcard_enabled),
    is_published: Boolean(b.is_published),
    plan: b.plan ?? 'free',
    scheduleJson: b.schedule ? JSON.stringify(b.schedule, null, 2) : '',
    planActivatedLocal: isoToLocalInput(b.plan_activated_at),
    onboardingCompletedLocal: isoToLocalInput(b.onboarding_completed_at),
  }
}

const PLAN_FORM = [
  { value: 'free', label: 'Free' },
  { value: 'pro', label: 'Pro' },
  { value: 'pending', label: 'Pending' },
]

const SUBDOMAIN_TYPE = [
  { value: 'random', label: 'Aleatorio' },
  { value: 'custom', label: 'Personalizado' },
]

export default function AdminBusinessDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { showToast } = useToast()
  const numericId = Number(id)

  const [tab, setTab] = useState<TabId>('general')
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState<DraftState | null>(null)
  const [restoreConfirmOpen, setRestoreConfirmOpen] = useState(false)
  const [forceDeleteConfirmOpen, setForceDeleteConfirmOpen] = useState(false)

  const businessQuery = useQuery({
    queryKey: keys.admin.business(numericId),
    queryFn: () => fetchAdminBusiness(numericId),
    enabled: Number.isFinite(numericId) && numericId > 0,
  })

  const templatesQuery = useQuery({
    queryKey: keys.admin.templates,
    queryFn: async () => {
      const r = await fetchAdminTemplates()
      return r.templates
    },
  })

  const b = businessQuery.data?.business

  const saveMutation = useMutation({
    mutationFn: (body: Record<string, unknown>) => patchAdminBusiness(numericId, body),
    onSuccess: (res) => {
      qc.setQueryData(keys.admin.business(numericId), res)
      showToast({
        type: 'success',
        title: 'Cambios guardados',
        description: 'Los datos del negocio se han actualizado.',
      })
      setEditing(false)
      setDraft(null)
      void qc.invalidateQueries({ queryKey: ['admin', 'businesses'] })
    },
    // `vars` es el mismo `payload` que llegó a `mutationFn`. Reintentar en el toast =
    // re-disparar la mutación con el cuerpo original sin que el usuario tenga que volver
    // a tocar el formulario.
    onError: (_err, vars) =>
      showToast({
        type: 'error',
        title: 'No se pudo guardar',
        description: 'Inténtalo de nuevo o revisa los campos marcados.',
        action: { label: 'Reintentar', onClick: () => saveMutation.mutate(vars) },
      }),
  })

  const restoreMut = useMutation({
    mutationFn: () => restoreAdminBusiness(numericId),
    onSuccess: () => {
      showToast('Negocio restaurado', 'success')
      void qc.invalidateQueries({ queryKey: keys.admin.business(numericId) })
      void qc.invalidateQueries({ queryKey: ['admin', 'businesses'] })
    },
    onError: () => showToast('No se pudo restaurar', 'error'),
  })

  const forceMut = useMutation({
    mutationFn: () => forceDeleteAdminBusiness(numericId),
    onSuccess: () => {
      showToast({
        type: 'success',
        title: 'Negocio eliminado',
        description: 'Acción permanente. No se puede deshacer.',
      })
      void qc.invalidateQueries({ queryKey: ['admin', 'businesses'] })
      navigate('/admin/businesses', { replace: true })
    },
    onError: () => showToast('No se pudo eliminar', 'error'),
  })

  const startEdit = useCallback(() => {
    if (!b) return
    setDraft(buildDraft(b))
    setEditing(true)
  }, [b])

  const cancelEdit = useCallback(() => {
    setEditing(false)
    setDraft(null)
  }, [])

  function submitEdit() {
    if (!draft) return
    let schedule: unknown = null
    if (draft.scheduleJson.trim()) {
      try {
        schedule = JSON.parse(draft.scheduleJson)
      } catch {
        showToast({
          type: 'error',
          title: 'Horarios: JSON inválido',
          description: 'Revisa la sintaxis del bloque de horarios y vuelve a guardar.',
        })
        return
      }
    }

    const templateId = draft.template_id ? Number(draft.template_id) : null
    const payload: Record<string, unknown> = {
      name: draft.name,
      subdomain: draft.subdomain,
      subdomain_type: draft.subdomain_type,
      sector: draft.sector,
      template_id: templateId,
      description: draft.description || null,
      tagline: draft.tagline || null,
      phone: draft.phone || null,
      address: draft.address || null,
      google_maps_url: draft.google_maps_url || null,
      google_business_url: draft.google_business_url || null,
      booking_url: draft.booking_url || null,
      instagram_url: draft.instagram_url || null,
      tiktok_url: draft.tiktok_url || null,
      facebook_url: draft.facebook_url || null,
      vcard_enabled: draft.vcard_enabled,
      is_published: draft.is_published,
      plan: draft.plan,
      schedule,
      plan_activated_at: localInputToIso(draft.planActivatedLocal),
      onboarding_completed_at: localInputToIso(draft.onboardingCompletedLocal),
    }

    saveMutation.mutate(payload)
  }

  if (!Number.isFinite(numericId) || numericId <= 0) {
    return <p>ID no válido.</p>
  }

  if (businessQuery.isLoading) {
    return <div className="lw-shimmer" style={{ height: 280, borderRadius: 12 }} />
  }

  if (businessQuery.isError || !b) {
    return (
      <div>
        <p style={{ color: 'var(--lw-danger)' }}>No se encontró el negocio.</p>
        <Link to="/admin/businesses">
          <Btn type="button" kind="outline" style={{ marginTop: 12 }}>
            Volver al listado
          </Btn>
        </Link>
      </div>
    )
  }

  const deleted = Boolean(b.deleted_at)
  const visitCounts = b.visit_counts ?? {}
  const statBars = [
    { name: 'Visitas', value: visitCounts.visit ?? 0 },
    { name: 'WhatsApp', value: visitCounts.whatsapp_click ?? 0 },
    { name: 'Teléfono', value: visitCounts.phone_click ?? 0 },
  ]

  const templateOpts =
    templatesQuery.data?.map((t) => ({
      value: String(t.id),
      label: `${t.name}${t.is_active ? '' : ' (inactiva)'}`,
    })) ?? []

  const tabs: { id: TabId; label: string }[] = [
    { id: 'general', label: 'General' },
    { id: 'media', label: 'Imágenes y servicios' },
    { id: 'stats', label: 'Estadísticas' },
    { id: 'billing', label: 'Suscripción' },
    { id: 'owner', label: 'Titular' },
  ]

  const d = editing && draft ? draft : buildDraft(b)
  const readOnly = !editing || deleted
  const setField = <K extends keyof DraftState>(key: K, value: DraftState[K]) => {
    if (!draft) return
    setDraft({ ...draft, [key]: value })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <Link to="/admin/businesses" style={{ fontSize: 13, color: 'var(--lw-accent)', textDecoration: 'none' }}>
          ← Negocios
        </Link>
        <a
          href={`/${b.subdomain}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{ fontSize: 13, color: 'var(--lw-accent)', fontWeight: 500 }}
        >
          Ver página pública <Icon name="arrowUpRight" size={14} color="var(--lw-accent)" />
        </a>
      </div>

      {deleted ? (
        <div
          style={{
            padding: '14px 16px',
            borderRadius: 'var(--lw-r-sm)',
            background: 'rgba(220,38,38,.12)',
            border: '1px solid rgba(220,38,38,.35)',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: 12,
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Icon name="alert" size={18} color="var(--lw-danger)" />
            <span style={{ fontWeight: 600, color: 'var(--lw-danger)' }}>
              Este negocio está eliminado (papelera). Restaura para reactivarlo o bórralo para siempre.
            </span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Btn
              type="button"
              kind="success"
              size="sm"
              loading={restoreMut.isPending}
              onClick={() => setRestoreConfirmOpen(true)}
            >
              Restaurar
            </Btn>
            <Btn
              type="button"
              kind="danger"
              size="sm"
              loading={forceMut.isPending}
              onClick={() => setForceDeleteConfirmOpen(true)}
            >
              Eliminar permanentemente
            </Btn>
          </div>
        </div>
      ) : null}

      <Card padding={16}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <h2 style={{ margin: '0 0 6px', fontSize: 22 }}>{b.name}</h2>
            <div className="lw-small" style={{ color: 'var(--lw-text-2)' }}>
              {b.subdomain} · {b.sector} · plan {b.plan}
            </div>
          </div>
          {tab === 'general' && !deleted ? (
            <div style={{ display: 'flex', gap: 8 }}>
              {!editing ? (
                <Btn type="button" kind="outline" icon="edit" onClick={startEdit}>
                  Editar
                </Btn>
              ) : (
                <>
                  <Btn type="button" kind="ghost" onClick={cancelEdit}>
                    Cancelar
                  </Btn>
                  <Btn type="button" kind="primary" loading={saveMutation.isPending} onClick={submitEdit}>
                    Guardar
                  </Btn>
                </>
              )}
            </div>
          ) : null}
        </div>

        <div style={{ display: 'flex', gap: 6, marginTop: 16, flexWrap: 'wrap', borderBottom: '1px solid var(--lw-border)', paddingBottom: 8 }}>
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              style={{
                padding: '8px 12px',
                borderRadius: 'var(--lw-r-sm)',
                border: 'none',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 600,
                background: tab === t.id ? 'var(--lw-surface)' : 'transparent',
                color: tab === t.id ? 'var(--lw-text)' : 'var(--lw-text-3)',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div style={{ marginTop: 18 }}>
          {tab === 'general' ? (
            <GeneralTab
              business={b}
              draft={d}
              readOnly={readOnly}
              setField={readOnly ? undefined : setField}
              templateOptions={[{ value: '', label: '— Sin plantilla —' }, ...templateOpts]}
            />
          ) : null}

          {tab === 'media' ? <MediaTab business={b} /> : null}

          {tab === 'stats' ? (
            <div>
              <p className="lw-small" style={{ marginBottom: 12, color: 'var(--lw-text-3)' }}>
                Total de eventos en page_visits por tipo.
              </p>
              <div style={{ width: '100%', height: 260 }}>
                <ResponsiveContainer>
                  <BarChart data={statBars} margin={{ top: 8, right: 12, left: 4, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--lw-border)" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="var(--lw-text-3)" />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="var(--lw-text-3)" width={44} />
                    <Tooltip
                      contentStyle={{
                        background: 'var(--lw-bg-elev)',
                        border: '1px solid var(--lw-border)',
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                    />
                    <Bar dataKey="value" fill="var(--lw-accent)" radius={[6, 6, 0, 0]} maxBarSize={48} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : null}

          {tab === 'billing' ? (
            <div style={{ fontSize: 14 }}>
              <p>
                <strong>Plan:</strong> {b.plan}
              </p>
              <p style={{ marginTop: 8 }}>
                <strong>Plan activado:</strong>{' '}
                {b.plan_activated_at
                  ? new Date(b.plan_activated_at).toLocaleString('es-ES')
                  : '—'}
              </p>
              <p className="lw-small" style={{ marginTop: 12, color: 'var(--lw-text-3)' }}>
                Para cambiar plan o fechas usa la pestaña General en modo edición.
              </p>
            </div>
          ) : null}

          {tab === 'owner' ? (
            <div style={{ fontSize: 14 }}>
              {b.owner ? (
                <>
                  <p>
                    <strong>Nombre:</strong> {b.owner.name}
                  </p>
                  <p style={{ marginTop: 8 }}>
                    <strong>Email:</strong> {b.owner.email}
                  </p>
                  <p style={{ marginTop: 8 }}>
                    <strong>ID usuario:</strong> {b.owner.id}
                  </p>
                </>
              ) : (
                <p style={{ color: 'var(--lw-text-3)' }}>Sin titular vinculado.</p>
              )}
            </div>
          ) : null}
        </div>
      </Card>

      <ConfirmDialog
        open={restoreConfirmOpen}
        onCancel={() => setRestoreConfirmOpen(false)}
        onConfirm={() => {
          setRestoreConfirmOpen(false)
          restoreMut.mutate()
        }}
        title="Restaurar negocio"
        description="El negocio saldrá de la papelera y volverá a estar operativo. Podrás volver a publicarlo desde su detalle."
        confirmLabel="Restaurar"
        tone="default"
        loading={restoreMut.isPending}
      />

      <ConfirmDialog
        open={forceDeleteConfirmOpen}
        onCancel={() => setForceDeleteConfirmOpen(false)}
        onConfirm={() => {
          setForceDeleteConfirmOpen(false)
          forceMut.mutate()
        }}
        title="Eliminar permanentemente"
        description={
          <p className="lw-small" style={{ margin: 0, lineHeight: 1.55 }}>
            Vas a borrar de forma permanente el negocio <strong>{b.name}</strong>. Se eliminarán todos sus archivos, imágenes, visitas y datos relacionados. <strong>Esta acción no se puede deshacer.</strong>
          </p>
        }
        confirmLabel="Eliminar permanentemente"
        tone="destructive"
        destructiveConfirmWord="ELIMINAR"
        loading={forceMut.isPending}
      />
    </div>
  )
}

function GeneralTab({
  business,
  draft,
  readOnly,
  setField,
  templateOptions,
}: {
  business: AdminBusinessShow
  draft: DraftState
  readOnly: boolean
  setField?: <K extends keyof DraftState>(key: K, value: DraftState[K]) => void
  templateOptions: { value: string; label: string }[]
}) {
  const ro = readOnly || !setField

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
      <Field label="Nombre">
        <Input
          value={draft.name}
          disabled={ro}
          onChange={(e) => setField?.('name', e.target.value)}
        />
      </Field>
      <Field label="Subdominio">
        <Input
          value={draft.subdomain}
          disabled={ro}
          onChange={(e) => setField?.('subdomain', e.target.value)}
        />
      </Field>
      <Select
        label="Tipo subdominio"
        value={draft.subdomain_type}
        disabled={ro}
        onChange={(e) => setField?.('subdomain_type', e.target.value)}
        options={SUBDOMAIN_TYPE}
      />
      <Select
        label="Sector"
        value={draft.sector}
        disabled={ro}
        onChange={(e) => setField?.('sector', e.target.value)}
        options={ADMIN_SECTOR_FORM_OPTIONS}
      />
      <Select
        label="Plantilla"
        value={draft.template_id}
        disabled={ro}
        onChange={(e) => setField?.('template_id', e.target.value)}
        options={templateOptions}
      />
      <Select
        label="Plan"
        value={draft.plan}
        disabled={ro}
        onChange={(e) => setField?.('plan', e.target.value)}
        options={PLAN_FORM}
      />
      <Field label="Publicado">
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
          <input
            type="checkbox"
            checked={draft.is_published}
            disabled={ro}
            onChange={(e) => setField?.('is_published', e.target.checked)}
          />
          Visible en la web
        </label>
      </Field>
      <Field label="vCard">
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
          <input
            type="checkbox"
            checked={draft.vcard_enabled}
            disabled={ro}
            onChange={(e) => setField?.('vcard_enabled', e.target.checked)}
          />
          Activado
        </label>
      </Field>
      <div style={{ gridColumn: '1 / -1' }}>
        <Field label="Tagline">
          <Input value={draft.tagline} disabled={ro} onChange={(e) => setField?.('tagline', e.target.value)} />
        </Field>
      </div>
      <div style={{ gridColumn: '1 / -1' }}>
        <Field label="Descripción">
          <Textarea value={draft.description} disabled={ro} onChange={(e) => setField?.('description', e.target.value)} rows={4} />
        </Field>
      </div>
      <Field label="Teléfono">
        <Input value={draft.phone} disabled={ro} onChange={(e) => setField?.('phone', e.target.value)} />
      </Field>
      <div style={{ gridColumn: '1 / -1' }}>
        <Field label="Dirección">
          <Input value={draft.address} disabled={ro} onChange={(e) => setField?.('address', e.target.value)} />
        </Field>
      </div>
      <div style={{ gridColumn: '1 / -1', fontSize: 12, color: 'var(--lw-text-3)' }}>
        Coordenadas (solo lectura): {business.lat ?? '—'}, {business.lng ?? '—'}
      </div>
      <Field label="Plan activado (local)">
        <Input
          type="datetime-local"
          value={draft.planActivatedLocal}
          disabled={ro}
          onChange={(e) => setField?.('planActivatedLocal', e.target.value)}
        />
      </Field>
      <Field label="Onboarding completado (local)">
        <Input
          type="datetime-local"
          value={draft.onboardingCompletedLocal}
          disabled={ro}
          onChange={(e) => setField?.('onboardingCompletedLocal', e.target.value)}
        />
      </Field>
      <div style={{ gridColumn: '1 / -1' }}>
        <Field label="Horarios (JSON)">
          <Textarea value={draft.scheduleJson} disabled={ro} onChange={(e) => setField?.('scheduleJson', e.target.value)} rows={8} />
        </Field>
      </div>
      <div style={{ gridColumn: '1 / -1' }}>
        <Field label="Google Maps URL">
          <Input
            value={draft.google_maps_url}
            disabled={ro}
            onChange={(e) => setField?.('google_maps_url', e.target.value)}
          />
        </Field>
      </div>
      <div style={{ gridColumn: '1 / -1' }}>
        <Field label="Google Negocio URL">
          <Input
            value={draft.google_business_url}
            disabled={ro}
            onChange={(e) => setField?.('google_business_url', e.target.value)}
          />
        </Field>
      </div>
      <div style={{ gridColumn: '1 / -1' }}>
        <Field label="Reservas URL">
          <Input value={draft.booking_url} disabled={ro} onChange={(e) => setField?.('booking_url', e.target.value)} />
        </Field>
      </div>
      <div style={{ gridColumn: '1 / -1' }}>
        <Field label="Instagram">
          <Input value={draft.instagram_url} disabled={ro} onChange={(e) => setField?.('instagram_url', e.target.value)} />
        </Field>
      </div>
      <div style={{ gridColumn: '1 / -1' }}>
        <Field label="TikTok">
          <Input value={draft.tiktok_url} disabled={ro} onChange={(e) => setField?.('tiktok_url', e.target.value)} />
        </Field>
      </div>
      <div style={{ gridColumn: '1 / -1' }}>
        <Field label="Facebook">
          <Input value={draft.facebook_url} disabled={ro} onChange={(e) => setField?.('facebook_url', e.target.value)} />
        </Field>
      </div>
    </div>
  )
}

function MediaTab({ business }: { business: AdminBusinessShow }) {
  const images = business.images ?? {}
  const services = business.services ?? []

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <div style={{ fontWeight: 600, marginBottom: 10 }}>Imágenes</div>
        {Object.keys(images).length === 0 ? (
          <p className="lw-small" style={{ color: 'var(--lw-text-3)' }}>
            Sin imágenes.
          </p>
        ) : (
          Object.entries(images).map(([section, rows]) => (
            <div key={section} style={{ marginBottom: 16 }}>
              <div className="lw-small" style={{ marginBottom: 8, fontWeight: 600, textTransform: 'capitalize' }}>
                {section}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                {(rows as AdminBusinessImageRow[]).map((img) => (
                  <a
                    key={img.id}
                    href={img.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'block',
                      width: 96,
                      height: 96,
                      borderRadius: 8,
                      overflow: 'hidden',
                      border: '1px solid var(--lw-border)',
                      background: 'var(--lw-surface)',
                    }}
                  >
                    <img src={img.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </a>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      <div>
        <div style={{ fontWeight: 600, marginBottom: 10 }}>Servicios</div>
        {services.length === 0 ? (
          <p className="lw-small" style={{ color: 'var(--lw-text-3)' }}>
            Sin servicios.
          </p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--lw-border)', textAlign: 'left' }}>
                  <th style={{ padding: 8 }}>Nombre</th>
                  <th style={{ padding: 8 }}>Precio</th>
                  <th style={{ padding: 8 }}>Descripción</th>
                  <th style={{ padding: 8 }}>Orden</th>
                </tr>
              </thead>
              <tbody>
                {(services as AdminBusinessServiceRow[]).map((s) => (
                  <tr key={s.id} style={{ borderBottom: '1px solid var(--lw-border)' }}>
                    <td style={{ padding: 8 }}>{s.name}</td>
                    <td style={{ padding: 8 }}>{s.price != null ? String(s.price) : '—'}</td>
                    <td style={{ padding: 8, color: 'var(--lw-text-2)' }}>{s.description ?? '—'}</td>
                    <td style={{ padding: 8 }}>{s.display_order}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
