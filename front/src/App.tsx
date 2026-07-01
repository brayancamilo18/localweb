import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import GuestRoute from './components/guards/GuestRoute'
import OnboardingGuard from './components/guards/OnboardingGuard'
import ProtectedRoute from './components/guards/ProtectedRoute'
import AdminRoute from './components/guards/AdminRoute'
import ErrorBoundary from './components/ui/ErrorBoundary'
import { ToastProvider } from './components/ui/Toast'
import { useAuth } from './hooks/useAuth'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import LoginPage from './pages/LoginPage'
import OnboardingPage from './pages/OnboardingPage'
import RegisterPage from './pages/RegisterPage'
import SocialRegisterPage from './pages/SocialRegisterPage'
import ReferralLanding from './pages/ReferralLanding'
import ResetPasswordPage from './pages/ResetPasswordPage'
import VerifyEmailPage from './pages/VerifyEmailPage'
import DashboardPage from './features/dashboard/DashboardPage'
import MiPagina from './features/dashboard/sections/MiPagina'
import Editor from './features/dashboard/sections/Editor'
import Ubicacion from './features/dashboard/sections/Ubicacion'
import Diseno from './features/dashboard/sections/Diseno'
import BrandColor from './features/dashboard/sections/BrandColor'
import Imagenes from './features/dashboard/sections/Imagenes'
import Horarios from './features/dashboard/sections/Horarios'
import Estadisticas from './features/dashboard/sections/Estadisticas'
import BillingRedirect from './features/dashboard/sections/BillingRedirect'
import Seguridad from './features/dashboard/sections/Seguridad'
import Servicios from './features/dashboard/sections/Servicios'
import Eventos from './features/dashboard/sections/Eventos'
import EnlacesPro from './features/dashboard/sections/EnlacesPro'
import AsistenteIa from './features/dashboard/sections/AsistenteIa'
import AccountPage from './features/dashboard/sections/account/AccountPage'
import PublicPage from './features/public-page/PublicPage'
import TenantPublicPage from './components/TenantPublicPage'
import { getTenantFromHostname } from './lib/tenant'
import AdminLayout from './layouts/AdminLayout'
import AdminDashboardPage from './features/admin/AdminDashboardPage'
import AdminBusinessesPage from './features/admin/AdminBusinessesPage'
import AdminBusinessDetailPage from './features/admin/AdminBusinessDetailPage'
import AdminTemplatesPage from './features/admin/AdminTemplatesPage'
import AdminUsersPage from './features/admin/AdminUsersPage'
import AdminTopPagesPage from './features/admin/AdminTopPagesPage'
import { postAuthDestination } from './lib/authRouting'
import { LANDING_INDEX_PATH, shouldRootRedirectToLanding } from './lib/landing'
import { useAuthStore } from './store/authStore'
import CookieBanner from './components/cookies/CookieBanner'
import AvisoLegalPage from './pages/legal/AvisoLegalPage'
import CookiesPage from './pages/legal/CookiesPage'
import PrivacidadPage from './pages/legal/PrivacidadPage'
import TerminosPage from './pages/legal/TerminosPage'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60_000,
      gcTime: 30 * 60_000,
      refetchOnWindowFocus: false,
    },
  },
})

function RootRedirect() {
  const { isLoading, isAuthenticated } = useAuth()
  const hasCompletedOnboarding = useAuthStore((state) => state.hasCompletedOnboarding)
  const user = useAuthStore((state) => state.user)
  const business = useAuthStore((state) => state.business)

  // Mientras /auth/me está en vuelo no decidimos: evita el "flash de /login" y el subsiguiente
  // /onboarding cuando la cookie es válida.
  if (isLoading && !isAuthenticated) {
    return null
  }
  if (!isAuthenticated) {
    if (shouldRootRedirectToLanding()) {
      return <Navigate to="/landing" replace />
    }
    return <Navigate to="/login" replace />
  }
  if (user?.is_admin) {
    return <Navigate to="/admin" replace />
  }
  return <Navigate to={postAuthDestination(user, business, hasCompletedOnboarding)} replace />
}

function LandingStaticRedirect() {
  useEffect(() => {
    if (window.location.pathname === LANDING_INDEX_PATH) return
    window.location.replace(
      LANDING_INDEX_PATH + window.location.search + window.location.hash,
    )
  }, [])
  return null
}

function AppRoutes() {
  useAuth()

  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />

      <Route path="/r/:code" element={<ReferralLanding />} />

      <Route path="/aviso-legal" element={<AvisoLegalPage />} />
      <Route path="/privacidad" element={<PrivacidadPage />} />
      <Route path="/cookies" element={<CookiesPage />} />
      <Route path="/terminos" element={<TerminosPage />} />

      <Route element={<GuestRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
      </Route>

      <Route path="/verify-email" element={<VerifyEmailPage />} />

      <Route path="/register/social" element={<SocialRegisterPage />} />

      <Route element={<OnboardingGuard />}>
        <Route path="/onboarding" element={<OnboardingPage />} />
      </Route>

      <Route element={<AdminRoute />}>
        <Route path="admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboardPage />} />
          <Route path="businesses" element={<AdminBusinessesPage />} />
          <Route path="businesses/:id" element={<AdminBusinessDetailPage />} />
          <Route path="templates" element={<AdminTemplatesPage />} />
          <Route path="users" element={<AdminUsersPage />} />
          <Route path="top-pages" element={<AdminTopPagesPage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<DashboardPage />}>
          <Route index element={<MiPagina />} />
          <Route path="editor" element={<Editor />} />
          <Route path="location" element={<Ubicacion />} />
          <Route path="diseno" element={<Diseno />} />
          <Route path="brand-color" element={<BrandColor />} />
          <Route path="images" element={<Imagenes />} />
          <Route path="schedule" element={<Horarios />} />
          <Route path="services" element={<Servicios />} />
          <Route path="events" element={<Eventos />} />
          <Route path="enlaces" element={<EnlacesPro />} />
          <Route path="stats" element={<Estadisticas />} />
          <Route path="asistente-ia" element={<AsistenteIa />} />
          <Route path="billing" element={<BillingRedirect />} />
          <Route path="security" element={<Seguridad />} />
          <Route path="account" element={<AccountPage />} />
        </Route>
      </Route>

      {/* Landing piloto estática (front/public/landing/index.html) */}
      <Route path="/landing" element={<LandingStaticRedirect />} />
      <Route path="/landing/*" element={<LandingStaticRedirect />} />

      {/* Fallback de desarrollo: en producción las páginas públicas las sirve
          Laravel directamente (ResolveTenantForWeb + PublicTenantPageController).
          Esta ruta solo se activa en local cuando no hay wildcard DNS. */}
      <Route path="/:subdomain" element={<PublicPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

const tenantSubdomain = getTenantFromHostname()

export default function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <QueryClientProvider client={queryClient}>
          {tenantSubdomain ? (
            <TenantPublicPage subdomain={tenantSubdomain} />
          ) : (
            <BrowserRouter>
              <div className="lw-route-shell">
                <AppRoutes />
              </div>
              <CookieBanner />
            </BrowserRouter>
          )}
        </QueryClientProvider>
      </ToastProvider>
    </ErrorBoundary>
  )
}
