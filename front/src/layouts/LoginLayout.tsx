import type { ReactNode } from 'react'
import { Icon, Logo } from '../components/primitives/primitives'

export type AuthFeature = {
  icon: string
  label: string
  /** Texto corto en grid 2×2 del hero móvil (registro). */
  shortLabel?: string
}

const LOGIN_FEATURES: AuthFeature[] = [
  { icon: 'barChart', label: 'Estadísticas en vivo' },
  { icon: 'shield', label: 'Web segura 24/7' },
  { icon: 'users', label: 'Soporte en español' },
]

export const REGISTER_FEATURES: AuthFeature[] = [
  { icon: 'check', label: 'Plantilla profesional, lista en minutos', shortLabel: 'Plantilla lista en minutos' },
  { icon: 'image', label: 'Galería, horarios y mapa integrados', shortLabel: 'Galería, horarios y mapa' },
  { icon: 'whatsapp', label: 'Reservas por WhatsApp con un clic', shortLabel: 'Reservas por WhatsApp' },
  { icon: 'smartphone', label: 'Adaptada al móvil automáticamente', shortLabel: 'Adaptada al móvil' },
]

export type LoginLayoutProps = {
  children: ReactNode
  cardTitle?: string
  cardSubtitle?: string
  heroBadge?: string | null
  heroTitle?: ReactNode
  heroSub?: string
  heroTitleNowrap?: boolean
  features?: AuthFeature[]
  /** Tipografía del panel izquierdo más grande (registro). */
  variant?: 'login' | 'register' | 'verify-email'
}

const VERIFY_EMAIL_STATS = [
  { value: '10 min', label: 'tiempo medio' },
  { value: '4.9★', label: 'en App Store' },
  { value: '0€', label: 'para empezar' },
] as const

export function LoginLayout({
  children,
  cardTitle = 'Inicia sesión',
  cardSubtitle = 'Bienvenido de vuelta. Accede a tu panel.',
  heroBadge = null,
  heroTitle = 'Hola de nuevo.',
  heroSub = 'Tu web, bajo control. Inicia sesión para gestionarla.',
  heroTitleNowrap = true,
  features = LOGIN_FEATURES,
  variant = 'login',
}: LoginLayoutProps) {
  const year = new Date().getFullYear()
  const isRegister = variant === 'register'
  const isVerifyEmail = variant === 'verify-email'
  const titleClass =
    heroTitleNowrap && variant === 'login'
      ? 'lw-login-page__hero-title lw-login-page__hero-title--nowrap'
      : 'lw-login-page__hero-title'
  const featureIconSize = isRegister ? 20 : 18
  const badgeIconSize = isRegister ? 16 : 14
  const logoSize = isRegister ? 156 : 140

  return (
    <main
      className={`lw-login-page${isRegister ? ' lw-login-page--register' : ''}${isVerifyEmail ? ' lw-login-page--verify-email' : ''}`}
    >
      <header className="lw-login-page__hero">
        <div className="lw-login-page__hero-glow lw-login-page__hero-glow--tr" aria-hidden />
        <div className="lw-login-page__hero-glow lw-login-page__hero-glow--bl" aria-hidden />

        <div className="lw-login-page__hero-logo">
          <Logo size={logoSize} onDark className="lw-login-page__hero-brand" />
        </div>

        <div className="lw-login-page__hero-body">
          {heroBadge ? (
            <p className="lw-login-page__hero-badge">
              <Icon name="sparkle" size={badgeIconSize} color="var(--lw-login-mint)" />
              {heroBadge}
            </p>
          ) : null}
          <h1 className={titleClass}>{heroTitle}</h1>
          <p className="lw-login-page__hero-sub">{heroSub}</p>

          {isVerifyEmail ? (
            <dl className="lw-login-page__hero-stats">
              {VERIFY_EMAIL_STATS.map((s) => (
                <div key={s.label} className="lw-login-page__hero-stat">
                  <dt className="lw-login-page__hero-stat-value">{s.value}</dt>
                  <dd className="lw-login-page__hero-stat-label">{s.label}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <ul className="lw-login-page__features">
              {features.map((f) => (
                <li key={f.label} className="lw-login-page__feature">
                  <Icon name={f.icon} size={featureIconSize} color="var(--lw-login-mint)" />
                  <span className="lw-login-page__feature-label lw-login-page__feature-label--full">{f.label}</span>
                  <span className="lw-login-page__feature-label lw-login-page__feature-label--short">
                    {f.shortLabel ?? f.label}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <p className="lw-login-page__hero-footer lw-login-page__hero-footer--desktop">
          © {year} ONEZ · Hecho en Madrid
        </p>
      </header>

      <section className="lw-login-page__panel">
        <div className="lw-login-page__card">
          <div className="lw-login-page__card-intro lw-login-page__card-intro--desktop">
            <h2 className="lw-login-page__card-title">{cardTitle}</h2>
            <p className="lw-login-page__card-sub">{cardSubtitle}</p>
          </div>
          {children}
        </div>
      </section>

      <footer className="lw-login-page__mobile-footer">
        <p>© {year} ONEZ · Hecho en Madrid</p>
      </footer>
    </main>
  )
}
