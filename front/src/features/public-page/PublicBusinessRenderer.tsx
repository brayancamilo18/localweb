import type { PublicBusiness } from '../../types/api'
import PublicHtmlTemplateFrame from './PublicHtmlTemplateFrame'
import { PubAurora, PubNegocio, PubSoft, type PublicSiteBusiness } from './public-pages'

/** Slugs con plantilla en `front/public/templates/*.html` — mantener alineado con `PublicHtmlTemplateFrame`. */
const HTML_TEMPLATE_SLUGS: Record<string, true> = {
  'noir-elite': true,
  'bloom-studio': true,
  'urban-bold': true,
  'coastal-calm': true,
  'craft-pro': true,
  'tavola-warm': true,
  'tech-sleek': true,
  'trust-clinic': true,
  'versa-studio': true,
  'mono-edito': true,
  'luxe-atelier': true,
}

export function PublicBusinessRenderer({ business }: { business: PublicBusiness }) {
  const slug = (business.template?.slug ?? 'soft').toLowerCase()

  if (slug in HTML_TEMPLATE_SLUGS) {
    return <PublicHtmlTemplateFrame templateSlug={slug} business={business} />
  }
  if (slug === 'aurora') {
    return <PubAurora business={business as PublicSiteBusiness} />
  }
  if (slug === 'negocio') {
    return <PubNegocio business={business as PublicSiteBusiness} />
  }
  return <PubSoft business={business as PublicSiteBusiness} pro={business.is_pro} />
}
