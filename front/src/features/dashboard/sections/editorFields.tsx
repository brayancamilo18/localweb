import type { ReactNode } from 'react'
import Icon from '../../../components/primitives/Icon'

export function EditorCounter({ value, max }: { value: number; max: number }) {
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

export function ContentField({
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
