import { Navigate, useLocation } from 'react-router-dom'

/**
 * /dashboard/billing → /dashboard/account?tab=plan
 *
 * Esta ruta solía renderizar la pantalla `Suscripcion`. La hemos absorbido
 * dentro de la nueva página «Mi cuenta» en el tab `plan`. Mantenemos esta
 * redirección para no romper:
 *   - enlaces internos antiguos
 *   - URLs guardadas por usuarios en bookmarks
 *   - la `success_url` del portal de Stripe Cashier que apunta aquí
 *     (`config('app.frontend_url').'/dashboard/billing'` en BillingController@portal)
 *
 * Preservamos cualquier query string que venga del callback de Stripe
 * (por ejemplo `?billing=success` lo gestiona el onboarding antes de llegar aquí,
 * pero por si acaso). Si el caller ya trae un `tab` propio, lo respetamos.
 */
export default function BillingRedirect() {
  const location = useLocation()
  const incoming = new URLSearchParams(location.search)
  if (!incoming.has('tab')) {
    incoming.set('tab', 'plan')
  }
  return <Navigate to={`/dashboard/account?${incoming.toString()}`} replace />
}
