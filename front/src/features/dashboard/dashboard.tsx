import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState, type ReactNode } from 'react'
import { logout as logoutApi } from '../../api/auth'
import { getBillingStatus, postCheckout } from '../../api/billing'
import type { Business } from '../../types/api'
import { SiteFooter } from '../../components/legal/SiteFooter'
import { Icon, Btn, Card } from '../../components/primitives/primitives'
import { useAuthStore } from '../../store/authStore'
import './dashboard.css'

/** «Renueva DD MMM» en español, abreviado, para el card del sidebar. */
function formatRenewalShortEs(unixSeconds: number | null | undefined): string | null {
  if (unixSeconds == null || !Number.isFinite(unixSeconds) || unixSeconds <= 0) {
    return null
  }
  try {
    const fmt = new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short' })
    return fmt.format(new Date(unixSeconds * 1000)).replace('.', '')
  } catch {
    return null
  }
}

// ONEZ — Dashboard (Free vs Pro)

export interface DashboardProps {
  pro: boolean
  business?: Business
  children: ReactNode
}

function DashSidebar({
  pro,
  businessName,
  onNavigateItem,
  variant = 'desktop',
}: {
  pro: boolean
  businessName?: string
  onNavigateItem?: () => void
  variant?: 'desktop' | 'mobile'
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
      navigate('/dashboard/account?tab=plan')
    },
  })
  /** Fecha real de próxima renovación. Solo se pide cuando el usuario es Pro;
   * antes el sidebar mostraba «Renueva 12 nov» hardcodeado, lo que en planes
   * mensuales (Stripe nos da el `current_period_end` real) era incoherente. */
  const billingQ = useQuery({
    queryKey: ['billing', 'status'],
    queryFn: getBillingStatus,
    enabled: pro,
    staleTime: 60_000,
  })
  const renewalLabel = formatRenewalShortEs(billingQ.data?.renewal_date)

  /** Logout robusto: antes era una `async function` sin loading state ni
   * deshabilitado, así que el usuario clicaba varias veces (cada click disparaba
   * un POST `/auth/logout` distinto) y además `qc.clear()` se llamaba **después**
   * de `clearAuth`, dejando viva la query `auth.me` cuyo `useEffect` re-llamaba
   * `setAuth()` con la `query.data` aún en memoria → `GuestRoute` rebote a
   * `/dashboard`. Ahora: `useMutation` desactiva el botón con `isPending`,
   * cancelamos peticiones en vuelo, removemos el cache y limpiamos auth antes
   * de navegar a `/login`. */
  const logoutM = useMutation({
    retry: false,
    mutationFn: async () => {
      try {
        await logoutApi()
      } catch {
        /* el backend ya pudo invalidar la cookie; seguimos con el logout local */
      }
    },
    onSettled: async () => {
      await qc.cancelQueries()
      qc.removeQueries()
      clearAuth()
      navigate('/login', { replace: true })
    },
  })

  function handleLogoutClick() {
    if (logoutM.isPending) return
    logoutM.mutate()
  }

  const items = [
    { icon: 'home', t: 'Mi página', to: '/dashboard', end: true, dataTour: 'mi-pagina' },
    { icon: 'edit', t: 'Editar', to: '/dashboard/editor', dataTour: 'editor' },
    { icon: 'pin', t: 'Ubicación', to: '/dashboard/location', dataTour: 'ubicacion' },
    { icon: 'layout', t: 'Diseño', to: '/dashboard/diseno', dataTour: 'diseno' },
    { icon: 'palette', t: 'Color de marca', to: '/dashboard/brand-color', dataTour: 'brand-color' },
    { icon: 'image', t: 'Imágenes', to: '/dashboard/images', dataTour: 'imagenes' },
    { icon: 'clock', t: 'Horarios', to: '/dashboard/schedule', dataTour: 'horarios' },
    { icon: 'list', t: 'Servicios', to: '/dashboard/services', dataTour: 'servicios' },
    { icon: 'arrowUpRight', t: 'Enlaces Pro', to: '/dashboard/enlaces', dataTour: 'enlaces-pro' },
    { icon: 'barChart', t: 'Estadísticas', to: '/dashboard/stats', dataTour: 'estadisticas' },
    { icon: 'user', t: 'Cuenta', to: '/dashboard/account', dataTour: 'cuenta' },
  ] as const
  return (
    <aside
      className="lw-dashboard-sidebar"
      style={{
        width: 240,
        flexShrink: 0,
        background: 'var(--lw-bg-elev)',
        borderRight: '1px solid var(--lw-border)',
        display: 'flex',
        flexDirection: 'column',
        padding: '20px 12px',
        height: '100%',
        boxSizing: 'border-box',
      }}
    >
      <div style={{ padding: "0 8px 18px", fontSize: 13, fontWeight: 600, color: 'var(--lw-text)' }}>
        {businessName ?? 'ONEZ'}
      </div>
      <nav style={{ display: "flex", flexDirection: "column", gap: 2, flex: 1 }}>
        {items.map((it) => (
          <NavLink
            key={it.to}
            to={it.to}
            end={Boolean((it as { end?: boolean }).end)}
            data-tour={variant === 'desktop' ? it.dataTour : undefined}
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
            <div style={{ fontSize: 11, color: "#92400E" }}>
              {renewalLabel ? `Renueva ${renewalLabel}` : 'Plan activo'}
            </div>
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
        <Btn
          type="button"
          kind="ghost"
          size="sm"
          fullWidth
          icon="logOut"
          loading={logoutM.isPending}
          disabled={logoutM.isPending}
          onClick={handleLogoutClick}
        >
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
  demo,
}: {
  label: string
  value: string
  delta?: string
  deltaTone?: 'success' | 'danger'
  icon: string
  locked?: boolean
  /** Métrica de ejemplo (Free): número atenuado + candado + sufijo «ejemplo». */
  demo?: boolean
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
      <div
        style={{
          fontSize: 26,
          fontWeight: 600,
          letterSpacing: "-0.02em",
          fontVariantNumeric: "tabular-nums",
          display: "flex",
          alignItems: "baseline",
          gap: 8,
          flexWrap: "wrap",
          color: demo && locked ? "var(--lw-text-4)" : undefined,
        }}
      >
        {demo && locked ? (
          <>
            <Icon name="lock" size={16} color="var(--lw-text-4)" />
            <span>{value}</span>
            <span style={{ fontSize: 12, fontWeight: 500, color: "var(--lw-text-4)" }}>ejemplo</span>
          </>
        ) : locked ? (
          "—"
        ) : (
          value
        )}
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
        <DashSidebar variant="mobile" pro={pro} businessName={business?.name} onNavigateItem={() => setMenuOpen(false)} />
      </div>
      <div className="lw-dashboard-desktop-sidebar">
        <DashSidebar variant="desktop" pro={pro} businessName={business?.name} />
      </div>
      <main className="lw-scroll lw-dashboard-main">
        <div className="lw-dashboard-mobilebar">
          <Btn
            kind="outline"
            size="sm"
            icon="menu"
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            data-tour-mobile="menu-button"
          >
            Menú
          </Btn>
          <span className="lw-small" style={{ fontWeight: 600, color: 'var(--lw-text)' }}>
            {business?.name ?? 'Dashboard'}
          </span>
        </div>
        {children}
        <SiteFooter />
      </main>
    </div>
  )
}

export { Dashboard, DashSidebar, StatCard, MiniLine };
