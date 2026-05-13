import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import * as billingApi from '../../../api/billing'
import { DashSidebar } from '../dashboard'

function renderSidebar(pro = true) {
  const qc = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false, gcTime: 0 },
    },
  })
  vi.spyOn(billingApi, 'getBillingStatus').mockResolvedValue({
    plan: 'pro',
    is_pro: true,
    is_free: false,
    subscription_status: 'active',
    renewal_date: null,
    cancel_at_period_end: false,
  })
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <DashSidebar pro={pro} businessName="Cafetería Luna" />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('DashSidebar — item Cuenta', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('renderiza el item "Cuenta" enlazado a /dashboard/account', () => {
    renderSidebar()
    const link = screen.getByRole('link', { name: /Cuenta/i })
    expect(link).toHaveAttribute('href', '/dashboard/account')
  })

  it('ya NO renderiza el item antiguo "Suscripción" en el sidebar', () => {
    renderSidebar()
    expect(screen.queryByRole('link', { name: /^Suscripción$/i })).not.toBeInTheDocument()
  })
})
