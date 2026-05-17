import { useParams, Navigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getPublicBusiness } from '../../api/public'
import { keys } from '../../api/queryKeys'
import { PublicBusinessRenderer } from './PublicBusinessRenderer'
import { PublicPageSkeleton } from './PublicPageSkeleton'

// keep in sync with backend config/subdomains.php (GET /api/v1/public/subdomain-rules)
const RESERVED_SUBDOMAINS = new Set([
  'admin', 'api', 'www', 'mail', 'cdn', 'support', 'help',
  'blog', 'login', 'register', 'dashboard', 'onboarding',
  'app', 'static', 'assets', 'media', 'images', 'img',
  'docs', 'status', 'billing', 'stripe', 'webhook',
  'webhooks', 'auth', 'oauth', 'localweb', 'tenant',
  'tenants', 'public', 'private', 'test', 'staging',
  'dev', 'demo',
])

export default function PublicPage() {
  const { subdomain } = useParams()

  if (!subdomain || RESERVED_SUBDOMAINS.has(subdomain.toLowerCase())) {
    return <Navigate to="/" replace />
  }

  const { data: business, isLoading, isError } = useQuery({
    queryKey: keys.public(subdomain),
    queryFn: () => getPublicBusiness(subdomain),
    retry: false,
  })

  if (isLoading) {
    return <PublicPageSkeleton />
  }

  if (isError || !business) {
    return (
      <div style={{ padding: 48, textAlign: 'center' }}>
        <h1 style={{ fontSize: 22 }}>Página no encontrada</h1>
        <p style={{ color: 'var(--lw-text-2)', marginTop: 8 }}>Este subdominio no existe o no está publicado.</p>
      </div>
    )
  }

  return <PublicBusinessRenderer business={business} />
}
