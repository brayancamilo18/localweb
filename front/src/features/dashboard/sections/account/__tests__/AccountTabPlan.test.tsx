import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import AccountTabPlan from '../AccountTabPlan'
import { ToastProvider } from '../../../../../components/ui/Toast'
import * as billingApi from '../../../../../api/billing'
import { navigateExternal } from '../../../../../utils/navigate'

// jsdom 26+ marca `window.location`, `location.href` y `location.assign` como
// NON-configurable, así que cualquier intento de mockear el global directamente
// con `vi.spyOn`/`Object.defineProperty`/`vi.stubGlobal` lanza
// "Cannot redefine property". El componente delega la navegación a
// `navigateExternal` (un helper que internamente llama a `location.assign`)
// y aquí mockeamos ese módulo, lo que sí es posible y es la práctica estándar.
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
          <AccountTabPlan />
        </MemoryRouter>
      </ToastProvider>
    </QueryClientProvider>,
  )
}

const FREE_STATUS: billingApi.BillingStatus = {
  plan: 'free',
  is_pro: false,
  is_free: true,
  subscription_status: null,
  renewal_date: null,
  cancel_at_period_end: false,
}

const PRO_ACTIVE_STATUS: billingApi.BillingStatus = {
  plan: 'pro',
  is_pro: true,
  is_free: false,
  subscription_status: 'active',
  renewal_date: 1764678400, // ~diciembre 2025
  cancel_at_period_end: false,
}

const PRO_CANCELLED_STATUS: billingApi.BillingStatus = {
  ...PRO_ACTIVE_STATUS,
  cancel_at_period_end: true,
}

const PRO_PAST_DUE_STATUS: billingApi.BillingStatus = {
  ...PRO_ACTIVE_STATUS,
  subscription_status: 'past_due',
}

describe('AccountTabPlan', () => {
  beforeEach(() => {
    // `restoreAllMocks` deshace los `vi.spyOn` de cada test (los devuelve al
    // método real), pero NO afecta al mock estático de `navigateExternal`
    // creado con `vi.mock` arriba; para ese, limpiamos las llamadas registradas
    // explícitamente con `mockClear`.
    vi.restoreAllMocks()
    vi.mocked(navigateExternal).mockClear()
  })

  it('muestra "Cargando información del plan…" inicialmente', () => {
    vi.spyOn(billingApi, 'getBillingStatus').mockImplementation(() => new Promise(() => {}))
    renderTab()
    expect(screen.getByText(/Cargando información del plan/i)).toBeInTheDocument()
  })

  // ─── Free ───────────────────────────────────────────────────────

  it('muestra ambos planes con sus features para usuarios Free', async () => {
    vi.spyOn(billingApi, 'getBillingStatus').mockResolvedValue(FREE_STATUS)
    renderTab()
    expect(await screen.findByText(/Tu plan actual/i)).toBeInTheDocument()
    expect(screen.getByText('Plan Gratis')).toBeInTheDocument()
    expect(screen.getAllByText(/Hasta 3 fotos en galería/i).length).toBeGreaterThan(0)
    expect(screen.getByText(/Hasta 20 fotos en galería/i)).toBeInTheDocument()
    expect(screen.getByText(/Subdominio personalizado/i)).toBeInTheDocument()
  })

  it('llama a checkout y redirige al pulsar "Mejorar a Pro"', async () => {
    vi.spyOn(billingApi, 'getBillingStatus').mockResolvedValue(FREE_STATUS)
    const checkoutSpy = vi
      .spyOn(billingApi, 'postCheckout')
      .mockResolvedValue('https://checkout.stripe.test/abc')
    renderTab()
    fireEvent.click(await screen.findByRole('button', { name: /Mejorar a Pro/i }))
    await waitFor(() => expect(checkoutSpy).toHaveBeenCalled())
    await waitFor(() =>
      expect(navigateExternal).toHaveBeenCalledWith('https://checkout.stripe.test/abc'),
    )
  })

  // ─── Pro activo ─────────────────────────────────────────────────

  it('muestra estado Pro activo con próxima renovación', async () => {
    vi.spyOn(billingApi, 'getBillingStatus').mockResolvedValue(PRO_ACTIVE_STATUS)
    vi.spyOn(billingApi, 'getUpcoming').mockResolvedValue({
      date: PRO_ACTIVE_STATUS.renewal_date!,
      total: 999,
      currency: 'EUR',
    })
    renderTab()
    expect(await screen.findByText('Plan Pro')).toBeInTheDocument()
    expect(screen.getByText('Activo')).toBeInTheDocument()
    expect(screen.getByText(/Próxima renovación/i)).toBeInTheDocument()
  })

  it('muestra el importe del próximo cobro cuando hay upcoming', async () => {
    vi.spyOn(billingApi, 'getBillingStatus').mockResolvedValue(PRO_ACTIVE_STATUS)
    vi.spyOn(billingApi, 'getUpcoming').mockResolvedValue({
      date: 1764678400,
      total: 999,
      currency: 'EUR',
    })
    renderTab()
    await screen.findByText('Plan Pro')
    expect(await screen.findByText(/9,99/)).toBeInTheDocument()
  })

  it('abre el diálogo de confirmación al pulsar "Cancelar suscripción"', async () => {
    vi.spyOn(billingApi, 'getBillingStatus').mockResolvedValue(PRO_ACTIVE_STATUS)
    vi.spyOn(billingApi, 'getUpcoming').mockResolvedValue(null)
    renderTab()
    fireEvent.click(await screen.findByRole('button', { name: 'Cancelar suscripción' }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText(/¿Cancelar tu plan Pro\?/i)).toBeInTheDocument()
  })

  it('cierra el diálogo al pulsar "Volver" sin cancelar', async () => {
    vi.spyOn(billingApi, 'getBillingStatus').mockResolvedValue(PRO_ACTIVE_STATUS)
    vi.spyOn(billingApi, 'getUpcoming').mockResolvedValue(null)
    const cancelSpy = vi.spyOn(billingApi, 'postCancelSubscription')
    renderTab()
    fireEvent.click(await screen.findByRole('button', { name: 'Cancelar suscripción' }))
    fireEvent.click(screen.getByRole('button', { name: 'Mantener Pro' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(cancelSpy).not.toHaveBeenCalled()
  })

  it('llama a postCancelSubscription al confirmar la cancelación', async () => {
    vi.spyOn(billingApi, 'getBillingStatus').mockResolvedValue(PRO_ACTIVE_STATUS)
    vi.spyOn(billingApi, 'getUpcoming').mockResolvedValue(null)
    const cancelSpy = vi
      .spyOn(billingApi, 'postCancelSubscription')
      .mockResolvedValue({ message: 'OK' })
    renderTab()
    fireEvent.click(await screen.findByRole('button', { name: 'Cancelar suscripción' }))
    fireEvent.click(screen.getByRole('button', { name: 'Sí, cancelar plan' }))
    await waitFor(() => expect(cancelSpy).toHaveBeenCalled())
  })

  it('abre el portal Stripe al pulsar "Portal de facturación"', async () => {
    vi.spyOn(billingApi, 'getBillingStatus').mockResolvedValue(PRO_ACTIVE_STATUS)
    vi.spyOn(billingApi, 'getUpcoming').mockResolvedValue(null)
    const portalSpy = vi
      .spyOn(billingApi, 'postPortal')
      .mockResolvedValue('https://billing.stripe.test/portal')
    renderTab()
    fireEvent.click(await screen.findByRole('button', { name: /Portal de facturación/i }))
    await waitFor(() => expect(portalSpy).toHaveBeenCalled())
    await waitFor(() =>
      expect(navigateExternal).toHaveBeenCalledWith('https://billing.stripe.test/portal'),
    )
  })

  // ─── Pro con cancelación programada ─────────────────────────────

  it('muestra "Cancelación programada" y botón Reanudar cuando cancel_at_period_end', async () => {
    vi.spyOn(billingApi, 'getBillingStatus').mockResolvedValue(PRO_CANCELLED_STATUS)
    vi.spyOn(billingApi, 'getUpcoming').mockResolvedValue(null)
    renderTab()
    expect(await screen.findByText('Cancelación programada')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Reanudar suscripción/i })).toBeInTheDocument()
    expect(screen.getByText(/Tu plan terminará el/i)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Cancelar suscripción' })).not.toBeInTheDocument()
  })

  it('llama a postResumeSubscription al pulsar Reanudar', async () => {
    vi.spyOn(billingApi, 'getBillingStatus').mockResolvedValue(PRO_CANCELLED_STATUS)
    vi.spyOn(billingApi, 'getUpcoming').mockResolvedValue(null)
    const resumeSpy = vi
      .spyOn(billingApi, 'postResumeSubscription')
      .mockResolvedValue({ message: 'OK' })
    renderTab()
    fireEvent.click(await screen.findByRole('button', { name: /Reanudar suscripción/i }))
    await waitFor(() => expect(resumeSpy).toHaveBeenCalled())
  })

  // ─── Past due ───────────────────────────────────────────────────

  it('muestra aviso de pago fallido y botón "Actualizar método de pago" en past_due', async () => {
    vi.spyOn(billingApi, 'getBillingStatus').mockResolvedValue(PRO_PAST_DUE_STATUS)
    vi.spyOn(billingApi, 'getUpcoming').mockResolvedValue(null)
    renderTab()
    expect(await screen.findByText('Pago fallido')).toBeInTheDocument()
    expect(screen.getByText(/Hay un problema con tu pago/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Actualizar método de pago/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Cancelar suscripción' })).not.toBeInTheDocument()
  })

  it('en past_due el botón "Actualizar método de pago" abre el portal Stripe', async () => {
    vi.spyOn(billingApi, 'getBillingStatus').mockResolvedValue(PRO_PAST_DUE_STATUS)
    vi.spyOn(billingApi, 'getUpcoming').mockResolvedValue(null)
    const portalSpy = vi
      .spyOn(billingApi, 'postPortal')
      .mockResolvedValue('https://billing.stripe.test/portal')
    renderTab()
    fireEvent.click(await screen.findByRole('button', { name: /Actualizar método de pago/i }))
    await waitFor(() => expect(portalSpy).toHaveBeenCalled())
  })

  // ─── Errores ────────────────────────────────────────────────────

  it('muestra estado de error y permite reintentar si la query falla', async () => {
    const spy = vi.spyOn(billingApi, 'getBillingStatus').mockRejectedValueOnce(new Error('boom'))
    renderTab()
    expect(await screen.findByText(/No se pudo cargar tu plan/i)).toBeInTheDocument()
    spy.mockResolvedValueOnce(FREE_STATUS)
    fireEvent.click(screen.getByRole('button', { name: /Reintentar/i }))
    expect(await screen.findByText(/Tu plan actual/i)).toBeInTheDocument()
  })
})
