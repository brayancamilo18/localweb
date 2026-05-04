import type { TextareaHTMLAttributes } from 'react'

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string
  error?: string
  rows?: number
}

export default function Textarea({ label, error, rows = 4, id, style, ...props }: TextareaProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {label ? (
        <label htmlFor={id} style={{ fontSize: 13, fontWeight: 500, color: 'var(--lw-text)' }}>
          {label}
        </label>
      ) : null}
      <textarea
        id={id}
        rows={rows}
        {...props}
        style={{
          padding: '10px 12px',
          background: 'var(--lw-bg-elev)',
          border: `1px solid ${error ? 'var(--lw-danger)' : 'var(--lw-border)'}`,
          borderRadius: 'var(--lw-r-sm)',
          fontFamily: 'inherit',
          fontSize: 14,
          color: 'var(--lw-text)',
          resize: 'none',
          outline: 'none',
          ...style,
        }}
      />
      {error ? <div style={{ fontSize: 12, color: 'var(--lw-danger)' }}>{error}</div> : null}
    </div>
  )
}
