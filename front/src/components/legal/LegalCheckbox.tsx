import type { ReactNode } from 'react'
import { Icon } from '../primitives/primitives'

type LegalCheckboxProps = {
  id: string
  checked: boolean
  onChange: (checked: boolean) => void
  ariaLabel: string
  children: ReactNode
  error?: string
}

export function LegalCheckbox({
  id,
  checked,
  onChange,
  ariaLabel,
  children,
  error,
}: LegalCheckboxProps) {
  return (
    <div>
      <label htmlFor={id} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', cursor: 'pointer' }}>
        <span
          id={id}
          role="checkbox"
          aria-label={ariaLabel}
          aria-checked={checked}
          tabIndex={0}
          onKeyDown={(ev) => {
            if (ev.key === 'Enter' || ev.key === ' ') {
              ev.preventDefault()
              onChange(!checked)
            }
          }}
          onClick={(e) => {
            e.preventDefault()
            onChange(!checked)
          }}
          style={{
            width: 18,
            height: 18,
            borderRadius: 4,
            flexShrink: 0,
            marginTop: 2,
            background: checked ? 'var(--lw-accent)' : 'var(--lw-bg-elev)',
            border: `1.5px solid ${error ? 'var(--lw-danger)' : checked ? 'var(--lw-accent)' : 'var(--lw-border-2)'}`,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {checked ? <Icon name="check" size={11} stroke={3} color="#fff" /> : null}
        </span>
        <span style={{ fontSize: 14, color: 'var(--lw-text-2)', lineHeight: 1.55 }}>{children}</span>
      </label>
      {error ? (
        <div
          style={{
            fontSize: 13,
            color: 'var(--lw-danger)',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            marginTop: 6,
            marginLeft: 28,
          }}
        >
          <Icon name="alert" size={13} />
          {error}
        </div>
      ) : null}
    </div>
  )
}
