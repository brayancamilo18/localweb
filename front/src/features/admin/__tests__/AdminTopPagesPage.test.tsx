import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import AdminTopPagesPage from '../AdminTopPagesPage'
import * as adminApi from '../../../api/admin'

vi.mock('../../../api/admin', async () => {
  const actual = await vi.importActual<typeof import('../../../api/admin')>('../../../api/admin')
  return {
    ...actual,
    fetchAdminTopPages: vi.fn(),
  }
})

function renderTopPages() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false, gcTime: 0 } },
  })
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={['/admin/top-pages']}>
        <Routes>
          <Route path="/admin/top-pages" element={<AdminTopPagesPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('AdminTopPagesPage', () => {
  beforeEach(() => {
    vi.mocked(adminApi.fetchAdminTopPages).mockReset()
  })

  it('lista ranking y métrica de visitas por defecto', async () => {
    vi.mocked(adminApi.fetchAdminTopPages).mockResolvedValue({
      pages: [
        {
          business_id: 10,
          name: 'Hot Biz',
          subdomain: 'hot',
          sector: 'cafeteria',
          plan: 'pro',
          visits: 42,
          whatsapp_clicks: 3,
          phone_clicks: 1,
        },
      ],
    })

    renderTopPages()

    await waitFor(() => expect(adminApi.fetchAdminTopPages).toHaveBeenCalled())

    expect(await screen.findByText('Hot Biz')).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: /Visitas/i })).toBeInTheDocument()
    const link = screen.getByRole('link', { name: /Hot Biz/i })
    expect(link).toHaveAttribute('href', '/admin/businesses/10')
    expect(screen.getByText('42')).toBeInTheDocument()
    expect(screen.getByText('Visitas')).toBeInTheDocument()
  })
})
