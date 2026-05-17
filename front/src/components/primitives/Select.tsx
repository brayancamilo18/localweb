import type { SelectHTMLAttributes } from 'react'

type Option = { value: string; label: string }
type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string
  error?: string
  options: Option[]
}

export default function Select({ label, error, options, id, style, ...props }: SelectProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {label ? (
        <label htmlFor={id} style={{ fontSize: 'var(--lw-form-label)', fontWeight: 500, color: 'var(--lw-text)' }}>
          {label}
        </label>
      ) : null}
      <select
        id={id}
        {...props}
        style={{
          height: 'var(--lw-form-control-height)',
          padding: '0 12px',
          background: 'var(--lw-bg-elev)',
          border: `1px solid ${error ? 'var(--lw-danger)' : 'var(--lw-border)'}`,
          borderRadius: 'var(--lw-r-sm)',
          fontFamily: 'inherit',
          fontSize: 'var(--lw-form-input)',
          color: 'var(--lw-text)',
          outline: 'none',
          ...style,
        }}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error ? <div style={{ fontSize: 'var(--lw-form-caption)', color: 'var(--lw-danger)' }}>{error}</div> : null}
    </div>
  )
}
