type ToggleProps = {
  checked: boolean
  onChange: (v: boolean) => void
  label?: string
  disabled?: boolean
}

export default function Toggle({ checked, onChange, label, disabled }: ToggleProps) {
  const w = 36
  const h = 22

  return (
    <button
      type="button"
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: 'transparent', border: 'none', padding: 0, cursor: disabled ? 'not-allowed' : 'pointer' }}
    >
      <span
        style={{
          width: w,
          height: h,
          borderRadius: 999,
          position: 'relative',
          background: checked ? 'var(--lw-accent)' : '#CBD5E1',
          transition: 'background .15s',
          opacity: disabled ? 0.6 : 1,
        }}
      >
        <span
          style={{
            position: 'absolute',
            top: 2,
            left: checked ? w - h + 2 : 2,
            width: h - 4,
            height: h - 4,
            background: '#fff',
            borderRadius: 999,
            boxShadow: '0 1px 2px rgba(15,23,42,.2)',
            transition: 'left .15s',
          }}
        />
      </span>
      {label ? <span style={{ fontSize: 13, color: 'var(--lw-text-2)' }}>{label}</span> : null}
    </button>
  )
}
