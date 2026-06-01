import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import AccountTabReferidos from '../AccountTabReferidos'
import { ToastProvider } from '../../../../../components/ui/Toast'
import * as referralsApi from '../../../../../api/referrals'
import axios from 'axios'

function renderTab() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
  })
  return render(
    <QueryClientProvider client={qc}>
      <ToastProvider>
        <MemoryRouter>
          <AccountTabReferidos />
        </MemoryRouter>
      </ToastProvider>
    </QueryClientProvider>,
  )
}

const SAMPLE: referralsApi.ReferralsData = {
  code: 'abcd1234',
  link: 'https://app.onez.es/r/abcd1234',
  counts: { total: 2, paid: 1, rewarded: 1, pending: 0 },
  threshold: 1,
  max: 5,
  template_gift_at: 5,
  referrals: [
    {
      id: 1,
      status: 'paid',
      email_masked: 'an***@gmail.com',
      registered_at: 1762000000,
      first_payment_at: 1762100000,
    },
  ],
}

describe('AccountTabReferidos', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    Object.assign(navigator, {
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
    })
  })

  it('shows loading skeleton text initially', () => {
    vi.spyOn(referralsApi, 'getReferrals').mockImplementation(() => new Promise(() => {}))
    renderTab()
    expect(screen.getByText(/Cargando referidos/i)).toBeInTheDocument()
  })

  it('shows empty state when there are no referrals', async () => {
    vi.spyOn(referralsApi, 'getReferrals').mockResolvedValue({ ...SAMPLE, referrals: [], counts: { total: 0, paid: 0, rewarded: 0, pending: 0 } })
    renderTab()
    expect(await screen.findByText(/Aún no tienes referidos/i)).toBeInTheDocument()
  })

  it('shows progress counter and referral row', async () => {
    vi.spyOn(referralsApi, 'getReferrals').mockResolvedValue(SAMPLE)
    renderTab()
    expect(await screen.findByText(/2 \/ 5/)).toBeInTheDocument()
    expect(screen.getByText('an***@gmail.com')).toBeInTheDocument()
    expect(screen.getByText('Pagó')).toBeInTheDocument()
  })

  it('shows pro-only message on 403', async () => {
    vi.spyOn(referralsApi, 'getReferrals').mockRejectedValue(
      new axios.AxiosError('Forbidden', '403', undefined, undefined, {
        status: 403,
        data: { message: 'Solo disponible para usuarios Pro' },
        headers: {},
        statusText: 'Forbidden',
        config: {} as never,
      }),
    )
    renderTab()
    expect(await screen.findByText(/Disponible solo para usuarios Pro/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Ver planes/i })).toBeInTheDocument()
  })

  it('copies referral link to clipboard', async () => {
    vi.spyOn(referralsApi, 'getReferrals').mockResolvedValue(SAMPLE)
    renderTab()
    fireEvent.click(await screen.findByRole('button', { name: /Copiar/i }))
    await waitFor(() =>
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('https://app.onez.es/r/abcd1234'),
    )
    expect(await screen.findByText(/Enlace copiado/i)).toBeInTheDocument()
  })
})
