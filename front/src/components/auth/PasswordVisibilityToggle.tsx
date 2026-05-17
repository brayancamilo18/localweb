type PasswordVisibilityToggleProps = {
  visible: boolean
  onToggle: () => void
  /** Guardar posición del cursor antes del click (fallback sin máscara CSS). */
  onCaptureSelection?: () => void
  labelShow?: string
  labelHide?: string
}

function EyeIcon({ crossed }: { crossed: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
      {crossed ? <line x1="4" y1="4" x2="20" y2="20" /> : null}
    </svg>
  )
}

export function PasswordVisibilityToggle({
  visible,
  onToggle,
  onCaptureSelection,
  labelShow = 'Mostrar contraseña',
  labelHide = 'Ocultar contraseña',
}: PasswordVisibilityToggleProps) {
  return (
    <button
      type="button"
      className="lw-password-toggle"
      onMouseDown={(e) => {
        e.preventDefault()
        onCaptureSelection?.()
      }}
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        onToggle()
      }}
      aria-label={visible ? labelHide : labelShow}
      aria-pressed={visible}
    >
      <EyeIcon crossed={visible} />
    </button>
  )
}
