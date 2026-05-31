import type { Business, User } from '../types/api'

/** Usuario OAuth (p. ej. Google) que aún no ha enviado negocio + términos. */
export function needsSocialRegistrationCompletion(
  user: User | null | undefined,
  business: Business | null | undefined,
): boolean {
  if (!user?.provider) return false

  return business == null || user?.terms_accepted_at == null || user.terms_accepted_at === ''
}

/** Ruta tras login/registro según estado de cuenta y negocio. */
export function postAuthDestination(
  user: User | null | undefined,
  business: Business | null | undefined,
  hasCompletedOnboarding: boolean,
): string {
  if (user?.is_admin) return '/admin'
  if (user && user.email_verified_at == null) return '/verify-email'
  if (needsSocialRegistrationCompletion(user, business)) return '/register/social'
  if (hasCompletedOnboarding) return '/dashboard'

  return '/onboarding'
}
