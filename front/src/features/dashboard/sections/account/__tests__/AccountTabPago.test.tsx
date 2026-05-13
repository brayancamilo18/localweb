import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import AccountTabPago from '../AccountTabPago'
import { ToastProvider } from '../../../../../components/ui/Toast'
import * as billingApi from '../../../../../api/billing'
import { navigateExternal } from '../../../../../utils/navigate'

vi.mock('../../../../../utils/navigate', () => ({ navigateExternal: vi.fn() }))

function renderTab() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false, gcTime: 0 },
    },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <MemoryRouter>
          <AccountTabPago />
        </MemoryRouter>
      </ToastProvider>
    </QueryClientProvider>,
  )
}

const PRO_STATUS: billingApi.BillingStatus = {
  plan: 'pro',
  is_pro: true,
  is_free: false,
  subscription_status: 'active',
  renewal_date: 1764678400,
  cancel_at_period_end: false,
}

const FREE_STATUS: billingApi.BillingStatus = {
  plan: 'free',
  is_pro: false,
  is_free: true,
  subscription_status: null,
  renewal_date: null,
  cancel_at_period_end: false,
}

const VISA_PM: billingApi.BillingPaymentMethod = {
  brand: 'visa',
  last4: '4242',
  exp_month: 12,
  exp_year: 2030,
}

describe('AccountTabPago', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    vi.mocked(navigateExternal).mockClear()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('muestra "Cargando datos de pago…" inicialmente', () => {
    vi.spyOn(billingApi, 'getBillingStatus').mockImplementation(() => new Promise(() => {}))
    renderTab()
    expect(screen.getByText(/Cargando datos de pago/i)).toBeInTheDocument()
  })

  it('muestra empty state con CTA "Mejorar a Pro" para usuarios Free', async () => {
    vi.spyOn(billingApi, 'getBillingStatus').mockResolvedValue(FREE_STATUS)
    renderTab()
    expect(await screen.findByText(/Aún no tienes método de pago/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Mejorar a Pro/i })).toBeInTheDocument()
  })

  it('al pulsar "Mejorar a Pro" llama a checkout y redirige', async () => {
    vi.spyOn(billingApi, 'getBillingStatus').mockResolvedValue(FREE_STATUS)
    const spy = vi.spyOn(billingApi, 'postCheckout').mockResolvedValue('https://checkout.stripe.test/abc')
    renderTab()
    fireEvent.click(await screen.findByRole('button', { name: /Mejorar a Pro/i }))
    await waitFor(() => expect(spy).toHaveBeenCalled())
    await waitFor(() =>
      expect(navigateExternal).toHaveBeenCalledWith('https://checkout.stripe.test/abc'),
    )
  })

  it('NO llama a getPaymentMethod cuando el usuario es Free', async () => {
    vi.spyOn(billingApi, 'getBillingStatus').mockResolvedValue(FREE_STATUS)
    const pmSpy = vi.spyOn(billingApi, 'getPaymentMethod').mockResolvedValue(null)
    renderTab()
    await screen.findByText(/Aún no tienes método de pago/i)
    expect(pmSpy).not.toHaveBeenCalled()
  })

  it('muestra empty state "Sin método de pago" cuando Pro sin tarjeta', async () => {
    vi.spyOn(billingApi, 'getBillingStatus').mockResolvedValue(PRO_STATUS)
    vi.spyOn(billingApi, 'getPaymentMethod').mockResolvedValue(null)
    vi.spyOn(billingApi, 'getUpcoming').mockResolvedValue(null)
    renderTab()
    expect(await screen.findByText(/Sin método de pago/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Añadir tarjeta/i })).toBeInTheDocument()
  })

  it('"Añadir tarjeta" abre el portal Stripe', async () => {
    vi.spyOn(billingApi, 'getBillingStatus').mockResolvedValue(PRO_STATUS)
    vi.spyOn(billingApi, 'getPaymentMethod').mockResolvedValue(null)
    vi.spyOn(billingApi, 'getUpcoming').mockResolvedValue(null)
    const portalSpy = vi.spyOn(billingApi, 'postPortal').mockResolvedValue('https://billing.stripe.test/portal')
    renderTab()
    fireEvent.click(await screen.findByRole('button', { name: /Añadir tarjeta/i }))
    await waitFor(() => expect(portalSpy).toHaveBeenCalled())
    await waitFor(() =>
      expect(navigateExternal).toHaveBeenCalledWith('https://billing.stripe.test/portal'),
    )
  })

  it('renderiza brand, last4 y caducidad formateados', async () => {
    vi.spyOn(billingApi, 'getBillingStatus').mockResolvedValue(PRO_STATUS)
    vi.spyOn(billingApi, 'getPaymentMethod').mockResolvedValue(VISA_PM)
    vi.spyOn(billingApi, 'getUpcoming').mockResolvedValue({
      date: 1764678400,
      total: 999,
      currency: 'EUR',
    })
    renderTab()
    expect(await screen.findByText(/Visa ····4242/)).toBeInTheDocument()
    expect(screen.getByText(/Caduca 12\/30/)).toBeInTheDocument()
  })

  it('muestra "Mastercard" como label para brand mastercard', async () => {
    vi.spyOn(billingApi, 'getBillingStatus').mockResolvedValue(PRO_STATUS)
    vi.spyOn(billingApi, 'getPaymentMethod').mockResolvedValue({
      ...VISA_PM,
      brand: 'mastercard',
      last4: '0001',
    })
    vi.spyOn(billingApi, 'getUpcoming').mockResolvedValue(null)
    renderTab()
    expect(await screen.findByText(/Mastercard ····0001/)).toBeInTheDocument()
  })

  it('muestra badge "Caducada" para tarjeta con fecha pasada', async () => {
    vi.spyOn(billingApi, 'getBillingStatus').mockResolvedValue(PRO_STATUS)
    vi.spyOn(billingApi, 'getPaymentMethod').mockResolvedValue({
      brand: 'visa',
      last4: '4242',
      exp_month: 1,
      exp_year: 2020,
    })
    vi.spyOn(billingApi, 'getUpcoming').mockResolvedValue(null)
    renderTab()
    expect(await screen.findByText('Caducada')).toBeInTheDocument()
  })

  it('muestra badge "Caduca pronto" si caduca en los próximos 60 días', async () => {
    const dateSpy = vi.spyOn(Date, 'now').mockReturnValue(new Date('2026-05-10T12:00:00.000Z').getTime())
    try {
      vi.spyOn(billingApi, 'getBillingStatus').mockResolvedValue(PRO_STATUS)
      vi.spyOn(billingApi, 'getPaymentMethod').mockResolvedValue({
        brand: 'visa',
        last4: '4242',
        exp_month: 6,
        exp_year: 2026,
      })
      vi.spyOn(billingApi, 'getUpcoming').mockResolvedValue(null)
      renderTab()
      expect(await screen.findByText('Caduca pronto')).toBeInTheDocument()
    } finally {
      dateSpy.mockRestore()
    }
  })

  it('renderiza próximo cobro con fecha e importe', async () => {
    vi.spyOn(billingApi, 'getBillingStatus').mockResolvedValue(PRO_STATUS)
    vi.spyOn(billingApi, 'getPaymentMethod').mockResolvedValue(VISA_PM)
    vi.spyOn(billingApi, 'getUpcoming').mockResolvedValue({
      date: 1764678400,
      total: 999,
      currency: 'EUR',
    })
    renderTab()
    await screen.findByText(/Visa ····4242/)
    expect(screen.getByText(/9,99/)).toBeInTheDocument()
    expect(screen.getByText(/2025|2026/)).toBeInTheDocument()
  })

  it('muestra "No hay próximo cobro programado" si upcoming es null', async () => {
    vi.spyOn(billingApi, 'getBillingStatus').mockResolvedValue(PRO_STATUS)
    vi.spyOn(billingApi, 'getPaymentMethod').mockResolvedValue(VISA_PM)
    vi.spyOn(billingApi, 'getUpcoming').mockResolvedValue(null)
    renderTab()
    await screen.findByText(/Visa ····4242/)
    expect(screen.getByText(/No hay próximo cobro programado/i)).toBeInTheDocument()
  })

  it('"Cambiar método de pago" abre el portal Stripe', async () => {
    vi.spyOn(billingApi, 'getBillingStatus').mockResolvedValue(PRO_STATUS)
    vi.spyOn(billingApi, 'getPaymentMethod').mockResolvedValue(VISA_PM)
    vi.spyOn(billingApi, 'getUpcoming').mockResolvedValue(null)
    const portalSpy = vi.spyOn(billingApi, 'postPortal').mockResolvedValue('https://billing.stripe.test/portal')
    renderTab()
    fireEvent.click(await screen.findByRole('button', { name: /Cambiar método de pago/i }))
    await waitFor(() => expect(portalSpy).toHaveBeenCalled())
    await waitFor(() =>
      expect(navigateExternal).toHaveBeenCalledWith('https://billing.stripe.test/portal'),
    )
  })

  it('"Gestionar datos fiscales" abre el portal Stripe', async () => {
    vi.spyOn(billingApi, 'getBillingStatus').mockResolvedValue(PRO_STATUS)
    vi.spyOn(billingApi, 'getPaymentMethod').mockResolvedValue(VISA_PM)
    vi.spyOn(billingApi, 'getUpcoming').mockResolvedValue(null)
    const portalSpy = vi.spyOn(billingApi, 'postPortal').mockResolvedValue('https://billing.stripe.test/portal')
    renderTab()
    fireEvent.click(await screen.findByRole('button', { name: /Gestionar datos fiscales/i }))
    await waitFor(() => expect(portalSpy).toHaveBeenCalled())
    await waitFor(() =>
      expect(navigateExternal).toHaveBeenCalledWith('https://billing.stripe.test/portal'),
    )
  })

  it('muestra estado de error y permite reintentar si statusQ falla', async () => {
    const spy = vi.spyOn(billingApi, 'getBillingStatus').mockRejectedValueOnce(new Error('boom'))
    renderTab()
    expect(await screen.findByText(/No se pudieron cargar tus datos de pago/i)).toBeInTheDocument()
    spy.mockResolvedValueOnce(FREE_STATUS)
    fireEvent.click(screen.getByRole('button', { name: /Reintentar/i }))
    expect(await screen.findByText(/Aún no tienes método de pago/i)).toBeInTheDocument()
  })
})
