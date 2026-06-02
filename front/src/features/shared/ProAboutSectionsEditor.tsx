import { useCallback, useMemo, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Btn, Card, Field, Icon, Input, Textarea } from '../../components/primitives/primitives'
import { ContentField, EditorCounter } from '../dashboard/sections/editorFields'
import {
  createAboutSection,
  deleteAboutSection,
  deleteAboutSectionPhoto,
  getAboutSections,
  updateAboutSection,
  uploadAboutSectionPhoto,
} from '../../api/aboutSections'
import { keys } from '../../api/queryKeys'
import { useApiError } from '../../hooks/useApiError'
import type { Business, BusinessAboutSection } from '../../types/api'

const MAX_TOTAL = 5
const TITLE_MAX = 160
const DESC_MAX = 500

type FormState = { title: string; description: string }
type ExtraFieldFocus = 'title' | 'description' | null

const emptyForm = (): FormState => ({ title: '', description: '' })

function sectionToForm(s: BusinessAboutSection): FormState {
  return {
    title: s.title ?? '',
    description: s.description ?? '',
  }
}

export type ProAboutSectionsEditorProps = {
  isPro: boolean
  onboarding?: boolean
  /** Usa los mismos campos que «Editar contenido» (dashboard). */
  editorStyle?: boolean
  formIdPrefix?: string
  onAfterMutate?: () => void
}

export default function ProAboutSectionsEditor({
  isPro,
  onboarding,
  editorStyle = false,
  formIdPrefix = 'about-extra',
  onAfterMutate,
}: ProAboutSectionsEditorProps) {
  const qc = useQueryClient()
  const { messageFromError } = useApiError()
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploadTargetId, setUploadTargetId] = useState<number | null>(null)
  const [formMode, setFormMode] = useState<'none' | 'create' | 'edit'>('none')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [error, setError] = useState<string | null>(null)
  const [extraFocus, setExtraFocus] = useState<ExtraFieldFocus>(null)

  const sectionsQuery = useQuery({
    queryKey: keys.dashboard.aboutSections,
    queryFn: getAboutSections,
    enabled: isPro,
  })

  const businessFromCache = qc.getQueryData<Business>(keys.dashboard.business)

  const sections = useMemo(() => {
    const list = sectionsQuery.data ?? businessFromCache?.about_sections ?? []
    return [...list].sort((a, b) => a.display_order - b.display_order)
  }, [sectionsQuery.data, businessFromCache?.about_sections])

  const primaryCount = 1
  const totalCount = primaryCount + sections.length
  const atLimit = totalCount >= MAX_TOTAL

  const syncSectionsCaches = useCallback(
    (updater: (prev: BusinessAboutSection[] | undefined) => BusinessAboutSection[]) => {
      const cachedBusiness = qc.getQueryData<Business>(keys.dashboard.business)
      const base =
        qc.getQueryData<BusinessAboutSection[]>(keys.dashboard.aboutSections) ??
        cachedBusiness?.about_sections ??
        []
      const next = updater(base).sort((a, b) => a.display_order - b.display_order)
      qc.setQueryData(keys.dashboard.aboutSections, next)
      qc.setQueryData<Business | undefined>(keys.dashboard.business, (prev) => {
        if (!prev) return prev
        return {
          ...prev,
          about_sections: next,
          about_sections_count: Math.min(MAX_TOTAL, Math.max(1, 1 + next.length)),
        }
      })
      return next
    },
    [qc],
  )

  const notifyAfterMutate = useCallback(async () => {
    await qc.refetchQueries({ queryKey: keys.dashboard.aboutSections })
    onAfterMutate?.()
  }, [qc, onAfterMutate])

  const createMut = useMutation({
    mutationFn: () =>
      createAboutSection({
        title: form.title.trim() || null,
        description: form.description.trim() || null,
      }),
    onSuccess: async (created) => {
      syncSectionsCaches((prev) => [...(prev ?? []), created])
      setFormMode('none')
      setForm(emptyForm())
      setExtraFocus(null)
      setError(null)
      await notifyAfterMutate()
    },
    onError: (e) => setError(messageFromError(e)),
  })

  const updateMut = useMutation({
    mutationFn: () =>
      updateAboutSection(editingId!, {
        title: form.title.trim() || null,
        description: form.description.trim() || null,
      }),
    onSuccess: async (updated) => {
      syncSectionsCaches((prev) =>
        (prev ?? []).map((s) => (s.id === updated.id ? updated : s)),
      )
      setFormMode('none')
      setEditingId(null)
      setForm(emptyForm())
      setExtraFocus(null)
      setError(null)
      await notifyAfterMutate()
    },
    onError: (e) => setError(messageFromError(e)),
  })

  const deleteMut = useMutation({
    mutationFn: (id: number) => deleteAboutSection(id),
    onSuccess: async (_data, id) => {
      syncSectionsCaches((prev) => (prev ?? []).filter((s) => s.id !== id))
      if (editingId === id) {
        setFormMode('none')
        setEditingId(null)
        setForm(emptyForm())
        setExtraFocus(null)
      }
      await notifyAfterMutate()
    },
    onError: (e) => setError(messageFromError(e)),
  })

  const photoMut = useMutation({
    mutationFn: ({ id, file }: { id: number; file: File }) => uploadAboutSectionPhoto(id, file),
    onSuccess: async (updated) => {
      syncSectionsCaches((prev) =>
        (prev ?? []).map((s) => (s.id === updated.id ? updated : s)),
      )
      setUploadTargetId(null)
      await notifyAfterMutate()
    },
    onError: (e) => setError(messageFromError(e)),
  })

  const deletePhotoMut = useMutation({
    mutationFn: (id: number) => deleteAboutSectionPhoto(id),
    onSuccess: async (updated) => {
      syncSectionsCaches((prev) =>
        (prev ?? []).map((s) => (s.id === updated.id ? updated : s)),
      )
      await notifyAfterMutate()
    },
    onError: (e) => setError(messageFromError(e)),
  })

  function layoutLabel(index: number): string {
    return index % 2 === 0 ? 'texto · foto' : 'foto · texto'
  }

  const busy =
    createMut.isPending ||
    updateMut.isPending ||
    deleteMut.isPending ||
    photoMut.isPending ||
    deletePhotoMut.isPending

  const startCreate = () => {
    setEditingId(null)
    setForm(emptyForm())
    setFormMode('create')
    setExtraFocus('title')
    setError(null)
  }

  const startEdit = (s: BusinessAboutSection) => {
    setEditingId(s.id)
    setForm(sectionToForm(s))
    setFormMode('edit')
    setExtraFocus('title')
    setError(null)
  }

  const submitForm = () => {
    if (formMode === 'create') createMut.mutate()
    else if (formMode === 'edit') updateMut.mutate()
  }

  if (!isPro) {
    if (editorStyle) {
      return (
        <div className="lw-content-editor__field">
          <div className="lw-content-editor__field-head">
            <div className="lw-content-editor__field-icon">
              <Icon name="grid" size={16} stroke={2.2} />
            </div>
            <div className="lw-content-editor__field-labels">
              <span className="lw-content-editor__field-label">Bloques extra «Sobre nosotros»</span>
              <span className="lw-content-editor__pill lw-content-editor__pill--optional">Pro</span>
            </div>
          </div>
          <p className="lw-content-editor__hint" style={{ marginTop: 0 }}>
            Con <strong>Pro</strong> puedes añadir hasta {MAX_TOTAL - 1} bloques extra con foto y texto
            alternando el diseño.
            {!onboarding ? (
              <>
                {' '}
                <Link to="/dashboard/cuenta/plan">Ver planes</Link>
              </>
            ) : null}
          </p>
        </div>
      )
    }
    return (
      <Card style={{ marginTop: 16, padding: 16, background: 'var(--lw-surface-2)' }}>
        <p className="lw-body" style={{ margin: 0, fontSize: 14 }}>
          Con <strong>Pro</strong> puedes añadir hasta {MAX_TOTAL - 1} bloques extra en «Sobre nosotros», con
          foto y texto alternando el diseño.
        </p>
        {!onboarding ? (
          <p style={{ marginTop: 10, marginBottom: 0 }}>
            <Link to="/dashboard/cuenta/plan">Ver planes</Link>
          </p>
        ) : null}
      </Card>
    )
  }

  const titleInputId = `${formIdPrefix}-block-title`
  const descInputId = `${formIdPrefix}-block-description`

  const formFieldsEditor = editorStyle ? (
    <>
      <ContentField
        inputId={titleInputId}
        label="Título del bloque"
        optional
        icon="sparkle"
        focused={extraFocus === 'title'}
        onFocus={() => setExtraFocus('title')}
      >
        <input
          id={titleInputId}
          className="lw-content-editor__input"
          value={form.title}
          maxLength={TITLE_MAX}
          disabled={busy}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          onFocus={() => setExtraFocus('title')}
          placeholder="Ej. Nuestra cocina, de generación en generación"
        />
        <div className="lw-content-editor__counter-row">
          <EditorCounter value={form.title.length} max={TITLE_MAX} />
        </div>
      </ContentField>
      <ContentField
        inputId={descInputId}
        label="Descripción del bloque"
        optional
        icon="list"
        focused={extraFocus === 'description'}
        onFocus={() => setExtraFocus('description')}
      >
        <textarea
          id={descInputId}
          className="lw-content-editor__textarea"
          rows={5}
          value={form.description}
          maxLength={DESC_MAX}
          disabled={busy}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          onFocus={() => setExtraFocus('description')}
        />
        <div className="lw-content-editor__counter-row">
          <EditorCounter value={form.description.length} max={DESC_MAX} />
        </div>
      </ContentField>
      <div className="lw-content-editor__about-extras-actions">
        <button
          type="button"
          className="lw-content-editor__save-btn"
          disabled={busy}
          onClick={submitForm}
        >
          {formMode === 'create' ? 'Crear bloque' : 'Guardar bloque'}
        </button>
        <Btn
          kind="ghost"
          size="sm"
          type="button"
          disabled={busy}
          onClick={() => {
            setFormMode('none')
            setEditingId(null)
            setForm(emptyForm())
            setExtraFocus(null)
          }}
        >
          Cancelar
        </Btn>
      </div>
    </>
  ) : (
    <Card style={{ marginTop: 14, padding: 16 }}>
      <Field label="Título del bloque" counter={`${form.title.length} / ${TITLE_MAX}`} optional>
        <Input
          value={form.title}
          maxLength={TITLE_MAX}
          disabled={busy}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          placeholder="Ej. Nuestra cocina, de generación en generación"
        />
      </Field>
      <Field label="Descripción" counter={`${form.description.length} / ${DESC_MAX}`} optional>
        <Textarea
          rows={5}
          value={form.description}
          maxLength={DESC_MAX}
          disabled={busy}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
        />
      </Field>
      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <Btn kind="primary" size="sm" type="button" disabled={busy} onClick={submitForm}>
          {formMode === 'create' ? 'Crear bloque' : 'Guardar'}
        </Btn>
        <Btn
          kind="ghost"
          size="sm"
          type="button"
          disabled={busy}
          onClick={() => {
            setFormMode('none')
            setEditingId(null)
            setForm(emptyForm())
          }}
        >
          Cancelar
        </Btn>
      </div>
    </Card>
  )

  if (editorStyle) {
    const hasBody = sections.length > 0 || formMode !== 'none'

    return (
      <div className="lw-content-editor__field lw-content-editor__about-extras">
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

        <div className="lw-content-editor__field-head">
          <div className="lw-content-editor__field-icon">
            <Icon name="grid" size={16} stroke={2.2} />
          </div>
          <div className="lw-content-editor__field-labels">
            <span className="lw-content-editor__field-label">Bloques extra «Sobre nosotros»</span>
            <span className="lw-content-editor__pill lw-content-editor__pill--optional">Opcional</span>
          </div>
          <Btn
            kind="outline"
            size="sm"
            type="button"
            disabled={busy || atLimit || formMode !== 'none'}
            onClick={startCreate}
            style={{ marginLeft: 'auto', flexShrink: 0 }}
          >
            <Icon name="plus" size={14} /> Añadir bloque
          </Btn>
        </div>

        <p className="lw-content-editor__hint lw-content-editor__about-extras-hint">
          El bloque principal va arriba (foto · texto). Los extras alternan: bloque 2 texto · foto, bloque 3
          foto · texto. Máximo {MAX_TOTAL} bloques en total.{' '}
          <span className="lw-content-editor__about-extras-count">
            {totalCount} / {MAX_TOTAL} bloques
          </span>
        </p>

        {error ? (
          <p className="lw-content-editor__about-extras-error" role="alert">
            {error}
          </p>
        ) : null}

        {hasBody ? (
          <div className="lw-content-editor__about-extras-body">
            {formMode !== 'none' ? (
              <div className="lw-content-editor__about-extras-form">{formFieldsEditor}</div>
            ) : null}

            {sections.length > 0 ? (
              <div className="lw-content-editor__about-extras-list">
                {sections.map((s, i) => (
                  <div key={s.id} className="lw-content-editor__about-block">
                    <div className="lw-content-editor__about-block-head">
                      <div
                        className="lw-content-editor__about-block-thumb"
                        role={s.image_url ? 'img' : undefined}
                        aria-label={s.image_url ? `Foto del bloque ${i + 2}` : undefined}
                      >
                        {s.image_url ? (
                          <img src={s.image_url} alt="" />
                        ) : (
                          <span>Sin foto</span>
                        )}
                      </div>
                      <div className="lw-content-editor__about-block-meta">
                        <span className="lw-content-editor__about-block-kicker">
                          Bloque {i + 2} · {layoutLabel(i)}
                        </span>
                        <p className="lw-content-editor__about-block-title">
                          {s.title?.trim() || 'Sin título'}
                        </p>
                        {s.description ? (
                          <p className="lw-content-editor__about-block-desc">{s.description}</p>
                        ) : null}
                      </div>
                    </div>
                    <div className="lw-content-editor__about-block-actions">
                      <Btn
                        kind="ghost"
                        size="sm"
                        type="button"
                        disabled={busy}
                        onClick={() => {
                          setUploadTargetId(s.id)
                          fileRef.current?.click()
                        }}
                      >
                        {s.image_url ? 'Cambiar foto' : 'Subir foto'}
                      </Btn>
                      {s.image_url ? (
                        <Btn
                          kind="ghost"
                          size="sm"
                          type="button"
                          disabled={busy}
                          onClick={() => deletePhotoMut.mutate(s.id)}
                        >
                          Quitar foto
                        </Btn>
                      ) : null}
                      <Btn kind="ghost" size="sm" type="button" disabled={busy} onClick={() => startEdit(s)}>
                        Editar
                      </Btn>
                      <Btn
                        kind="ghost"
                        size="sm"
                        type="button"
                        disabled={busy}
                        onClick={() => deleteMut.mutate(s.id)}
                      >
                        Eliminar
                      </Btn>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        ) : (
          <p className="lw-content-editor__about-extras-empty">
            Aún no hay bloques extra. El bloque principal (arriba) siempre se muestra primero en tu web.
          </p>
        )}
      </div>
    )
  }

  const hasBody = sections.length > 0 || formMode !== 'none'

  return (
    <Card style={{ marginTop: 20, padding: 16 }}>
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

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <div>
          <h3 className="lw-h3" style={{ margin: 0 }}>
            Bloques extra «Sobre nosotros»
          </h3>
          <p className="lw-body" style={{ marginTop: 6, fontSize: 14, color: 'var(--lw-text-2)' }}>
            El bloque principal va arriba (foto · texto). Los extras alternan: bloque 2 texto · foto,
            bloque 3 foto · texto, y así sucesivamente. Máximo {MAX_TOTAL} bloques en total.
          </p>
        </div>
        <Btn
          kind="outline"
          size="sm"
          type="button"
          disabled={busy || atLimit || formMode !== 'none'}
          onClick={startCreate}
        >
          <Icon name="plus" size={14} /> Añadir bloque
        </Btn>
      </div>

      <p className="lw-mono" style={{ marginTop: 8, fontSize: 12, color: 'var(--lw-text-3)' }}>
        {totalCount} / {MAX_TOTAL} bloques
      </p>

      {error ? (
        <p role="alert" style={{ color: 'var(--lw-danger)', fontSize: 14, marginTop: 8 }}>
          {error}
        </p>
      ) : null}

      {hasBody ? (
        <div
          style={{
            marginTop: 14,
            border: '1px solid var(--lw-border)',
            borderRadius: 10,
            overflow: 'hidden',
            background: 'var(--lw-surface-2)',
          }}
        >
          {formMode !== 'none' ? (
            <div style={{ padding: 14, borderBottom: sections.length > 0 ? '1px solid var(--lw-border)' : undefined }}>
              {formFieldsEditor}
            </div>
          ) : null}

          {sections.map((s, i) => (
            <div
              key={s.id}
              style={{
                padding: 14,
                borderBottom: i < sections.length - 1 ? '1px solid var(--lw-border)' : undefined,
              }}
            >
              <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                <div
                  style={{
                    width: 72,
                    height: 90,
                    borderRadius: 8,
                    overflow: 'hidden',
                    border: '1px solid var(--lw-border)',
                    background: 'var(--lw-surface)',
                    flexShrink: 0,
                  }}
                >
                  {s.image_url ? (
                    <img
                      src={s.image_url}
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
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p className="lw-mono" style={{ fontSize: 11, color: 'var(--lw-text-3)', margin: 0 }}>
                    Bloque {i + 2} · {layoutLabel(i)}
                  </p>
                  <p style={{ margin: '6px 0 0', fontWeight: 700 }}>
                    {s.title?.trim() || 'Sin título'}
                  </p>
                  {s.description ? (
                    <p style={{ margin: '4px 0 0', fontSize: 14, color: 'var(--lw-text-2)' }}>
                      {s.description}
                    </p>
                  ) : null}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
                    <Btn
                      kind="ghost"
                      size="sm"
                      type="button"
                      disabled={busy}
                      onClick={() => {
                        setUploadTargetId(s.id)
                        fileRef.current?.click()
                      }}
                    >
                      {s.image_url ? 'Cambiar foto' : 'Subir foto'}
                    </Btn>
                    {s.image_url ? (
                      <Btn
                        kind="ghost"
                        size="sm"
                        type="button"
                        disabled={busy}
                        onClick={() => deletePhotoMut.mutate(s.id)}
                      >
                        Quitar foto
                      </Btn>
                    ) : null}
                    <Btn kind="ghost" size="sm" type="button" disabled={busy} onClick={() => startEdit(s)}>
                      Editar
                    </Btn>
                    <Btn
                      kind="ghost"
                      size="sm"
                      type="button"
                      disabled={busy}
                      onClick={() => deleteMut.mutate(s.id)}
                    >
                      Eliminar
                    </Btn>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="lw-body" style={{ marginTop: 12, color: 'var(--lw-text-3)', fontSize: 14 }}>
          Aún no hay bloques extra. El bloque principal (arriba) siempre se muestra primero.
        </p>
      )}
    </Card>
  )
}
