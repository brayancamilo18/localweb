import { useEffect, useRef, useState } from 'react'
import { getColorDisplayName } from '../../lib/hexColorName'

type Props = {
  value: string | null
  disabled?: boolean
  /** Se llama con cualquier hex válido (#rrggbb), aunque el contraste sea bajo. */
  onValidColor: (hex: string) => void
  onDraftChange?: (hex: string) => void
}

const DEBOUNCE_MS = 220

export default function BrandColorCustomInput({
  value,
  disabled = false,
  onValidColor,
  onDraftChange,
}: Props) {
  const [draft, setDraft] = useState<string>(() => normalizeHex(value) ?? '#888888')
  const timerRef = useRef<number | null>(null)

  useEffect(() => {
    const next = normalizeHex(value)
    if (next && next !== draft) setDraft(next)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  const colorName = getColorDisplayName(draft)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = e.target.value.toLowerCase()
    if (!/^#[0-9a-f]{6}$/.test(next)) return
    setDraft(next)
    onDraftChange?.(next)
    if (timerRef.current) window.clearTimeout(timerRef.current)
    timerRef.current = window.setTimeout(() => {
      onValidColor(next)
    }, DEBOUNCE_MS)
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: '14px 16px',
        borderRadius: 14,
        background: 'color-mix(in srgb, var(--lw-text) 5%, transparent)',
        boxShadow: 'inset 0 0 0 1px color-mix(in srgb, var(--lw-text) 8%, transparent)',
      }}
    >
      <label
        htmlFor="lw-brand-custom-color"
        style={{
          position: 'relative',
          width: 44,
          height: 44,
          borderRadius: 12,
          background: draft,
          boxShadow: 'inset 0 0 0 1px color-mix(in srgb, var(--lw-text) 15%, transparent)',
          cursor: disabled ? 'not-allowed' : 'pointer',
          flexShrink: 0,
          overflow: 'hidden',
        }}
      >
        <input
          id="lw-brand-custom-color"
          type="color"
          value={draft}
          onChange={handleChange}
          disabled={disabled}
          aria-label="Elegir un color personalizado"
          style={{
            position: 'absolute',
            inset: 0,
            opacity: 0,
            border: 'none',
            cursor: disabled ? 'not-allowed' : 'pointer',
          }}
        />
      </label>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 12,
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color: 'color-mix(in srgb, var(--lw-text) 60%, transparent)',
          }}
        >
          Color personalizado
        </div>
        <div style={{ marginTop: 4, fontSize: 14, fontWeight: 600, color: 'var(--lw-text)' }}>
          {colorName}{' '}
          <span style={{ fontWeight: 400, color: 'color-mix(in srgb, var(--lw-text) 55%, transparent)' }}>
            {draft}
          </span>
        </div>
      </div>
    </div>
  )
}

function normalizeHex(value: string | null): string | null {
  if (!value) return null
  const v = value.trim().toLowerCase()
  return /^#[0-9a-f]{6}$/.test(v) ? v : null
}
