import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { logout as logoutApi } from '../api/auth'
import { Btn, Icon } from '../components/primitives/primitives'
import { useAuthStore } from '../store/authStore'
import '../features/dashboard/dashboard.css'

const NAV = [
  { to: '/admin', label: 'Dashboard', icon: 'barChart', end: true },
  { to: '/admin/businesses', label: 'Negocios', icon: 'layout', end: false },
  { to: '/admin/templates', label: 'Templates', icon: 'palette', end: false },
  { to: '/admin/users', label: 'Usuarios', icon: 'users', end: false },
  { to: '/admin/top-pages', label: 'Top páginas', icon: 'trending', end: false },
] as const

function AdminSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const clearAuth = useAuthStore((s) => s.clearAuth)

  /** Mismo bug del sidebar de cliente: el botón no estaba deshabilitado
   * mientras la petición a `/auth/logout` estaba en vuelo y `qc.clear()`
   * disparaba refetches que reactivaban la sesión vía `useAuth`.
   * Ver `dashboard.tsx` para la explicación completa. */
  const logoutM = useMutation({
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
      <div style={{ padding: '0 8px 18px', fontSize: 13, fontWeight: 700, color: 'var(--lw-text)' }}>
        Admin
      </div>
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
        {NAV.map((it) => (
          <NavLink
            key={it.to}
            to={it.to}
            end={it.end}
            onClick={onNavigate}
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
                <span style={{ flex: 1 }}>{it.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
      <div style={{ marginTop: 'auto', paddingTop: 12, borderTop: '1px solid var(--lw-border)' }}>
        <Btn
          type="button"
          kind="ghost"
          size="sm"
          fullWidth
          icon="home"
          style={{ marginBottom: 8 }}
          onClick={() => navigate('/dashboard')}
        >
          Panel cliente
        </Btn>
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

export default function AdminLayout() {
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const user = useAuthStore((s) => s.user)

  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  return (
    <div className="lw-dashboard-shell">
      <div className={`lw-dashboard-overlay${menuOpen ? ' is-open' : ''}`} onClick={() => setMenuOpen(false)} />
      <div className={`lw-dashboard-drawer${menuOpen ? ' is-open' : ''}`}>
        <AdminSidebar onNavigate={() => setMenuOpen(false)} />
      </div>
      <div className="lw-dashboard-desktop-sidebar">
        <AdminSidebar />
      </div>
      <main className="lw-scroll lw-dashboard-main">
        <header className="lw-mipagina-header" style={{ marginBottom: 8 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--lw-text-3)', letterSpacing: '0.04em' }}>
              ONEZ
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 600, margin: '4px 0 0', color: 'var(--lw-text)' }}>
              Administración
            </h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <span className="lw-small" style={{ color: 'var(--lw-text-2)' }}>
              {user?.name ?? '—'} · {user?.email ?? ''}
            </span>
            <Btn kind="outline" size="sm" icon="menu" type="button" className="lw-admin-mobile-menu-btn" onClick={() => setMenuOpen((v) => !v)}>
              Menú
            </Btn>
          </div>
        </header>
        <Outlet />
      </main>
    </div>
  )
}
