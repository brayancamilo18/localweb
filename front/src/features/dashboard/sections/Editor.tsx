import { useEffect, useId, useMemo, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import Icon from '../../../components/primitives/Icon'
import { useToast } from '../../../components/ui/Toast'
import { updateBusiness } from '../../../api/dashboard'
import { keys } from '../../../api/queryKeys'
import { useDashboard } from '../context/DashboardContext'
import './editorContent.css'

/** Límites duros del backend (`StepController`/`BusinessController` validan con
 * `max:120` y `max:500`). Si cambian allí, deben cambiar aquí para que el
 * counter visual coincida con la validación del servidor. */
const TAGLINE_MAX = 120
const DESCRIPTION_MAX = 500

const COMPLETION_RING_R = 24

type FieldId = 'name' | 'tagline' | 'description' | 'phone' | 'email' | 'address'

function EditorCounter({ value, max }: { value: number; max: number }) {
  const ratio = Math.min(1, value / max)
  const r = 9
  const c = 2 * Math.PI * r
  const danger = ratio > 0.95
  const warn = ratio > 0.8
  const color = danger ? 'var(--lw-editor-danger)' : warn ? 'var(--lw-editor-warn)' : 'var(--lw-editor-accent)'

  return (
    <div className="lw-content-editor__counter" style={{ color }}>
      <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden>
        <circle cx="11" cy="11" r={r} fill="none" stroke="var(--lw-editor-soft)" strokeWidth="2" />
        <circle
          cx="11"
          cy="11"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - ratio)}
          transform="rotate(-90 11 11)"
        />
      </svg>
      <span>
        {value} / {max}
      </span>
    </div>
  )
}

function ContentField({
  inputId,
  label,
  optional,
  hint,
  icon,
  focused,
  onFocus,
  children,
}: {
  inputId: string
  label: string
  optional?: boolean
  hint?: string
  icon: string
  focused: boolean
  onFocus: () => void
  children: ReactNode
}) {
  return (
    <div
      className={`lw-content-editor__field${focused ? ' lw-content-editor__field--focused' : ''}`}
      onClick={onFocus}
    >
      <div className="lw-content-editor__field-head">
        <div className="lw-content-editor__field-icon">
          <Icon name={icon} size={16} stroke={2.2} />
        </div>
        <div className="lw-content-editor__field-labels">
          <label htmlFor={inputId} className="lw-content-editor__field-label">
            {label}
          </label>
          {optional ? (
            <span className="lw-content-editor__pill lw-content-editor__pill--optional">Opcional</span>
          ) : (
            <span className="lw-content-editor__pill lw-content-editor__pill--required">Requerido</span>
          )}
        </div>
      </div>
      {children}
      {hint ? (
        <div className="lw-content-editor__hint">
          <Icon name="info" size={13} style={{ marginTop: 2, flexShrink: 0 }} />
          <span>{hint}</span>
        </div>
      ) : null}
    </div>
  )
}

export default function Editor() {
  const { business, refetch } = useDashboard()
  const { showToast } = useToast()
  const qc = useQueryClient()

  const [name, setName] = useState(business.name)
  const [tagline, setTagline] = useState(business.tagline ?? '')
  const [description, setDescription] = useState(business.description ?? '')
  const [phone, setPhone] = useState(business.phone ?? '')
  const [email, setEmail] = useState(business.email ?? '')
  const [address, setAddress] = useState(business.address ?? '')
  const [focused, setFocused] = useState<FieldId | null>('name')

  useEffect(() => {
    setName(business.name)
    setTagline(business.tagline ?? '')
    setDescription(business.description ?? '')
    setPhone(business.phone ?? '')
    setEmail(business.email ?? '')
    setAddress(business.address ?? '')
  }, [business])

  const isDirty = useMemo(() => {
    const norm = (v: string) => v.trim()
    return (
      norm(name) !== norm(business.name ?? '') ||
      norm(tagline) !== norm(business.tagline ?? '') ||
      norm(description) !== norm(business.description ?? '') ||
      norm(phone) !== norm(business.phone ?? '') ||
      norm(email) !== norm(business.email ?? '') ||
      norm(address) !== norm(business.address ?? '')
    )
  }, [name, tagline, description, phone, email, address, business])

  const completion = useMemo(() => {
    const fields = [name, tagline, description, phone, email, address]
    const filled = fields.filter((f) => f.trim().length > 0).length
    return Math.round((filled / fields.length) * 100)
  }, [name, tagline, description, phone, email, address])

  const completionCircumference = 2 * Math.PI * COMPLETION_RING_R

  const mutation = useMutation({
    mutationFn: () =>
      updateBusiness({
        name: name.trim(),
        tagline: tagline.trim() || null,
        description: description.trim() || null,
        phone: phone.trim() || null,
        email: email.trim() || null,
        address: address.trim() || null,
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
    <div className="lw-content-editor" data-tour="editor-main">
      <header className="lw-content-editor__header">
        <div className="lw-content-editor__header-glow" aria-hidden />
        <div className="lw-content-editor__header-inner">
          <div>
            <div className="lw-content-editor__badge">
              <Icon name="eye" size={12} color="var(--lw-editor-accent-dark)" />
              Página pública
            </div>
            <h1 className="lw-content-editor__title">Editar contenido</h1>
            <p className="lw-content-editor__subtitle">
              Nombre, tagline, descripción y datos de contacto de tu página pública.{' '}
              <Link to="/dashboard/diseno" className="lw-content-editor__design-link">
                <Icon name="palette" size={12} />
                ¿Quieres cambiar el diseño?
              </Link>
            </p>
          </div>
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
        </div>
      </header>

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
          label="Tagline"
          optional
          icon="sparkle"
          focused={focused === 'tagline'}
          onFocus={() => setFocused('tagline')}
          hint="Una frase corta que resuma a qué te dedicas."
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
            <EditorCounter value={tagline.length} max={TAGLINE_MAX} />
          </div>
        </ContentField>

        <ContentField
          inputId={`${formId}-description`}
          label="Descripción"
          optional
          icon="list"
          focused={focused === 'description'}
          onFocus={() => setFocused('description')}
        >
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
            <EditorCounter value={description.length} max={DESCRIPTION_MAX} />
          </div>
        </ContentField>

        <div className="lw-content-editor__contact-row">
          <ContentField
            inputId={`${formId}-phone`}
            label="Teléfono"
            optional
            icon="phone"
            focused={focused === 'phone'}
            onFocus={() => setFocused('phone')}
          >
            <input
              id={`${formId}-phone`}
              className="lw-content-editor__input"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              onFocus={() => setFocused('phone')}
              disabled={mutation.isPending}
            />
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

        <ContentField
          inputId={`${formId}-address`}
          label="Dirección"
          optional
          icon="pin"
          focused={focused === 'address'}
          onFocus={() => setFocused('address')}
        >
          <input
            id={`${formId}-address`}
            className="lw-content-editor__input"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            onFocus={() => setFocused('address')}
            disabled={mutation.isPending}
          />
        </ContentField>
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
