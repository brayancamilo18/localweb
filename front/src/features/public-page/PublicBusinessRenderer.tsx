import type { PublicBusiness } from '../../types/api'
import { isHtmlTemplateSlug } from './htmlTemplateRegistry'
import PublicHtmlTemplateFrame from './PublicHtmlTemplateFrame'
import { PubAurora, PubNegocio, PubSoft, type PublicSiteBusiness } from './public-pages'

export function PublicBusinessRenderer({ business }: { business: PublicBusiness }) {
  const slug = (business.template?.slug ?? 'soft').toLowerCase()

  if (isHtmlTemplateSlug(slug)) {
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
