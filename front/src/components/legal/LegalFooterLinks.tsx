import { Link } from 'react-router-dom'
import { legalRoutes, legalSupportEmail } from '../../lib/legal'

type LegalFooterLinksProps = {
  className?: string
  /** En panel oscuro (login/register) */
  variant?: 'default' | 'onDark'
}

export function LegalFooterLinks({ className, variant = 'default' }: LegalFooterLinksProps) {
  const linkColor = variant === 'onDark' ? 'var(--lw-login-mint, #5DCAA5)' : 'var(--lw-accent)'
  const mutedColor = variant === 'onDark' ? 'rgba(255,255,255,0.72)' : 'var(--lw-text-3)'

  const linkStyle: React.CSSProperties = {
    color: linkColor,
    textDecoration: 'none',
    fontSize: 13,
    lineHeight: 1.5,
  }

  return (
    <nav
      className={className}
      aria-label="Enlaces legales"
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '8px 16px',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 13,
        color: mutedColor,
      }}
    >
      <Link to={legalRoutes.avisoLegal} style={linkStyle}>
        Aviso Legal
      </Link>
      <Link to={legalRoutes.privacidad} style={linkStyle}>
        Política de Privacidad
      </Link>
      <Link to={legalRoutes.cookies} style={linkStyle}>
        Política de Cookies
      </Link>
      <Link to={legalRoutes.terminos} style={linkStyle}>
        Términos y Condiciones
      </Link>
      <a href={`mailto:${legalSupportEmail}`} style={linkStyle}>
        {legalSupportEmail}
      </a>
    </nav>
  )
}
