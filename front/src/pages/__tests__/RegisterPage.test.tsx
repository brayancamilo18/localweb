import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import RegisterPage from '../RegisterPage'
import { useAuthStore } from '../../store/authStore'
import * as authApi from '../../api/auth'

const navigateMock = vi.fn()

vi.mock('react-router-dom', () => ({
  MemoryRouter: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useNavigate: () => navigateMock,
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
        <RegisterPage />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

async function fillStep1AndContinue() {
  fireEvent.change(screen.getByLabelText('Tu nombre'), { target: { value: 'Brayan' } })
  fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'b@b.com' } })
  fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: '12345678' } })
  fireEvent.change(screen.getByLabelText('Repite tu contraseña'), { target: { value: '12345678' } })
  fireEvent.click(screen.getByRole('checkbox'))
  fireEvent.click(screen.getByRole('button', { name: 'Continuar' }))
  await screen.findByRole('heading', { name: 'Tu negocio' })
}

describe('RegisterPage', () => {
  beforeEach(() => {
    navigateMock.mockReset()
    localStorage.clear()
    useAuthStore.getState().clearAuth()
  })

  it('si las contraseñas no coinciden no avanza al paso 2', async () => {
    renderPage()
    fireEvent.change(screen.getByLabelText('Tu nombre'), { target: { value: 'Brayan' } })
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'b@b.com' } })
    fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: '12345678' } })
    fireEvent.change(screen.getByLabelText('Repite tu contraseña'), { target: { value: '87654321' } })
    fireEvent.click(screen.getByRole('checkbox'))
    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }))
    expect(await screen.findByText('Las contraseñas no coinciden')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Tu negocio' })).not.toBeInTheDocument()
  })

  it('sin aceptar terminos no avanza al paso 2', async () => {
    renderPage()
    fireEvent.change(screen.getByLabelText('Tu nombre'), { target: { value: 'Brayan' } })
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'b@b.com' } })
    fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: '12345678' } })
    fireEvent.change(screen.getByLabelText('Repite tu contraseña'), { target: { value: '12345678' } })
    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }))
    expect(await screen.findByText('Debes aceptar los términos')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Tu negocio' })).not.toBeInTheDocument()
  })

  it('llama a register API con los datos correctos', async () => {
    const registerSpy = vi.spyOn(authApi, 'register').mockResolvedValue({
      user: { id: 1, name: 'Brayan', email: 'b@b.com' },
      token: 'tok',
      business: null,
    })
    renderPage()
    await fillStep1AndContinue()
    fireEvent.change(screen.getByLabelText('Nombre del negocio'), { target: { value: 'Mi local' } })
    fireEvent.change(screen.getByLabelText('Ciudad'), { target: { value: 'Madrid' } })
    fireEvent.click(screen.getByRole('button', { name: 'Crear mi cuenta' }))
    await waitFor(() => expect(registerSpy).toHaveBeenCalledWith('Brayan', 'b@b.com', '12345678', '12345678'))
  })

  it('navega a /verify-email tras registro exitoso (correo aún sin verificar)', async () => {
    vi.spyOn(authApi, 'register').mockResolvedValue({
      user: { id: 1, name: 'Brayan', email: 'b@b.com', email_verified_at: null },
      token: 'tok',
      business: null,
    })
    renderPage()
    await fillStep1AndContinue()
    fireEvent.change(screen.getByLabelText('Nombre del negocio'), { target: { value: 'Mi local' } })
    fireEvent.change(screen.getByLabelText('Ciudad'), { target: { value: 'Madrid' } })
    fireEvent.click(screen.getByRole('button', { name: 'Crear mi cuenta' }))
    await waitFor(() => expect(navigateMock).toHaveBeenCalledWith('/verify-email'))
  })

  it('navega a /onboarding tras registro si el backend ya devuelve email verificado', async () => {
    vi.spyOn(authApi, 'register').mockResolvedValue({
      user: { id: 1, name: 'Brayan', email: 'b@b.com', email_verified_at: '2026-05-07T18:00:00+00:00' },
      token: 'tok',
      business: null,
    })
    renderPage()
    await fillStep1AndContinue()
    fireEvent.change(screen.getByLabelText('Nombre del negocio'), { target: { value: 'Mi local' } })
    fireEvent.change(screen.getByLabelText('Ciudad'), { target: { value: 'Madrid' } })
    fireEvent.click(screen.getByRole('button', { name: 'Crear mi cuenta' }))
    await waitFor(() => expect(navigateMock).toHaveBeenCalledWith('/onboarding'))
  })
})
