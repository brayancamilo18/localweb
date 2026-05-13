import { useCallback, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Btn, Card, Field, Icon, Input, Textarea } from '../../components/primitives/primitives'
import {
  createService,
  deleteService,
  getServices,
  updateService,
  type CreateServicePayload,
  type UpdateServicePayload,
} from '../../api/services'
import { keys } from '../../api/queryKeys'
import { useApiError } from '../../hooks/useApiError'
import type { BusinessService } from '../../types/api'

const FREE_MAX = 3
const PRO_MAX = 15

function formatPrice(price: BusinessService['price']): string {
  if (price === null || price === undefined) return 'Consultar'
  const n = typeof price === 'string' ? Number.parseFloat(price) : price
  if (Number.isNaN(n)) return 'Consultar'
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(n)
}

type FormState = {
  name: string
  price: string
  description: string
}

const emptyForm = (): FormState => ({ name: '', price: '', description: '' })

function serviceToForm(s: BusinessService): FormState {
  return {
    name: s.name,
    price: s.price != null ? String(s.price) : '',
    description: s.description ?? '',
  }
}

export type ProServicesEditorProps = {
  /** Plan Pro activo (en onboarding tras pago, siempre true). */
  isPro: boolean
  /** Tras crear/editar/borrar servicio. */
  onAfterMutate?: () => void
  /** Oculta avisos de plan Gratis y enlaces a billing (p. ej. paso onboarding). */
  onboarding?: boolean
  /** Cabecera del bloque (dashboard). Si se omite y onboarding, solo se muestra la barra de acciones. */
  title?: string
  subtitle?: string
}

export default function ProServicesEditor({
  isPro,
  onAfterMutate,
  onboarding,
  title,
  subtitle,
}: ProServicesEditorProps) {
  const qc = useQueryClient()

  const [formMode, setFormMode] = useState<'none' | 'create' | 'edit'>('none')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm())

  const servicesQuery = useQuery({
    queryKey: keys.dashboard.services,
    queryFn: getServices,
  })

  const services = servicesQuery.data ?? []
  const freeAtLimit = !isPro && services.length >= FREE_MAX
  const proAtLimit = isPro && services.length >= PRO_MAX
  const atLimit = freeAtLimit || proAtLimit

  const patchServicesCache = useCallback(
    (updater: (prev: BusinessService[] | undefined) => BusinessService[]) => {
      qc.setQueryData(keys.dashboard.services, updater)
      onAfterMutate?.()
    },
    [qc, onAfterMutate],
  )

  const createMut = useMutation({
    mutationFn: (payload: CreateServicePayload) => createService(payload),
    onSuccess: (created) => {
      setFormMode('none')
      setForm(emptyForm())
      patchServicesCache((prev) =>
        [...(prev ?? []), created].sort((a, b) => a.id - b.id),
      )
    },
  })

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateServicePayload }) => updateService(id, data),
    onSuccess: (updated) => {
      setFormMode('none')
      setEditingId(null)
      setForm(emptyForm())
      patchServicesCache((prev) => (prev ?? []).map((s) => (s.id === updated.id ? updated : s)))
    },
  })

  const deleteMut = useMutation({
    mutationFn: (id: number) => deleteService(id),
    onSuccess: (_void, deletedId) => {
      patchServicesCache((prev) => (prev ?? []).filter((s) => s.id !== deletedId))
    },
  })

  const activeError = createMut.error ?? updateMut.error ?? deleteMut.error
  const { fieldErrors, generalError: mutationGeneral } = useApiError(activeError)
  const loadApi = useApiError(servicesQuery.error)
  const showServicesLoadError = Boolean(
    servicesQuery.isError && services.length === 0 && !servicesQuery.isFetching,
  )
  const generalError = mutationGeneral || (showServicesLoadError ? loadApi.generalError : '')
  const saving = createMut.isPending || updateMut.isPending || deleteMut.isPending

  const openCreate = useCallback(() => {
    if (atLimit) return
    setFormMode('create')
    setEditingId(null)
    setForm(emptyForm())
    createMut.reset()
    updateMut.reset()
  }, [atLimit, createMut, updateMut])

  const openEdit = useCallback(
    (s: BusinessService) => {
      setFormMode('edit')
      setEditingId(s.id)
      setForm(serviceToForm(s))
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

  const parsePayloadFromForm = useCallback((): CreateServicePayload => {
    const name = form.name.trim()
    const priceRaw = form.price.trim()
    const description = form.description.trim() || null
    let price: number | null = null
    if (priceRaw !== '') {
      const n = Number.parseFloat(priceRaw.replace(',', '.'))
      price = Number.isNaN(n) ? null : n
    }
    return { name, price, description }
  }, [form])

  const submitCreate = useCallback(() => {
    const payload = parsePayloadFromForm()
    if (!payload.name) return
    createMut.mutate(payload)
  }, [createMut, parsePayloadFromForm])

  const submitEdit = useCallback(() => {
    if (editingId == null) return
    const payload = parsePayloadFromForm()
    if (!payload.name) return
    const data: UpdateServicePayload = {
      name: payload.name,
      price: payload.price,
      description: payload.description,
    }
    updateMut.mutate({ id: editingId, data })
  }, [editingId, parsePayloadFromForm, updateMut])

  const onDelete = useCallback(
    (s: BusinessService) => {
      if (!window.confirm(`¿Eliminar el servicio «${s.name}»?`)) return
      deleteMut.mutate(s.id)
    },
    [deleteMut],
  )

  const nameError = useMemo(() => fieldErrors.name ?? '', [fieldErrors])

  const planMax = isPro ? PRO_MAX : FREE_MAX

  return (
    <>
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
            <h1 className="lw-h2" style={{ margin: 0 }}>
              {title}
            </h1>
            {subtitle ? (
              <p className="lw-small" style={{ marginTop: 4, fontSize: 13, color: 'var(--lw-text-2)' }}>
                {subtitle}
              </p>
            ) : null}
          </div>
        ) : (
          <span />
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <span
            className="lw-small"
            style={{
              fontVariantNumeric: 'tabular-nums',
              color: atLimit ? 'var(--lw-text)' : 'var(--lw-text-2)',
              fontWeight: 600,
            }}
            aria-live="polite"
          >
            {services.length} <span style={{ fontWeight: 500 }}>de {planMax} servicios</span>
          </span>
          {!proAtLimit ? (
            <Btn
              type="button"
              kind="primary"
              icon="plus"
              size={onboarding ? 'sm' : 'md'}
              disabled={freeAtLimit || servicesQuery.isLoading}
              onClick={() => (formMode === 'create' ? cancelForm() : openCreate())}
            >
              {formMode === 'create' ? (onboarding ? 'Cerrar' : 'Cerrar formulario') : 'Añadir servicio'}
            </Btn>
          ) : null}
        </div>
      </div>

      {onboarding && isPro ? (
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
            Con tu plan <strong>Pro</strong> puedes publicar hasta <strong>{PRO_MAX} servicios</strong>. Añade los que quieras
            ahora; siempre podrás editarlos desde el dashboard.
          </div>
        </Card>
      ) : null}

      {onboarding && proAtLimit ? (
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
            Has alcanzado el límite de <strong>{PRO_MAX} servicios</strong> del plan Pro.
          </div>
        </Card>
      ) : null}

      {!onboarding && !isPro ? (
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
            En el plan <strong>Gratis</strong> puedes tener hasta <strong>{FREE_MAX} servicios</strong>. Con{' '}
            <strong>Pro</strong> puedes añadir hasta <strong>{PRO_MAX} servicios</strong>.
          </div>
        </Card>
      ) : null}

      {!onboarding && freeAtLimit ? (
        <Card
          padding={14}
          style={{
            marginBottom: 16,
            border: '1px solid #FCD34D',
            background: 'var(--lw-pro-soft)',
            display: 'flex',
            gap: 12,
            alignItems: 'center',
          }}
        >
          <Icon name="lock" size={18} color="#92400E" />
          <div style={{ flex: 1, fontSize: 13, fontWeight: 600, color: '#78350F' }}>
            Función exclusiva del plan Pro — has alcanzado el máximo de servicios en Gratis.
          </div>
          <Link to="/dashboard/account?tab=plan" style={{ textDecoration: 'none' }}>
            <Btn type="button" kind="outline" size="sm">
              Ver planes
            </Btn>
          </Link>
        </Card>
      ) : null}

      {!onboarding && proAtLimit ? (
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
            Has alcanzado el límite de <strong>{PRO_MAX} servicios</strong> del plan Pro.
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

      {formMode === 'create' || formMode === 'edit' ? (
        <Card padding={18} style={{ marginBottom: 20 }}>
          <div style={{ fontWeight: 600, marginBottom: 14 }}>{formMode === 'create' ? 'Nuevo servicio' : 'Editar servicio'}</div>
          <div style={{ display: 'grid', gap: 14, maxWidth: 480 }}>
            <Field label="Nombre" error={nameError}>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Ej. Corte de pelo"
                disabled={saving}
              />
            </Field>
            <Input
              label="Precio"
              type="text"
              inputMode="decimal"
              value={form.price}
              onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
              placeholder="Opcional (ej. 25 o 25,50)"
              disabled={saving}
              hint="Déjalo vacío para mostrar «Consultar» en la ficha"
            />
            <Textarea
              label="Descripción"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Opcional"
              rows={3}
              disabled={saving}
            />
            <div style={{ display: 'flex', gap: 10 }}>
              <Btn type="button" kind="primary" loading={saving} onClick={formMode === 'create' ? submitCreate : submitEdit}>
                {formMode === 'create' ? 'Crear' : 'Guardar'}
              </Btn>
              <Btn type="button" kind="outline" disabled={saving} onClick={cancelForm}>
                Cancelar
              </Btn>
            </div>
          </div>
        </Card>
      ) : null}

      {servicesQuery.isLoading ? (
        <div className="lw-shimmer" style={{ height: 120, borderRadius: 12 }} />
      ) : services.length === 0 ? (
        <Card padding={24} style={{ textAlign: 'center', color: 'var(--lw-text-3)' }}>
          <p style={{ margin: 0 }}>Aún no hay servicios. Pulsa «Añadir servicio» para crear el primero.</p>
        </Card>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: 12,
          }}
        >
          {services.map((s) => (
            <Card key={s.id} padding={16}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>{s.name}</div>
                  <div style={{ fontSize: 14, color: 'var(--lw-accent)', fontWeight: 600, marginBottom: 6 }}>
                    {formatPrice(s.price)}
                  </div>
                  {s.description ? (
                    <p className="lw-small" style={{ margin: 0, color: 'var(--lw-text-2)', lineHeight: 1.5 }}>
                      {s.description}
                    </p>
                  ) : (
                    <p className="lw-small" style={{ margin: 0, color: 'var(--lw-text-4)' }}>
                      Sin descripción
                    </p>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <Btn
                    type="button"
                    kind="outline"
                    size="sm"
                    icon="edit"
                    disabled={saving || (formMode === 'edit' && editingId === s.id)}
                    onClick={() => (formMode === 'edit' && editingId === s.id ? cancelForm() : openEdit(s))}
                  >
                    Editar
                  </Btn>
                  <Btn
                    type="button"
                    kind="danger"
                    size="sm"
                    icon="trash"
                    disabled={saving}
                    loading={deleteMut.isPending && deleteMut.variables === s.id}
                    onClick={() => onDelete(s)}
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
