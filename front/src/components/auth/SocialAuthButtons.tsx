import { Btn } from '../primitives/primitives'

function SocialGoogle() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.6 12.2c0-.7-.1-1.4-.2-2H12v3.8h5.9c-.3 1.4-1 2.5-2.2 3.3v2.7h3.5c2-1.9 3.4-4.7 3.4-7.8z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.9 0 5.4-.9 7.2-2.5l-3.5-2.7c-1 .7-2.2 1-3.7 1-2.8 0-5.2-1.9-6.1-4.5H2.3v2.8C4.1 20.5 7.8 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.9 14.3c-.2-.7-.4-1.4-.4-2.3s.1-1.6.4-2.3V6.9H2.3C1.5 8.4 1 10.1 1 12s.5 3.6 1.3 5.1l3.6-2.8z"
      />
      <path
        fill="#EA4335"
        d="M12 5.4c1.6 0 3 .5 4.1 1.6l3.1-3.1C17.4 2.1 14.9 1 12 1 7.8 1 4.1 3.5 2.3 6.9l3.6 2.8c.9-2.6 3.3-4.3 6.1-4.3z"
      />
    </svg>
  )
}

function SocialApple() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M17.05 12.04c-.03-3.07 2.5-4.55 2.62-4.62-1.43-2.09-3.66-2.38-4.45-2.41-1.9-.19-3.7 1.12-4.66 1.12-.97 0-2.45-1.09-4.04-1.06-2.07.03-3.99 1.21-5.06 3.07-2.16 3.74-.55 9.27 1.55 12.31 1.03 1.49 2.25 3.16 3.85 3.1 1.55-.06 2.13-1 4-1 1.86 0 2.4 1 4.03.97 1.66-.03 2.71-1.51 3.73-3 .96-1.4 1.36-2.77 1.39-2.84-.03-.01-2.66-1.02-2.69-4.04zM14.36 3.94c.85-1.04 1.43-2.49 1.27-3.94-1.23.05-2.72.82-3.61 1.86-.79.91-1.49 2.39-1.3 3.81 1.37.11 2.79-.7 3.64-1.73z" />
    </svg>
  )
}

type SocialAuthButtonsProps = {
  dividerLabel?: string
  /** `top`: botones y divisor debajo (login). `bottom`: divisor y botones debajo del formulario (registro). */
  placement?: 'top' | 'bottom'
}

function SocialDivider({ label }: { label: string }) {
  return (
    <div className="lw-login-page__divider">
      <span className="lw-login-page__divider-line" />
      <span>{label}</span>
      <span className="lw-login-page__divider-line" />
    </div>
  )
}

function SocialGrid() {
  return (
    <div className="lw-login-page__social-grid">
      <Btn kind="outline" size="lg" type="button" disabled title="Próximamente" style={{ height: 48 }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <SocialGoogle /> Google
        </span>
      </Btn>
      <Btn kind="dark" size="lg" type="button" disabled title="Próximamente" style={{ height: 48 }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <SocialApple /> Apple
        </span>
      </Btn>
    </div>
  )
}

export function SocialAuthButtons({
  dividerLabel = 'o con tu email',
  placement = 'top',
}: SocialAuthButtonsProps) {
  const wrapClass =
    placement === 'bottom'
      ? 'lw-login-page__social lw-login-page__social--bottom'
      : 'lw-login-page__social lw-login-page__social--top'

  if (placement === 'bottom') {
    return (
      <div className={wrapClass}>
        <SocialDivider label={dividerLabel} />
        <SocialGrid />
      </div>
    )
  }

  return (
    <div className={wrapClass}>
      <SocialGrid />
      <SocialDivider label={dividerLabel} />
    </div>
  )
}
