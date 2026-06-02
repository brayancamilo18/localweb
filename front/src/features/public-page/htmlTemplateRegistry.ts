/** Plantillas servidas desde `front/public/templates/*.html` (iframe). */
export const HTML_TEMPLATE_SRC: Record<string, string> = {
  'noir-elite': '/templates/noir-elite.html',
  'bloom-studio': '/templates/bloom-studio.html',
  'urban-bold': '/templates/urban-bold.html',
  'coastal-calm': '/templates/coastal-calm.html',
  'craft-pro': '/templates/craft-pro.html',
  'tavola-warm': '/templates/tavola-warm.html',
  'tech-sleek': '/templates/tech-sleek.html',
  'trust-clinic': '/templates/trust-clinic.html',
  'versa-studio': '/templates/versa-studio.html',
  'mono-edito': '/templates/mono-edito.html',
  'luxe-atelier': '/templates/luxe-atelier.html',
  'graphite-soft': '/templates/graphite-soft.html',
  'wild-pet': '/templates/wild-pet.html',
  'la-republica-vintage': '/templates/la-republica-vintage.html',
  'kairos-bold': '/templates/kairos-bold.html',
}

export function isHtmlTemplateSlug(slug: string): boolean {
  return slug.toLowerCase() in HTML_TEMPLATE_SRC
}

export function htmlTemplateSrc(slug: string): string {
  const key = slug.toLowerCase()
  return HTML_TEMPLATE_SRC[key] ?? HTML_TEMPLATE_SRC['urban-bold']
}
