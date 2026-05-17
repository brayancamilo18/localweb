import { useEffect, useState, type CSSProperties } from 'react'
import { getConsent, onConsentChange, resetConsent } from '../../lib/cookieConsent'

type Props = {
  style?: CSSProperties
  className?: string
}

/** Enlace discreto para reabrir el banner (solo si ya hubo consentimiento previo). */
export function ManageCookiesLink({ style, className }: Props) {
  const [visible, setVisible] = useState(() => getConsent() !== null)

  useEffect(() => onConsentChange((c) => setVisible(c !== null)), [])

  if (!visible) return null

  return (
    <button
      type="button"
      className={className}
      onClick={() => resetConsent()}
      style={{
        background: 'none',
        border: 'none',
        padding: 0,
        font: 'inherit',
        fontSize: 11,
        opacity: 0.6,
        cursor: 'pointer',
        textDecoration: 'underline',
        color: 'inherit',
        ...style,
      }}
    >
      Gestionar cookies
    </button>
  )
}
