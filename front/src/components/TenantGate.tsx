import { useEffect, useState, type ReactNode } from 'react'
import { apiClient } from '../api/client'
import { getOnezHomeUrl, getTenantFromHostname } from '../lib/tenant'

type GateState = 'loading' | 'ok' | 'not-found'

function TenantGateLoading() {
  return (
    <div
      role="status"
      aria-label="Cargando"
      style={{
        minHeight: '100svh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--lw-bg)',
      }}
    >
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: '50%',
          border: '3px solid var(--lw-border)',
          borderTopColor: 'var(--lw-accent)',
          animation: 'lw-tenant-spin 0.7s linear infinite',
        }}
      />
      <style>{`
        @keyframes lw-tenant-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

export function TenantNotFound() {
  const homeUrl = getOnezHomeUrl()

  return (
    <main
      style={{
        minHeight: '100svh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        textAlign: 'center',
        background: 'var(--lw-bg)',
        color: 'var(--lw-text)',
        boxSizing: 'border-box',
      }}
    >
      <h1
        style={{
          margin: 0,
          fontSize: 'clamp(1.75rem, 5vw, 2.5rem)',
          fontWeight: 700,
          letterSpacing: '-0.02em',
        }}
      >
        Sitio no encontrado
      </h1>
      <p
        style={{
          margin: '16px 0 0',
          maxWidth: 420,
          fontSize: 16,
          lineHeight: 1.55,
          color: 'var(--lw-text-3)',
        }}
      >
        El subdominio que has visitado no corresponde a ningún negocio en ONEZ.
      </p>
      <a
        href={homeUrl}
        style={{
          marginTop: 28,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '12px 20px',
          borderRadius: 10,
          background: 'var(--lw-accent)',
          color: '#fff',
          fontWeight: 600,
          fontSize: 15,
          textDecoration: 'none',
        }}
      >
        Ir a ONEZ
      </a>
    </main>
  )
}

export function TenantGate({ children }: { children: ReactNode }) {
  const [state, setState] = useState<GateState>('loading')

  useEffect(() => {
    const subdomain = getTenantFromHostname()

    if (!subdomain) {
      setState('ok')
      return
    }

    let cancelled = false

    apiClient
      .get<{ exists: boolean }>(`/public/tenants/${encodeURIComponent(subdomain)}/exists`)
      .then((res) => {
        if (cancelled) return
        setState(res.status === 200 ? 'ok' : 'not-found')
      })
      .catch((err: { response?: { status?: number } }) => {
        if (cancelled) return
        const status = err?.response?.status
        setState(status === 404 ? 'not-found' : 'ok')
      })

    return () => {
      cancelled = true
    }
  }, [])

  if (state === 'loading') {
    return <TenantGateLoading />
  }

  if (state === 'not-found') {
    return <TenantNotFound />
  }

  return <>{children}</>
}
