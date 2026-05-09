import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import GuestRoute from './components/guards/GuestRoute'
import OnboardingGuard from './components/guards/OnboardingGuard'
import ProtectedRoute from './components/guards/ProtectedRoute'
import AdminRoute from './components/guards/AdminRoute'
import ErrorBoundary from './components/ui/ErrorBoundary'
import { ToastProvider } from './components/ui/Toast'
import { useAuth } from './hooks/useAuth'
import LoginPage from './pages/LoginPage'
import OnboardingPage from './pages/OnboardingPage'
import RegisterPage from './pages/RegisterPage'
import VerifyEmailPage from './pages/VerifyEmailPage'
import DashboardPage from './features/dashboard/DashboardPage'
import MiPagina from './features/dashboard/sections/MiPagina'
import Editor from './features/dashboard/sections/Editor'
import Imagenes from './features/dashboard/sections/Imagenes'
import Horarios from './features/dashboard/sections/Horarios'
import Estadisticas from './features/dashboard/sections/Estadisticas'
import Suscripcion from './features/dashboard/sections/Suscripcion'
import Seguridad from './features/dashboard/sections/Seguridad'
import Servicios from './features/dashboard/sections/Servicios'
import EnlacesPro from './features/dashboard/sections/EnlacesPro'
import PublicPage from './features/public-page/PublicPage'
import AdminLayout from './layouts/AdminLayout'
import AdminDashboardPage from './features/admin/AdminDashboardPage'
import AdminBusinessesPage from './features/admin/AdminBusinessesPage'
import AdminBusinessDetailPage from './features/admin/AdminBusinessDetailPage'
import AdminTemplatesPage from './features/admin/AdminTemplatesPage'
import AdminUsersPage from './features/admin/AdminUsersPage'
import AdminTopPagesPage from './features/admin/AdminTopPagesPage'
import { useAuthStore } from './store/authStore'

const queryClient = new QueryClient()

function RootRedirect() {
  const { isLoading, isAuthenticated } = useAuth()
  const hasCompletedOnboarding = useAuthStore((state) => state.hasCompletedOnboarding)
  const user = useAuthStore((state) => state.user)

  // Mientras /auth/me está en vuelo no decidimos: evita el "flash de /login" y el subsiguiente
  // /onboarding cuando la cookie es válida.
  if (isLoading && !isAuthenticated) {
    return null
  }
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  if (user?.is_admin) {
    return <Navigate to="/admin" replace />
  }
  if (user && user.email_verified_at == null) {
    return <Navigate to="/verify-email" replace />
  }
  return <Navigate to={hasCompletedOnboarding ? '/dashboard' : '/onboarding'} replace />
}

function AppRoutes() {
  useAuth()

  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />

      <Route element={<GuestRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      <Route path="/verify-email" element={<VerifyEmailPage />} />

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
          <Route path="images" element={<Imagenes />} />
          <Route path="schedule" element={<Horarios />} />
          <Route path="services" element={<Servicios />} />
          <Route path="enlaces" element={<EnlacesPro />} />
          <Route path="stats" element={<Estadisticas />} />
          <Route path="billing" element={<Suscripcion />} />
          <Route path="security" element={<Seguridad />} />
        </Route>
      </Route>

      <Route path="/:subdomain" element={<PublicPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <div className="lw-route-shell">
              <AppRoutes />
            </div>
          </BrowserRouter>
        </QueryClientProvider>
      </ToastProvider>
    </ErrorBoundary>
  )
}
