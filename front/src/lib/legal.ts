/** Textos y rutas legales (RGPD Art. 13). Configura nombre y NIF en VITE_LEGAL_* */

export const legalEntityName =
  (import.meta.env.VITE_LEGAL_ENTITY_NAME as string | undefined)?.trim() || '[TU NOMBRE]'

export const legalEntityNif =
  (import.meta.env.VITE_LEGAL_ENTITY_NIF as string | undefined)?.trim() || '[TU NIF]'

export const legalPrivacyEmail = 'privacidad@onez.es'
export const legalSupportEmail = 'soporte@onez.es'

export const legalRoutes = {
  avisoLegal: '/aviso-legal',
  privacidad: '/privacidad',
  cookies: '/cookies',
  terminos: '/terminos',
} as const

export type LegalDocSlug = keyof typeof legalRoutes

export const legalDocTitles: Record<LegalDocSlug, string> = {
  avisoLegal: 'Aviso Legal',
  privacidad: 'Política de Privacidad',
  cookies: 'Política de Cookies',
  terminos: 'Términos y Condiciones',
}

/** Debe coincidir con LEGAL_*_VERSION del backend al registrar. */
export const legalTermsVersion =
  (import.meta.env.VITE_LEGAL_TERMS_VERSION as string | undefined)?.trim() || '2026-05-19'

export const legalPrivacyVersion =
  (import.meta.env.VITE_LEGAL_PRIVACY_VERSION as string | undefined)?.trim() || '2026-05-19'

export const legalEntityAddress =
  (import.meta.env.VITE_LEGAL_ENTITY_ADDRESS as string | undefined)?.trim() ||
  '[DIRECCION_TITULAR]'

/** Fecha mostrada en el pie de cada documento legal. */
export const legalLastUpdate =
  (import.meta.env.VITE_LEGAL_LAST_UPDATE as string | undefined)?.trim() || '19 de mayo de 2026'
