import type { ReactNode } from 'react'
import { Icon, Logo } from '../components/primitives/primitives'

const STATS = [
  { value: '10 min', label: 'tiempo medio' },
  { value: '4.9★', label: 'en App Store' },
  { value: '0€', label: 'para empezar' },
] as const

type ForgotPasswordLayoutProps = {
  children: ReactNode
}

export function ForgotPasswordLayout({ children }: ForgotPasswordLayoutProps) {
  const year = new Date().getFullYear()

  return (
    <main className="lw-forgot-page">
      <section className="lw-forgot-page__form-side">
        <div className="lw-forgot-page__card">{children}</div>
      </section>

      <aside className="lw-forgot-page__hero">
        <div className="lw-forgot-page__hero-glow lw-forgot-page__hero-glow--tr" aria-hidden />
        <div className="lw-forgot-page__hero-glow lw-forgot-page__hero-glow--bl" aria-hidden />

        <div className="lw-forgot-page__hero-logo">
          <Logo size={140} onDark className="lw-forgot-page__hero-brand" />
        </div>

        <div className="lw-forgot-page__hero-claim">
          <p className="lw-forgot-page__hero-badge">
            <Icon name="sparkle" size={14} color="var(--lw-login-mint)" />
            +12.000 negocios confían en ONEZ
          </p>
          <h1 className="lw-forgot-page__hero-title">Tu web profesional en menos de 10 minutos.</h1>
          <p className="lw-forgot-page__hero-sub">
            Sin saber programar. Sin diseñador. Solo responde unas preguntas y ONEZ hace el resto.
          </p>
        </div>

        <dl className="lw-forgot-page__stats">
          {STATS.map((s) => (
            <div key={s.label} className="lw-forgot-page__stat">
              <dt className="lw-forgot-page__stat-value">{s.value}</dt>
              <dd className="lw-forgot-page__stat-label">{s.label}</dd>
            </div>
          ))}
        </dl>
      </aside>

      <footer className="lw-forgot-page__mobile-footer">
        <p>© {year} ONEZ · Hecho en Madrid</p>
      </footer>
    </main>
  )
}
