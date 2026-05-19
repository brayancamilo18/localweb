import { Link } from 'react-router-dom'
import { legalRoutes } from '../../lib/legal'

type LegalLinkKind = 'terminos' | 'avisoLegal' | 'privacidad' | 'cookies'

const hrefByKind: Record<LegalLinkKind, string> = {
  terminos: legalRoutes.terminos,
  avisoLegal: legalRoutes.avisoLegal,
  privacidad: legalRoutes.privacidad,
  cookies: legalRoutes.cookies,
}

export function LegalInlineLink({
  kind,
  children,
}: {
  kind: LegalLinkKind
  children: React.ReactNode
}) {
  return (
    <Link to={hrefByKind[kind]} style={{ color: 'var(--lw-accent)', textDecoration: 'underline' }}>
      {children}
    </Link>
  )
}
