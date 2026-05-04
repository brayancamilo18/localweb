import type { ReactNode } from 'react'

type SegmentedProps = {
  value: string
  onChange: (v: string) => void
  options: { value: string; label: ReactNode }[]
  size?: 'sm' | 'md'
}

export default function Segmented({ value, onChange, options, size = 'md' }: SegmentedProps) {
  const h = size === 'sm' ? 30 : 34

  return (
    <div
      style={{
        display: 'inline-flex',
        padding: 3,
        gap: 2,
        background: 'var(--lw-surface)',
        borderRadius: 'var(--lw-r-sm)',
      }}
    >
      {options.map((o) => {
        const active = o.value === value
        return (
          <button
            type="button"
            key={o.value}
            onClick={() => onChange(o.value)}
            style={{
              height: h,
              padding: '0 12px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 6,
              fontSize: 13,
              fontWeight: 500,
              background: active ? 'var(--lw-bg-elev)' : 'transparent',
              color: active ? 'var(--lw-text)' : 'var(--lw-text-3)',
              boxShadow: active ? '0 1px 2px rgba(15,23,42,.08)' : 'none',
              border: active ? '1px solid var(--lw-border)' : '1px solid transparent',
              cursor: 'pointer',
            }}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}
