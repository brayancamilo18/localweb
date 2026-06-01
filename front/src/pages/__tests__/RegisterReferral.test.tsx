import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import RegisterPage from '../RegisterPage'
import { useAuthStore } from '../../store/authStore'
import * as authApi from '../../api/auth'
import {
  getValidReferralCodeFromStorage,
  REFERRAL_AT_KEY,
  REFERRAL_CODE_KEY,
} from '../../lib/referralStorage'

const navigateMock = vi.fn()

vi.mock('../../components/location/LocationPicker', async () => {
  const { RegisterLocationPickerMock } = await import('./registerLocationMock')
  return { LocationPicker: RegisterLocationPickerMock }
})

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

function acceptTermsCheckbox() {
  return screen.getByRole('checkbox', {
    name: /acepto los términos y condiciones y la política de privacidad/i,
  })
}

async function fillStep1AndContinue() {
  fireEvent.change(screen.getByLabelText('Tu nombre'), { target: { value: 'Brayan' } })
  fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'b@b.com' } })
  fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: '12345678' } })
  fireEvent.change(screen.getByLabelText('Repite tu contraseña'), { target: { value: '12345678' } })
  fireEvent.click(acceptTermsCheckbox())
  fireEvent.click(screen.getByRole('button', { name: 'Continuar' }))
  await screen.findByLabelText('Nombre del negocio')
}

async function submitRegistration() {
  fireEvent.change(screen.getByLabelText('Nombre del negocio'), { target: { value: 'Mi local' } })
  fireEvent.change(screen.getByLabelText('Ciudad'), { target: { value: 'Madrid' } })
  fireEvent.click(screen.getByRole('button', { name: 'Crear mi cuenta' }))
}

describe('register referral payload', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('includes referral_code when localStorage has a fresh code', () => {
    localStorage.setItem(REFERRAL_CODE_KEY, 'abcd1234')
    localStorage.setItem(REFERRAL_AT_KEY, String(Date.now()))

    const referralCode = getValidReferralCodeFromStorage()
    const payload: Record<string, string> = {
      name: 'Test',
      email: 'new@test.com',
      password: 'password123',
      password_confirmation: 'password123',
    }
    if (referralCode) {
      payload.referral_code = referralCode
    }

    expect(payload.referral_code).toBe('abcd1234')
  })

  it('omits referral_code when localStorage is empty', () => {
    const referralCode = getValidReferralCodeFromStorage()
    const payload: Record<string, string> = {
      name: 'Test',
      email: 'new@test.com',
      password: 'password123',
      password_confirmation: 'password123',
    }
    if (referralCode) {
      payload.referral_code = referralCode
    }

    expect(payload.referral_code).toBeUndefined()
  })

  it('omits referral_code when code is older than 30 days', () => {
    localStorage.setItem(REFERRAL_CODE_KEY, 'abcd1234')
    localStorage.setItem(REFERRAL_AT_KEY, String(Date.now() - 31 * 24 * 60 * 60 * 1000))

    expect(getValidReferralCodeFromStorage()).toBeUndefined()
    expect(localStorage.getItem(REFERRAL_CODE_KEY)).toBeNull()
  })
})

describe('RegisterPage referral storage cleanup', () => {
  beforeEach(() => {
    navigateMock.mockReset()
    localStorage.clear()
    useAuthStore.getState().clearAuth()
    localStorage.setItem(REFERRAL_CODE_KEY, 'abcd1234')
    localStorage.setItem(REFERRAL_AT_KEY, String(Date.now()))
  })

  it('clears referral storage after successful register', async () => {
    vi.spyOn(authApi, 'register').mockResolvedValue({
      user: { id: 1, name: 'Brayan', email: 'b@b.com', email_verified_at: null },
      business: null,
    })

    renderPage()
    await fillStep1AndContinue()
    await submitRegistration()

    await waitFor(() => {
      expect(localStorage.getItem(REFERRAL_CODE_KEY)).toBeNull()
      expect(localStorage.getItem(REFERRAL_AT_KEY)).toBeNull()
    })
  })

  it('does not clear referral storage when register fails', async () => {
    vi.spyOn(authApi, 'register').mockRejectedValue(new Error('Registration failed'))

    renderPage()
    await fillStep1AndContinue()
    await submitRegistration()

    await waitFor(() => {
      expect(screen.getByText('Registration failed')).toBeInTheDocument()
    })

    expect(localStorage.getItem(REFERRAL_CODE_KEY)).toBe('abcd1234')
    expect(localStorage.getItem(REFERRAL_AT_KEY)).not.toBeNull()
  })
})
