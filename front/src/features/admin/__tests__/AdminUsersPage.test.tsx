import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import AdminUsersPage from '../AdminUsersPage'
import { ToastProvider } from '../../../components/ui/Toast'
import * as adminApi from '../../../api/admin'

vi.mock('../../../api/admin', async () => {
  const actual = await vi.importActual<typeof import('../../../api/admin')>('../../../api/admin')
  return {
    ...actual,
    fetchAdminUsers: vi.fn(),
    resendAdminUserVerification: vi.fn(),
  }
})

function renderUsersPage() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false, gcTime: 0 } },
  })
  return render(
    <QueryClientProvider client={qc}>
      <ToastProvider>
        <MemoryRouter initialEntries={['/admin/users']}>
          <Routes>
            <Route path="/admin/users" element={<AdminUsersPage />} />
          </Routes>
        </MemoryRouter>
      </ToastProvider>
    </QueryClientProvider>,
  )
}

describe('AdminUsersPage', () => {
  beforeEach(() => {
    vi.mocked(adminApi.fetchAdminUsers).mockReset()
    vi.mocked(adminApi.resendAdminUserVerification).mockReset()
  })

  it('muestra tabla con badges y enlace al negocio', async () => {
    vi.mocked(adminApi.fetchAdminUsers).mockResolvedValue({
      items: [
        {
          id: 1,
          name: 'Alice',
          email: 'a@test.com',
          email_verified_at: '2026-01-01T00:00:00.000000Z',
          is_admin: false,
          business: { id: 99, name: 'Biz', subdomain: 'biz99' },
          created_at: '2026-02-01T12:00:00.000000Z',
        },
      ],
      pagination: {
        current_page: 1,
        last_page: 1,
        per_page: 15,
        total: 1,
        from: 1,
        to: 1,
      },
    })

    renderUsersPage()

    await waitFor(() => expect(adminApi.fetchAdminUsers).toHaveBeenCalled())

    expect(await screen.findByText('Alice')).toBeInTheDocument()
    expect(screen.getByText('a@test.com')).toBeInTheDocument()
    expect(screen.getByText('Verificado')).toBeInTheDocument()
    const bizLink = screen.getByRole('link', { name: /Biz/i })
    expect(bizLink).toHaveAttribute('href', '/admin/businesses/99')
    expect(screen.getByRole('columnheader', { name: /Rol/i })).toBeInTheDocument()
  })

  it('muestra botón reenviar solo si no está verificado', async () => {
    vi.mocked(adminApi.fetchAdminUsers).mockResolvedValue({
      items: [
        {
          id: 2,
          name: 'Bob',
          email: 'b@test.com',
          email_verified_at: null,
          is_admin: true,
          business: null,
          created_at: null,
        },
      ],
      pagination: {
        current_page: 1,
        last_page: 1,
        per_page: 15,
        total: 1,
        from: 1,
        to: 1,
      },
    })

    renderUsersPage()

    expect(await screen.findByText('Sin verificar')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Reenviar verificación/i })).toBeInTheDocument()
    expect(screen.getByText('Admin')).toBeInTheDocument()
  })
})
