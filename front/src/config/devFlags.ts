/**
 * TEMP: permite abrir /onboarding sin login en desarrollo.
 * Pon en false y borra este archivo si ya no lo necesitas.
 * Solo tiene efecto cuando import.meta.env.DEV es true (nunca en build de producción).
 */
export const DEV_ONBOARDING_PREVIEW_WITHOUT_AUTH = false

export function isOnboardingPreviewWithoutAuth(): boolean {
  return import.meta.env.DEV && DEV_ONBOARDING_PREVIEW_WITHOUT_AUTH
}
