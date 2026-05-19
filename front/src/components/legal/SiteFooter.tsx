import { LegalFooterLinks } from './LegalFooterLinks'

/** Pie legal visible en páginas de la app (dashboard, etc.). */
export function SiteFooter() {
  return (
    <footer
      style={{
        marginTop: 'auto',
        padding: '24px 20px 32px',
        borderTop: '1px solid var(--lw-border)',
        background: 'var(--lw-bg)',
      }}
    >
      <LegalFooterLinks />
    </footer>
  )
}
