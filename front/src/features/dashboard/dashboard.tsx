import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState, type ReactNode } from 'react'
import { logout as logoutApi } from '../../api/auth'
import { postCheckout } from '../../api/billing'
import type { Business } from '../../types/api'
import { Icon, Btn, Card } from '../../components/primitives/primitives'
import { useAuthStore } from '../../store/authStore'
import './dashboard.css'

// LocalWeb — Dashboard (Free vs Pro)

export interface DashboardProps {
  pro: boolean
  business?: Business
  children: ReactNode
}

function DashSidebar({
  pro,
  businessName,
  onNavigateItem,
}: {
  pro: boolean
  businessName?: string
  onNavigateItem?: () => void
}) {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const clearAuth = useAuthStore((s) => s.clearAuth)
  const checkoutM = useMutation({
    mutationFn: postCheckout,
    onSuccess: (url) => {
      window.location.href = url
    },
    onError: () => {
      navigate('/dashboard/billing')
    },
  })

  async function handleLogout() {
    try {
      await logoutApi()
    } catch {
      /* invalidar sesión local aunque falle la API */
    }
    clearAuth()
    qc.clear()
    navigate('/login', { replace: true })
  }

  const items = [
    { icon: 'home', t: 'Mi página', to: '/dashboard', end: true },
    { icon: 'edit', t: 'Editar', to: '/dashboard/editor' },
    { icon: 'image', t: 'Imágenes', to: '/dashboard/images' },
    { icon: 'clock', t: 'Horarios', to: '/dashboard/schedule' },
    { icon: 'list', t: 'Servicios', to: '/dashboard/services' },
    { icon: 'arrowUpRight', t: 'Enlaces Pro', to: '/dashboard/enlaces' },
    { icon: 'barChart', t: 'Estadísticas', to: '/dashboard/stats', locked: !pro },
    { icon: 'creditCard', t: 'Suscripción', to: '/dashboard/billing' },
    { icon: 'shield', t: 'Seguridad', to: '/dashboard/security' },
  ] as const
  return (
    <aside
      className="lw-dashboard-sidebar"
      style={{
        width: 240,
        flexShrink: 0,
        alignSelf: 'stretch',
        background: 'var(--lw-bg-elev)',
        borderRight: '1px solid var(--lw-border)',
        display: 'flex',
        flexDirection: 'column',
        padding: '20px 12px',
        minHeight: 0,
      }}
    >
      <div style={{ padding: "0 8px 18px", fontSize: 13, fontWeight: 600, color: 'var(--lw-text)' }}>
        {businessName ?? 'LocalWeb'}
      </div>
      <nav style={{ display: "flex", flexDirection: "column", gap: 2, flex: 1 }}>
        {items.map((it) => (
          <NavLink
            key={it.to}
            to={it.to}
            end={Boolean((it as { end?: boolean }).end)}
            onClick={onNavigateItem}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '8px 10px',
              borderRadius: 'var(--lw-r-sm)',
              fontSize: 13.5,
              fontWeight: 500,
              textDecoration: 'none',
              background: isActive ? 'var(--lw-surface)' : 'transparent',
              color: isActive ? 'var(--lw-text)' : 'var(--lw-text-2)',
              pointerEvents: 'locked' in it && it.locked ? 'none' : 'auto',
              opacity: 'locked' in it && it.locked ? 0.55 : 1,
            })}
          >
            {({ isActive }) => (
              <>
                <Icon
                  name={it.icon}
                  size={16}
                  color={isActive ? 'var(--lw-accent)' : 'var(--lw-text-3)'}
                />
                <span style={{ flex: 1 }}>{it.t}</span>
                {'locked' in it && it.locked ? <Icon name="lock" size={12} color="var(--lw-text-4)" /> : null}
              </>
            )}
          </NavLink>
        ))}
      </nav>
      {pro ? (
        <div style={{
          padding: 12, borderRadius: "var(--lw-r-sm)",
          background: "var(--lw-pro-soft)", border: "1px solid #FCD34D",
          display: "flex", alignItems: "center", gap: 8,
        }}>
          <Icon name="sparkle" size={14} color="var(--lw-pro)"/>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#78350F" }}>Plan Pro</div>
            <div style={{ fontSize: 11, color: "#92400E" }}>Renueva 12 nov</div>
          </div>
        </div>
      ) : (
        <Card padding={12} style={{ background: "var(--lw-surface)", border: "none" }}>
          <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Plan Gratis</div>
          <div className="lw-small" style={{ marginBottom: 10, fontSize: 11.5 }}>
            Más fotos, dominio propio y estadísticas.
          </div>
          <Btn
            type="button"
            size="sm"
            kind="primary"
            fullWidth
            iconRight="arrowRight"
            loading={checkoutM.isPending}
            onClick={() => checkoutM.mutate()}
          >
            Pasa a Pro
          </Btn>
        </Card>
      )}
      <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--lw-border)' }}>
        <Btn type="button" kind="ghost" size="sm" fullWidth icon="logOut" onClick={() => void handleLogout()}>
          Cerrar sesión
        </Btn>
      </div>
    </aside>
  )
}

function StatCard({
  label,
  value,
  delta,
  deltaTone = 'success',
  icon,
  locked,
}: {
  label: string
  value: string
  delta?: string
  deltaTone?: 'success' | 'danger'
  icon: string
  locked?: boolean
}) {
  return (
    <Card padding={16} style={{
      display: "flex", flexDirection: "column", gap: 14,
      opacity: locked ? .6 : 1,
      position: "relative",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span className="lw-small">{label}</span>
        <Icon name={icon} size={14} color="var(--lw-text-4)"/>
      </div>
      <div style={{ fontSize: 26, fontWeight: 600, letterSpacing: "-0.02em", fontVariantNumeric: "tabular-nums" }}>
        {locked ? "—" : value}
      </div>
      {!locked && delta && (
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <Icon name="trending" size={12} color={deltaTone === "success" ? "var(--lw-success)" : "var(--lw-danger)"}/>
          <span style={{ fontSize: 11.5, color: deltaTone === "success" ? "var(--lw-success)" : "var(--lw-danger)", fontWeight: 600 }}>{delta}</span>
          <span className="lw-small">vs. semana anterior</span>
        </div>
      )}
    </Card>
  );
}

// Mini line chart
function MiniLine({ data, color = 'var(--lw-accent)', h = 80 }: { data: number[]; color?: string; h?: number }) {
  const max = Math.max(...data, 1)
  const denom = Math.max(data.length - 1, 1)
  const pts = data.map((v, i) => `${(i / denom) * 100},${100 - (v / max) * 90 - 5}`).join(" ");
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ width: "100%", height: h }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke"/>
      <polyline points={`0,100 ${pts} 100,100`} fill={color} opacity=".08" stroke="none"/>
    </svg>
  );
}

function Dashboard({ pro, business, children }: DashboardProps) {
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  return (
    <div className="lw-dashboard-shell">
      <div className={`lw-dashboard-overlay${menuOpen ? ' is-open' : ''}`} onClick={() => setMenuOpen(false)} />
      <div className={`lw-dashboard-drawer${menuOpen ? ' is-open' : ''}`}>
        <DashSidebar pro={pro} businessName={business?.name} onNavigateItem={() => setMenuOpen(false)} />
      </div>
      <div className="lw-dashboard-desktop-sidebar">
        <DashSidebar pro={pro} businessName={business?.name} />
      </div>
      <main
        className="lw-scroll lw-dashboard-main"
        style={{
          flex: 1,
          minWidth: 0,
          minHeight: 0,
          overflow: 'auto',
          padding: '20px 24px 56px',
        }}
      >
        <div className="lw-dashboard-mobilebar">
          <Btn kind="outline" size="sm" icon="menu" type="button" onClick={() => setMenuOpen((v) => !v)}>
            Menú
          </Btn>
          <span className="lw-small" style={{ fontWeight: 600, color: 'var(--lw-text)' }}>
            {business?.name ?? 'Dashboard'}
          </span>
        </div>
        {children}
      </main>
    </div>
  )
}

export { Dashboard, DashSidebar, StatCard, MiniLine };
