import { useParams, Navigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getPublicBusiness } from '../../api/public'
import { keys } from '../../api/queryKeys'
import type { PublicBusiness } from '../../types/api'
import PublicHtmlTemplateFrame from './PublicHtmlTemplateFrame'
import { PubAurora, PubNegocio, PubSoft, type PublicSiteBusiness } from './public-pages'

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

function PublicSkeleton() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--lw-bg)' }}>
      <div className="lw-shimmer" style={{ height: 56, marginBottom: 0 }} />
      <div style={{ padding: 24 }}>
        <div className="lw-shimmer" style={{ height: 320, borderRadius: 12, marginBottom: 20 }} />
        <div className="lw-shimmer" style={{ height: 20, borderRadius: 4, maxWidth: '50%', marginBottom: 12 }} />
        <div className="lw-shimmer" style={{ height: 14, borderRadius: 4, maxWidth: '80%' }} />
      </div>
    </div>
  )
}

export default function PublicPage() {
  const { subdomain } = useParams()

  if (!subdomain || RESERVED_SUBDOMAINS.has(subdomain.toLowerCase())) {
    return <Navigate to="/" replace />
  }

  const { data, isLoading, isError } = useQuery({
    queryKey: keys.public(subdomain),
    queryFn: () => getPublicBusiness(subdomain),
    retry: false,
  })

  const business = data as PublicBusiness | undefined

  if (isLoading) {
    return <PublicSkeleton />
  }

  if (isError || !business) {
    return (
      <div style={{ padding: 48, textAlign: 'center' }}>
        <h1 style={{ fontSize: 22 }}>Página no encontrada</h1>
        <p style={{ color: 'var(--lw-text-2)', marginTop: 8 }}>Este subdominio no existe o no está publicado.</p>
      </div>
    )
  }

  const slug = (business.template?.slug ?? 'soft').toLowerCase()

  if (slug === 'noir-elite' || slug === 'bloom-studio') {
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
