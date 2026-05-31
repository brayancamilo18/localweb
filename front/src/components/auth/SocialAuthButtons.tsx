import { startGoogleOAuth } from '../../lib/socialAuth'
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
    <div className="lw-login-page__social-grid" style={{ gridTemplateColumns: '1fr' }}>
      <Btn
        kind="outline"
        size="lg"
        type="button"
        fullWidth
        onClick={() => startGoogleOAuth()}
        style={{ height: 48 }}
      >
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <SocialGoogle /> Google
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
