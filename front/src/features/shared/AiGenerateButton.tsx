import { useState } from 'react'
import Icon from '../../components/primitives/Icon'

type Props = {
  onClick: () => void
  loading: boolean
  disabled?: boolean
  label?: string
  /** Variantes restantes hoy. Si es 0 → deshabilitado con tooltip nativo. */
  remaining?: number
}

export default function AiGenerateButton({
  onClick,
  loading,
  disabled,
  label = 'Generar con IA',
  remaining,
}: Props) {
  const [hovered, setHovered] = useState(false)
  const exhausted = typeof remaining === 'number' && remaining <= 0
  const isDisabled = Boolean(disabled) || loading || exhausted

  const title = exhausted
    ? 'Has alcanzado el límite diario de generaciones con IA. Vuelve mañana.'
    : typeof remaining === 'number'
      ? `Te quedan ${remaining} generaciones hoy`
      : undefined

  return (
    <>
      <style>{`@keyframes ai-btn-spin { to { transform: rotate(360deg); } }`}</style>
      <span title={title} style={{ display: 'inline-flex' }}>
        <button
          type="button"
          onClick={onClick}
          disabled={isDisabled}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '7px 14px',
            fontSize: 12,
            fontWeight: 600,
            borderRadius: 10,
            border: `1px solid ${hovered && !isDisabled ? 'rgba(15,110,86,0.4)' : 'rgba(11,31,26,0.1)'}`,
            background: hovered && !isDisabled ? 'rgba(15,110,86,0.04)' : '#fff',
            color: '#0B1F1A',
            cursor: isDisabled ? 'not-allowed' : 'pointer',
            opacity: isDisabled ? 0.65 : 1,
            transition: 'border-color 0.18s, background 0.18s',
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
            font: 'inherit',
            flexShrink: 0,
          }}
        >
          <span style={loading ? { display: 'inline-flex', animation: 'ai-btn-spin 1s linear infinite' } : { display: 'inline-flex' }}>
            <Icon name="sparkle" size={13} color="#0F6E56" />
          </span>
          {loading ? 'Generando…' : label}
        </button>
      </span>
    </>
  )
}
