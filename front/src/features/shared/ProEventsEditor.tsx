import { useCallback, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Btn, Card, Field, Icon, Input, Textarea } from '../../components/primitives/primitives'
import DashboardSectionHeader from '../dashboard/components/DashboardSectionHeader'
import { Modal } from '../../components/ui/Modal'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import {
  createEvent,
  deleteEvent,
  deleteEventPhoto,
  getEvents,
  updateEvent,
  uploadEventPhoto,
  type EventPayload,
} from '../../api/events'
import { keys } from '../../api/queryKeys'
import { useApiError } from '../../hooks/useApiError'
import type { Business, BusinessEvent } from '../../types/api'

const PRO_MAX = 15
const TITLE_MAX = 120
const LOCATION_MAX = 160
const DESC_MAX = 500

type FormState = {
  title: string
  event_date: string
  location: string
  description: string
}

function emptyForm(): FormState {
  return { title: '', event_date: '', location: '', description: '' }
}

function isoToDatetimeLocal(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function datetimeLocalToIso(local: string): string {
  if (!local.trim()) return ''
  const d = new Date(local)
  return Number.isNaN(d.getTime()) ? '' : d.toISOString()
}

function eventToForm(event: BusinessEvent): FormState {
  return {
    title: event.title,
    event_date: isoToDatetimeLocal(event.event_date),
    location: event.location ?? '',
    description: event.description ?? '',
  }
}

function formatEventDate(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return new Intl.DateTimeFormat('es-ES', { dateStyle: 'long', timeStyle: 'short' }).format(d)
}

export type ProEventsEditorProps = {
  isPro: boolean
  onAfterMutate?: () => void
  onboarding?: boolean
  title?: string
  subtitle?: string
  dashboardHeader?: { badgeIcon: string; badgeLabel: string }
}

export default function ProEventsEditor({
  isPro,
  onAfterMutate,
  onboarding,
  title,
  subtitle,
  dashboardHeader,
}: ProEventsEditorProps) {
  const qc = useQueryClient()
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploadTargetId, setUploadTargetId] = useState<number | null>(null)
  const [formMode, setFormMode] = useState<'none' | 'create' | 'edit'>('none')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [pendingDelete, setPendingDelete] = useState<BusinessEvent | null>(null)

  const eventsQuery = useQuery({
    queryKey: keys.dashboard.events,
    queryFn: getEvents,
    enabled: isPro,
  })

  const events = useMemo(() => {
    const list = eventsQuery.data ?? qc.getQueryData<BusinessEvent[]>(keys.dashboard.events) ?? []
    return [...list].sort(
      (a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime(),
    )
  }, [eventsQuery.data, qc])

  const atLimit = events.length >= PRO_MAX

  const patchEventsCache = useCallback(
    (updater: (prev: BusinessEvent[] | undefined) => BusinessEvent[]) => {
      const next = updater(
        qc.getQueryData<BusinessEvent[]>(keys.dashboard.events) ?? eventsQuery.data ?? [],
      ).sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime())
      qc.setQueryData(keys.dashboard.events, next)
      qc.setQueryData<Business | undefined>(keys.dashboard.business, (prev) => {
        if (!prev) return prev
        return { ...prev, events: next }
      })
      onAfterMutate?.()
    },
    [qc, eventsQuery.data, onAfterMutate],
  )

  const createMut = useMutation({
    mutationFn: (payload: EventPayload) => createEvent(payload),
    onSuccess: (created) => {
      setFormMode('none')
      setForm(emptyForm())
      patchEventsCache((prev) => [...(prev ?? []), created])
    },
  })

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<EventPayload> }) => updateEvent(id, data),
    onSuccess: (updated) => {
      setFormMode('none')
      setEditingId(null)
      setForm(emptyForm())
      patchEventsCache((prev) => (prev ?? []).map((e) => (e.id === updated.id ? updated : e)))
    },
  })

  const deleteMut = useMutation({
    mutationFn: (id: number) => deleteEvent(id),
    onSuccess: (_void, deletedId) => {
      setPendingDelete(null)
      patchEventsCache((prev) => (prev ?? []).filter((e) => e.id !== deletedId))
    },
  })

  const photoMut = useMutation({
    mutationFn: ({ id, file }: { id: number; file: File }) => uploadEventPhoto(id, file),
    onSuccess: (updated) => {
      setUploadTargetId(null)
      patchEventsCache((prev) => (prev ?? []).map((e) => (e.id === updated.id ? updated : e)))
    },
  })

  const deletePhotoMut = useMutation({
    mutationFn: (id: number) => deleteEventPhoto(id),
    onSuccess: (updated) => {
      patchEventsCache((prev) => (prev ?? []).map((e) => (e.id === updated.id ? updated : e)))
    },
  })

  const activeError =
    createMut.error ?? updateMut.error ?? deleteMut.error ?? photoMut.error ?? deletePhotoMut.error
  const { fieldErrors, generalError: mutationGeneral } = useApiError(activeError)
  const loadApi = useApiError(eventsQuery.error)
  const showLoadError = Boolean(eventsQuery.isError && events.length === 0 && !eventsQuery.isFetching)
  const generalError = mutationGeneral || (showLoadError ? loadApi.generalError : '')
  const saving =
    createMut.isPending ||
    updateMut.isPending ||
    deleteMut.isPending ||
    photoMut.isPending ||
    deletePhotoMut.isPending

  const parsePayloadFromForm = useCallback((): EventPayload | null => {
    const title = form.title.trim()
    const event_date = datetimeLocalToIso(form.event_date)
    if (!title || !event_date) return null
    return {
      title,
      event_date,
      location: form.location.trim() || null,
      description: form.description.trim() || null,
    }
  }, [form])

  const openCreate = useCallback(() => {
    if (atLimit) return
    setFormMode('create')
    setEditingId(null)
    setForm(emptyForm())
    createMut.reset()
    updateMut.reset()
  }, [atLimit, createMut, updateMut])

  const openEdit = useCallback(
    (event: BusinessEvent) => {
      setFormMode('edit')
      setEditingId(event.id)
      setForm(eventToForm(event))
      createMut.reset()
      updateMut.reset()
    },
    [createMut, updateMut],
  )

  const cancelForm = useCallback(() => {
    setFormMode('none')
    setEditingId(null)
    setForm(emptyForm())
    createMut.reset()
    updateMut.reset()
  }, [createMut, updateMut])

  const submitCreate = useCallback(() => {
    const payload = parsePayloadFromForm()
    if (!payload) return
    createMut.mutate(payload)
  }, [createMut, parsePayloadFromForm])

  const submitEdit = useCallback(() => {
    if (editingId == null) return
    const payload = parsePayloadFromForm()
    if (!payload) return
    updateMut.mutate({ id: editingId, data: payload })
  }, [editingId, parsePayloadFromForm, updateMut])

  const titleError = fieldErrors.title ?? fieldErrors.event_date ?? ''

  if (!isPro) {
    return (
      <Card padding={14} style={{ border: '1px solid #FCD34D', background: 'var(--lw-pro-soft)' }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <Icon name="lock" size={18} color="#92400E" />
          <div style={{ flex: 1, fontSize: 13, fontWeight: 600, color: '#78350F' }}>
            Los eventos son una función Pro.
          </div>
          {!onboarding ? (
            <Link to="/dashboard/account?tab=plan" style={{ textDecoration: 'none' }}>
              <Btn type="button" kind="outline" size="sm">
                Ver planes
              </Btn>
            </Link>
          ) : null}
        </div>
      </Card>
    )
  }

  const headerAside = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
      <span
        className="lw-small"
        style={{
          fontVariantNumeric: 'tabular-nums',
          color: atLimit ? 'var(--lw-dash-ink)' : 'var(--lw-dash-muted)',
          fontWeight: 600,
          fontSize: '0.71875rem',
        }}
        aria-live="polite"
      >
        {events.length} <span style={{ fontWeight: 500 }}>de {PRO_MAX} eventos</span>
      </span>
      {!atLimit ? (
        <Btn
          type="button"
          kind="primary"
          icon="plus"
          size={onboarding ? 'sm' : 'md'}
          disabled={eventsQuery.isLoading}
          onClick={openCreate}
        >
          Añadir evento
        </Btn>
      ) : null}
    </div>
  )

  return (
    <>
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0]
          e.target.value = ''
          if (file && uploadTargetId != null) photoMut.mutate({ id: uploadTargetId, file })
        }}
      />

      {dashboardHeader && title ? (
        <DashboardSectionHeader
          badgeIcon={dashboardHeader.badgeIcon}
          badgeLabel={dashboardHeader.badgeLabel}
          title={title}
          subtitle={subtitle}
          aside={headerAside}
        />
      ) : (
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            marginBottom: onboarding ? 16 : 20,
            gap: 16,
            flexWrap: 'wrap',
          }}
        >
          {title ? (
            <div>
              <h2 className="lw-h2" style={{ margin: 0, fontSize: 17 }}>
                {title}
              </h2>
              {subtitle ? (
                <p className="lw-small" style={{ marginTop: 4, fontSize: 13, color: 'var(--lw-text-2)' }}>
                  {subtitle}
                </p>
              ) : null}
            </div>
          ) : (
            <span />
          )}
          {headerAside}
        </div>
      )}

      {onboarding ? (
        <Card
          padding={14}
          style={{
            marginBottom: 16,
            border: '1px solid var(--lw-border)',
            background: 'var(--lw-bg-elev)',
            display: 'flex',
            gap: 12,
            alignItems: 'flex-start',
          }}
        >
          <Icon name="info" size={18} color="var(--lw-accent)" style={{ marginTop: 2 }} />
          <div style={{ flex: 1, fontSize: 13, color: 'var(--lw-text-2)', lineHeight: 1.5 }}>
            Puedes publicar hasta <strong>{PRO_MAX} eventos</strong> con fecha, lugar y foto.
          </div>
        </Card>
      ) : null}

      {atLimit ? (
        <Card
          padding={14}
          style={{
            marginBottom: 16,
            border: '1px solid var(--lw-border)',
            background: 'var(--lw-bg-elev)',
            display: 'flex',
            gap: 12,
            alignItems: 'center',
          }}
        >
          <Icon name="info" size={18} color="var(--lw-accent)" />
          <div style={{ flex: 1, fontSize: 13, color: 'var(--lw-text-2)', lineHeight: 1.5 }}>
            Has alcanzado el límite de <strong>{PRO_MAX} eventos</strong>.
          </div>
        </Card>
      ) : null}

      {generalError ? (
        <Card padding={12} style={{ marginBottom: 16, borderColor: 'var(--lw-danger)', background: 'rgba(220,38,38,.06)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: 'var(--lw-danger)' }}>
            <Icon name="alert" size={16} style={{ flexShrink: 0, marginTop: 1 }} />
            <span style={{ lineHeight: 1.45 }}>{generalError}</span>
          </div>
        </Card>
      ) : null}

      <Modal
        open={formMode === 'create' || formMode === 'edit'}
        onClose={cancelForm}
        title={formMode === 'create' ? 'Nuevo evento' : 'Editar evento'}
        closeOnBackdrop={!saving}
        footer={
          <>
            <Btn type="button" kind="ghost" disabled={saving} onClick={cancelForm}>
              Cancelar
            </Btn>
            <Btn
              type="button"
              kind="primary"
              loading={saving}
              onClick={formMode === 'create' ? submitCreate : submitEdit}
            >
              {formMode === 'create' ? 'Crear evento' : 'Guardar cambios'}
            </Btn>
          </>
        }
      >
        <div className="lw-modal-form">
          <Field label="Título del evento" error={titleError}>
            <Input
              value={form.title}
              maxLength={TITLE_MAX}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Ej. Noche de jazz en vivo"
              disabled={saving}
            />
          </Field>
          <Field label="Fecha y hora">
            <Input
              type="datetime-local"
              value={form.event_date}
              onChange={(e) => setForm((f) => ({ ...f, event_date: e.target.value }))}
              disabled={saving}
            />
          </Field>
          <Input
            label="Ubicación"
            labelAside={<span className="lw-modal-optional-badge">Opcional</span>}
            value={form.location}
            maxLength={LOCATION_MAX}
            onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
            placeholder="Ej. Sala principal"
            disabled={saving}
          />
          <Textarea
            label="Descripción"
            labelAside={<span className="lw-modal-optional-badge">Opcional</span>}
            value={form.description}
            maxLength={DESC_MAX}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            placeholder="Detalles del evento, entradas, artistas…"
            rows={4}
            disabled={saving}
          />
        </div>
      </Modal>

      <ConfirmDialog
        open={pendingDelete !== null}
        onCancel={() => {
          if (!deleteMut.isPending) setPendingDelete(null)
        }}
        onConfirm={() => {
          if (pendingDelete) deleteMut.mutate(pendingDelete.id)
        }}
        title="¿Eliminar este evento?"
        description={
          pendingDelete
            ? `Se borrará «${pendingDelete.title}» y su foto asociada.`
            : undefined
        }
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        loading={deleteMut.isPending}
      />

      {eventsQuery.isLoading ? (
        <div className="lw-shimmer" style={{ height: 120, borderRadius: 12 }} />
      ) : events.length === 0 ? (
        <Card padding={24} style={{ textAlign: 'center', color: 'var(--lw-text-3)' }}>
          <p style={{ margin: 0 }}>Aún no hay eventos. Pulsa «Añadir evento» para crear el primero.</p>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {events.map((event) => (
            <Card
              key={event.id}
              padding={16}
              style={{ display: 'flex', gap: 14, alignItems: 'flex-start', flexWrap: 'wrap' }}
            >
              <div
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 10,
                  overflow: 'hidden',
                  border: '1px solid var(--lw-border)',
                  background: 'var(--lw-surface)',
                  flexShrink: 0,
                }}
              >
                {event.image_url ? (
                  <img
                    src={event.image_url}
                    alt=""
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      display: 'grid',
                      placeItems: 'center',
                      color: 'var(--lw-text-3)',
                      fontSize: 11,
                    }}
                  >
                    Sin foto
                  </div>
                )}
              </div>
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 4 }}>{event.title}</div>
                <div
                  className="lw-small"
                  style={{ color: 'var(--lw-accent)', fontWeight: 600, marginBottom: 6 }}
                >
                  {formatEventDate(event.event_date)}
                </div>
                {event.location ? (
                  <p className="lw-small" style={{ margin: '0 0 4px', color: 'var(--lw-text-2)' }}>
                    {event.location}
                  </p>
                ) : null}
                {event.description ? (
                  <p
                    className="lw-small"
                    style={{
                      margin: 0,
                      color: 'var(--lw-text-2)',
                      lineHeight: 1.5,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {event.description}
                  </p>
                ) : null}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
                  <Btn
                    type="button"
                    kind="ghost"
                    size="sm"
                    disabled={saving}
                    onClick={() => {
                      setUploadTargetId(event.id)
                      fileRef.current?.click()
                    }}
                  >
                    {event.image_url ? 'Cambiar foto' : 'Subir foto'}
                  </Btn>
                  {event.image_url ? (
                    <Btn
                      type="button"
                      kind="ghost"
                      size="sm"
                      disabled={saving}
                      onClick={() => deletePhotoMut.mutate(event.id)}
                    >
                      Quitar foto
                    </Btn>
                  ) : null}
                  <Btn
                    type="button"
                    kind="outline"
                    size="sm"
                    icon="edit"
                    disabled={saving}
                    onClick={() => openEdit(event)}
                  >
                    Editar
                  </Btn>
                  <Btn
                    type="button"
                    kind="danger"
                    size="sm"
                    icon="trash"
                    disabled={saving}
                    onClick={() => setPendingDelete(event)}
                  >
                    Eliminar
                  </Btn>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  )
}
