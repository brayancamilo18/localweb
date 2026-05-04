import { useId } from 'react'
import type { InputHTMLAttributes } from 'react'

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string
  error?: string
  helper?: string
}

export default function Input({ label, error, helper, id, style, ...props }: InputProps) {
  const autoId = useId()
  const inputId = id ?? autoId

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {label ? (
        <label htmlFor={inputId} style={{ fontSize: 13, fontWeight: 500, color: 'var(--lw-text)' }}>
          {label}
        </label>
      ) : null}
      <input
        id={inputId}
        {...props}
        style={{
          height: 40,
          padding: '0 12px',
          background: props.disabled ? 'var(--lw-surface)' : 'var(--lw-bg-elev)',
          border: `1px solid ${error ? 'var(--lw-danger)' : 'var(--lw-border)'}`,
          borderRadius: 'var(--lw-r-sm)',
          boxShadow: error ? '0 0 0 3px rgba(220,38,38,.12)' : 'none',
          fontFamily: 'inherit',
          fontSize: 14,
          color: 'var(--lw-text)',
          outline: 'none',
          opacity: props.disabled ? 0.6 : 1,
          ...style,
        }}
      />
      {error ? <div style={{ fontSize: 12, color: 'var(--lw-danger)' }}>{error}</div> : helper ? <div style={{ fontSize: 12, color: 'var(--lw-text-3)' }}>{helper}</div> : null}
    </div>
  )
}
