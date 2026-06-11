import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Btn } from '../../../components/primitives/primitives'
import Icon from '../../../components/primitives/Icon'
import { useToast } from '../../../components/ui/Toast'
import { updateBusiness } from '../../../api/dashboard'
import { generateAboutSection } from '../../../api/ai'
import { useAiQuota, useInvalidateAiQuota } from '../../shared/useAiQuota'
import { keys } from '../../../api/queryKeys'
import { useDashboard } from '../context/DashboardContext'
import DashboardSectionHeader from '../components/DashboardSectionHeader'
import ProAboutSectionsEditor from '../../shared/ProAboutSectionsEditor'
import AiImproveButton from '../../shared/AiImproveButton'
import PhoneInput from '../../shared/PhoneInput'
import ConfirmDialog from '../../../components/ui/ConfirmDialog'
import { ContentField, EditorCounter } from './editorFields'
import './editorContent.css'
import '../components/dashboardSectionHeader.css'

/** Límites duros del backend (`StepController`/`BusinessController` validan con
 * `max:120` y `max:500`). Si cambian allí, deben cambiar aquí para que el
 * counter visual coincida con la validación del servidor. */
const TAGLINE_MAX = 120
const DESCRIPTION_MAX = 500
const ABOUT_TITLE_MAX = 160

const COMPLETION_RING_R = 24

type FieldId = 'name' | 'tagline' | 'about_title' | 'description' | 'phone' | 'email'

export default function Editor() {
  const { business, refetch } = useDashboard()
  const isPro = business.is_pro || business.plan === 'pending'
  const { showToast } = useToast()
  const qc = useQueryClient()

  const [name, setName] = useState(business.name)
  const [tagline, setTagline] = useState(business.tagline ?? '')
  const [aboutTitle, setAboutTitle] = useState(business.about_title ?? '')
  const [description, setDescription] = useState(business.description ?? '')
  const [phone, setPhone] = useState(business.phone ?? '')
  const [email, setEmail] = useState(business.email ?? '')
  const [focused, setFocused] = useState<FieldId | null>('name')

  // ── IA: generar título + descripción de «Sobre nosotros» (un solo resultado) ──
  const aiQuotaQuery = useAiQuota()
  const invalidateAiQuota = useInvalidateAiQuota()
  const aiEnabled = aiQuotaQuery.data?.enabled === true
  const aiRemaining = aiQuotaQuery.data?.remaining?.business_description ?? 0

  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)
  /** Resultado pendiente de confirmación cuando ya hay contenido escrito. */
  const [aiConfirmOpen, setAiConfirmOpen] = useState(false)
  const aiPendingRef = useRef<{ title: string; description: string } | null>(null)
  /** Loading de la mejora de tagline (gestionado por AiImproveButton). */
  const [taglineImproving, setTaglineImproving] = useState(false)

  const applyAiResult = (result: { title: string; description: string }) => {
    setDescription(result.description.slice(0, DESCRIPTION_MAX))
    if (result.title.trim()) {
      setAboutTitle(result.title.trim().slice(0, ABOUT_TITLE_MAX))
    }
  }

  const handleGenerateAi = async () => {
    if (name.trim() === '') {
      setAiError('Necesitamos el nombre del negocio para generar el contenido.')
      return
    }
    setAiError(null)
    setAiLoading(true)
    try {
      const res = await generateAboutSection({
        business_name: name.trim(),
        tagline: tagline.trim() || undefined,
        current_title: aboutTitle.trim() || undefined,
        current_description: description.trim() || undefined,
      })
      void invalidateAiQuota()
      // Si ya hay título o descripción escritos, pedir confirmación antes de reemplazar.
      if (aboutTitle.trim() !== '' || description.trim() !== '') {
        aiPendingRef.current = res
        setAiConfirmOpen(true)
      } else {
        applyAiResult(res)
      }
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status
      if (status === 429) setAiError('Has agotado tu cuota mensual de IA. Podrás volver a usarla el mes que viene.')
      else if (status === 503) setAiError('La generación con IA no está disponible ahora mismo.')
      else setAiError('No se pudo generar el contenido. Inténtalo de nuevo.')
      void invalidateAiQuota()
    } finally {
      setAiLoading(false)
    }
  }

  // Sincroniza los campos locales SOLO cuando cambia el negocio en sí (su id),
  // no en cada refetch de React Query (p. ej. refetchOnWindowFocus). De lo
  // contrario, un refetch con los datos antiguos pisaría ediciones locales o el
  // contenido recién generado con IA, haciendo que "no se reemplace nada".
  const syncedBusinessIdRef = useRef<number | string | null>(null)
  useEffect(() => {
    if (syncedBusinessIdRef.current === business.id) return
    syncedBusinessIdRef.current = business.id
    setName(business.name)
    setTagline(business.tagline ?? '')
    setAboutTitle(business.about_title ?? '')
    setDescription(business.description ?? '')
    setPhone(business.phone ?? '')
    setEmail(business.email ?? '')
  }, [business])

  const isDirty = useMemo(() => {
    const norm = (v: string) => v.trim()
    return (
      norm(name) !== norm(business.name ?? '') ||
      norm(tagline) !== norm(business.tagline ?? '') ||
      norm(aboutTitle) !== norm(business.about_title ?? '') ||
      norm(description) !== norm(business.description ?? '') ||
      norm(phone) !== norm(business.phone ?? '') ||
      norm(email) !== norm(business.email ?? '')
    )
  }, [name, tagline, aboutTitle, description, phone, email, business])

  const completion = useMemo(() => {
    const fields = [name, tagline, aboutTitle, description, phone, email]
    const filled = fields.filter((f) => f.trim().length > 0).length
    return Math.round((filled / fields.length) * 100)
  }, [name, tagline, aboutTitle, description, phone, email])

  const completionCircumference = 2 * Math.PI * COMPLETION_RING_R

  const mutation = useMutation({
    mutationFn: () =>
      updateBusiness({
        name: name.trim(),
        tagline: tagline.trim() || null,
        about_title: aboutTitle.trim() || null,
        description: description.trim() || null,
        phone: phone.trim() || null,
        email: email.trim() || null,
      }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: keys.dashboard.business })
      refetch()
      showToast({
        type: 'success',
        title: 'Cambios guardados',
        description: 'El contenido público se ha actualizado.',
      })
    },
    onError: () => {
      showToast({
        type: 'error',
        title: 'No se pudo guardar',
        description: 'Revisa tu conexión y vuelve a intentarlo.',
        action: { label: 'Reintentar', onClick: () => mutation.mutate() },
      })
    },
  })

  const formId = useId()

  return (
    <div className="lw-content-editor lw-dash-section-page" data-tour="editor-main">
      <DashboardSectionHeader
        badgeIcon="eye"
        badgeLabel="Página pública"
        title="Editar contenido"
        subtitle={
          <>
            Nombre, eslogan, descripción y datos de contacto de tu página pública.{' '}
            <Link to="/dashboard/diseno" className="lw-content-editor__design-link">
              <Icon name="palette" size={12} />
              ¿Quieres cambiar el diseño?
            </Link>
          </>
        }
        aside={
          <div className="lw-content-editor__completion" aria-label={`Perfil completado al ${completion}%`}>
            <svg className="lw-content-editor__completion-ring" width="56" height="56" viewBox="0 0 56 56" aria-hidden>
              <circle cx="28" cy="28" r={COMPLETION_RING_R} fill="none" stroke="var(--lw-editor-soft)" strokeWidth="5" />
              <circle
                cx="28"
                cy="28"
                r={COMPLETION_RING_R}
                fill="none"
                stroke="var(--lw-editor-accent)"
                strokeWidth="5"
                strokeLinecap="round"
                strokeDasharray={completionCircumference}
                strokeDashoffset={completionCircumference * (1 - completion / 100)}
                transform="rotate(-90 28 28)"
              />
              <text x="28" y="32" textAnchor="middle" fontSize="13" fontWeight="800" fill="var(--lw-editor-ink)">
                {completion}%
              </text>
            </svg>
            <div className="lw-content-editor__completion-label">
              Perfil <strong>completado</strong>
            </div>
          </div>
        }
      />

      <div className="lw-content-editor__grid">
        <ContentField
          inputId={`${formId}-name`}
          label="Nombre del negocio"
          icon="home"
          focused={focused === 'name'}
          onFocus={() => setFocused('name')}
        >
          <input
            id={`${formId}-name`}
            className="lw-content-editor__input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onFocus={() => setFocused('name')}
            disabled={mutation.isPending}
          />
        </ContentField>

        <ContentField
          inputId={`${formId}-tagline`}
          label="Eslogan"
          optional
          icon="sparkle"
          focused={focused === 'tagline'}
          onFocus={() => setFocused('tagline')}
          hint="Una frase corta que resuma a qué te dedicas."
          aiLoading={taglineImproving}
        >
          <input
            id={`${formId}-tagline`}
            className="lw-content-editor__input"
            value={tagline}
            maxLength={TAGLINE_MAX}
            onChange={(e) => setTagline(e.target.value)}
            onFocus={() => setFocused('tagline')}
            disabled={mutation.isPending}
          />
          <div className="lw-content-editor__counter-row">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'flex-end' }}>
              {isPro ? (
                <AiImproveButton
                  value={tagline}
                  field="tagline"
                  onResult={(text) => setTagline(text.slice(0, TAGLINE_MAX))}
                  disabled={mutation.isPending}
                  onLoadingChange={setTaglineImproving}
                />
              ) : null}
              <EditorCounter value={tagline.length} max={TAGLINE_MAX} />
            </div>
          </div>
        </ContentField>

        <div
          className={`lw-content-editor__field lw-content-editor__field--group${
            focused === 'about_title' || focused === 'description'
              ? ' lw-content-editor__field--focused'
              : ''
          }${aiLoading ? ' lw-content-editor__field--ai-loading' : ''}`}
          onClick={() => setFocused('description')}
        >
          <div className="lw-content-editor__field-head">
            <div className="lw-content-editor__field-icon">
              <Icon name="list" size={16} stroke={2.2} />
            </div>
            <div className="lw-content-editor__field-labels">
              <span className="lw-content-editor__field-label">Sobre nosotros</span>
              <span className="lw-content-editor__pill lw-content-editor__pill--optional">Opcional</span>
            </div>
          </div>

          <div className="lw-content-editor__subfield">
            <label htmlFor={`${formId}-about_title`} className="lw-content-editor__subfield-label">
              Título
            </label>
            <input
              id={`${formId}-about_title`}
              className="lw-content-editor__input"
              value={aboutTitle}
              maxLength={ABOUT_TITLE_MAX}
              onChange={(e) => setAboutTitle(e.target.value)}
              onFocus={() => setFocused('about_title')}
              disabled={mutation.isPending}
              placeholder="Una casa con oficio, abierta desde 2026"
            />
            <div className="lw-content-editor__counter-row">
              <EditorCounter value={aboutTitle.length} max={ABOUT_TITLE_MAX} />
            </div>
          </div>

          <div className="lw-content-editor__subfield">
            <label htmlFor={`${formId}-description`} className="lw-content-editor__subfield-label">
              Descripción
            </label>
            <textarea
              id={`${formId}-description`}
              className="lw-content-editor__textarea"
              value={description}
              maxLength={DESCRIPTION_MAX}
              onChange={(e) => setDescription(e.target.value)}
              onFocus={() => setFocused('description')}
              rows={5}
              disabled={mutation.isPending}
            />
            <div className="lw-content-editor__counter-row">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'flex-end' }}>
                {(aiEnabled || isPro) && (
                  <span
                    title={aiRemaining <= 0 ? 'Has alcanzado el límite mensual de IA.' : `Te quedan ${aiRemaining} generaciones este mes`}
                    style={{ display: 'inline-flex' }}
                  >
                    <Btn
                      type="button"
                      kind="ghost"
                      size="sm"
                      icon="sparkle"
                      disabled={mutation.isPending || aiLoading || aiRemaining <= 0}
                      onClick={() => void handleGenerateAi()}
                    >
                      {aiLoading
                        ? 'Generando…'
                        : description.trim() || aboutTitle.trim()
                          ? 'Regenerar con IA'
                          : 'Generar con IA'}
                    </Btn>
                  </span>
                )}
                <EditorCounter value={description.length} max={DESCRIPTION_MAX} />
              </div>
            </div>

            {aiError && (
              <div role="alert" style={{ fontSize: 12, color: 'var(--lw-danger)', marginTop: 6 }}>
                {aiError}
              </div>
            )}
          </div>

          <div className="lw-content-editor__hint">
            <Icon name="info" size={13} style={{ marginTop: 2, flexShrink: 0 }} />
            <span>
              Encabezado y texto de la sección en tu web. Si dejas el título vacío, la plantilla usa un texto por defecto.
            </span>
          </div>
        </div>

        <ConfirmDialog
          open={aiConfirmOpen}
          onCancel={() => {
            aiPendingRef.current = null
            setAiConfirmOpen(false)
          }}
          onConfirm={() => {
            const result = aiPendingRef.current
            if (result) applyAiResult(result)
            aiPendingRef.current = null
            setAiConfirmOpen(false)
          }}
          title="¿Reemplazar el contenido actual?"
          description="Tienes texto escrito en el título o la descripción de «Sobre nosotros». Si continúas, se sustituirán por el contenido generado con IA."
          confirmLabel="Reemplazar"
          cancelLabel="Cancelar"
        />

        <ProAboutSectionsEditor
          isPro={isPro}
          editorStyle
          formIdPrefix={formId}
          onAfterMutate={() => {
            void qc.invalidateQueries({ queryKey: keys.dashboard.business })
            refetch()
          }}
        />

        <div className="lw-content-editor__contact-row">
          <ContentField
            inputId={`${formId}-phone`}
            label="Teléfono"
            optional
            icon="phone"
            focused={focused === 'phone'}
            onFocus={() => setFocused('phone')}
          >
            <div
              onFocus={() => setFocused('phone')}
              className="lw-content-editor__phone-wrap"
            >
              <PhoneInput
                value={phone}
                disabled={mutation.isPending}
                onChange={(val) => setPhone(val)}
              />
            </div>
          </ContentField>

          <ContentField
            inputId={`${formId}-email`}
            label="Email de contacto"
            optional
            icon="mail"
            focused={focused === 'email'}
            onFocus={() => setFocused('email')}
            hint="Email público que se mostrará en el footer y en la sección de contacto. Puede ser distinto al email con el que inicias sesión."
          >
            <input
              id={`${formId}-email`}
              type="email"
              className="lw-content-editor__input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onFocus={() => setFocused('email')}
              placeholder="info@tu-negocio.com"
              maxLength={191}
              disabled={mutation.isPending}
            />
          </ContentField>
        </div>

        <Link to="/dashboard/location" className="lw-content-editor__location-link">
          <Icon name="pin" size={16} />
          <span>
            ¿Cambiar la dirección o el mapa? Ve a <strong>Ubicación</strong>.
          </span>
          <Icon name="arrowRight" size={14} />
        </Link>
      </div>

      <div className="lw-content-editor__save-bar">
        <div className="lw-content-editor__save-status" aria-live="polite">
          {mutation.isPending ? (
            <span>Guardando cambios…</span>
          ) : isDirty ? (
            <>
              <span className="lw-content-editor__save-dot" aria-hidden />
              <span>Tienes cambios sin guardar</span>
            </>
          ) : (
            <>
              <Icon name="check" size={16} color="var(--lw-editor-accent)" />
              <span style={{ color: 'var(--lw-editor-accent-dark)', fontWeight: 600 }}>Todo guardado</span>
            </>
          )}
        </div>
        <button
          type="button"
          className="lw-content-editor__save-btn"
          disabled={mutation.isPending}
          onClick={() => mutation.mutate()}
        >
          <Icon name="check" size={16} color="#fff" />
          {mutation.isPending ? 'Guardando…' : 'Guardar cambios'}
        </button>
      </div>
    </div>
  )
}
