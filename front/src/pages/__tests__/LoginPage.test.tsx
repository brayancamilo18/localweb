import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import LoginPage from '../LoginPage'
import { useAuthStore } from '../../store/authStore'
import * as authApi from '../../api/auth'

const navigateMock = vi.fn()

vi.mock('react-router-dom', () => ({
  MemoryRouter: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useNavigate: () => navigateMock,
  useSearchParams: () => [new URLSearchParams(), vi.fn()] as const,
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => (
    <a href={to}>{children}</a>
  ),
}))

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false, gcTime: 0 } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('LoginPage', () => {
  beforeEach(() => {
    navigateMock.mockReset()
    localStorage.clear()
    useAuthStore.getState().clearAuth()
  })

  it('renderiza email password y boton Iniciar sesion', () => {
    renderPage()
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    expect(screen.getByLabelText('Contraseña')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Iniciar sesión' })).toBeInTheDocument()
  })

  it('muestra spinner en boton mientras loading', async () => {
    vi.spyOn(authApi, 'login').mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                user: { id: 1, name: 'A', email: 'a@a.com' },
                business: null,
              } as never),
            100,
          ),
        ),
    )
    renderPage()
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'a@a.com' } })
    fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: '12345678' } })
    fireEvent.click(screen.getByRole('button', { name: 'Iniciar sesión' }))
    await waitFor(() => {
      const btn = screen.getByRole('button', { name: 'Entrando…' })
      expect(btn).toBeDisabled()
      expect(btn.querySelector('svg')).toBeInTheDocument()
    })
  })

  it('muestra error Credenciales incorrectas cuando API devuelve 401', async () => {
    vi.spyOn(authApi, 'login').mockRejectedValue({
      response: { status: 401, data: { message: 'Credenciales incorrectas' } },
      isAxiosError: true,
    })
    renderPage()
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'a@a.com' } })
    fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: '12345678' } })
    fireEvent.click(screen.getByRole('button', { name: 'Iniciar sesión' }))
    expect(await screen.findByText('Credenciales incorrectas')).toBeInTheDocument()
  })

  it('navega a /onboarding tras login exitoso con plan pro sin onboarding completado', async () => {
    vi.spyOn(authApi, 'login').mockResolvedValue({
      user: { id: 1, name: 'A', email: 'a@a.com', email_verified_at: '2026-05-01T00:00:00Z' },
      business: { plan: 'pro', onboarding_completed_at: null } as never,
    })
    renderPage()
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'a@a.com' } })
    fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: '12345678' } })
    fireEvent.click(screen.getByRole('button', { name: 'Iniciar sesión' }))
    await waitFor(() => expect(navigateMock).toHaveBeenCalledWith('/onboarding'))
  })

  it('navega a /dashboard tras login cuando onboarding ya esta completado', async () => {
    vi.spyOn(authApi, 'login').mockResolvedValue({
      user: { id: 1, name: 'A', email: 'a@a.com', email_verified_at: '2026-05-01T00:00:00Z' },
      business: { plan: 'pro', onboarding_completed_at: '2026-05-01T00:00:00Z' } as never,
    })
    renderPage()
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'a@a.com' } })
    fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: '12345678' } })
    fireEvent.click(screen.getByRole('button', { name: 'Iniciar sesión' }))
    await waitFor(() => expect(navigateMock).toHaveBeenCalledWith('/dashboard'))
  })

  it('navega a /onboarding cuando negocio esta pending', async () => {
    vi.spyOn(authApi, 'login').mockResolvedValue({
      user: { id: 1, name: 'A', email: 'a@a.com', email_verified_at: '2026-05-01T00:00:00Z' },
      business: { plan: 'pending' } as never,
    } as never)
    renderPage()
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'a@a.com' } })
    fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: '12345678' } })
    fireEvent.click(screen.getByRole('button', { name: 'Iniciar sesión' }))
    await waitFor(() => expect(navigateMock).toHaveBeenCalledWith('/onboarding'))
  })

  it('muestra errores de campo cuando API devuelve 422', async () => {
    vi.spyOn(authApi, 'login').mockRejectedValue({
      response: {
        status: 422,
        data: { message: 'Datos inválidos', errors: { email: ['Email inválido'], password: ['Password corto'] } },
      },
      isAxiosError: true,
    })
    renderPage()
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'bad@example.com' } })
    fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: '1' } })
    fireEvent.click(screen.getByRole('button', { name: 'Iniciar sesión' }))
    expect(await screen.findByText('Email inválido')).toBeInTheDocument()
    expect(await screen.findByText('Password corto')).toBeInTheDocument()
  })
})
