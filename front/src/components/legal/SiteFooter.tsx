import { LegalFooterLinks } from './LegalFooterLinks'

/** Pie legal visible en páginas de la app (dashboard, etc.). */
export function SiteFooter() {
  return (
    <footer className="lw-site-footer">
      <LegalFooterLinks />
    </footer>
  )
}
