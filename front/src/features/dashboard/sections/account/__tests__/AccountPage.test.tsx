import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import AccountPage from '../AccountPage'
import { DashboardContext, EMPTY_STATS } from '../../../context/DashboardContext'
import type { Business } from '../../../../../types/api'
import { ToastProvider } from '../../../../../components/ui/Toast'
import * as accountApi from '../../../../../api/account'
import * as billingApi from '../../../../../api/billing'
import type { BillingInvoice } from '../../../../../api/billing'

const PRO_BILLING_STATUS: billingApi.BillingStatus = {
  plan: 'pro',
  is_pro: true,
  is_free: false,
  subscription_status: 'active',
  renewal_date: 1764678400,
  cancel_at_period_end: false,
}

function makeInvoice(overrides: Partial<BillingInvoice> = {}): BillingInvoice {
  return {
    id: 'in_test_001',
    number: 'INV-0001',
    date: 1762000000,
    total: 999,
    currency: 'EUR',
    status: 'paid',
    hosted_invoice_url: 'https://invoice.stripe.test/in_test_001',
    ...overrides,
  }
}

function setupAccountAndBillingMocks(overrides?: {
  billingStatus?: billingApi.BillingStatus
}) {
  vi.spyOn(accountApi, 'getAccountProfile').mockResolvedValue({
    user: {
      id: 1,
      name: 'Usuario Test',
      email: 'usuario@test.com',
      email_verified_at: '2026-01-01T00:00:00Z',
    },
    business_name: 'Cafetería Luna',
  })
  vi.spyOn(billingApi, 'getBillingStatus').mockResolvedValue(overrides?.billingStatus ?? PRO_BILLING_STATUS)
  vi.spyOn(billingApi, 'getUpcoming').mockResolvedValue(null)
  vi.spyOn(billingApi, 'getInvoices').mockResolvedValue([makeInvoice()])
  vi.spyOn(billingApi, 'getPaymentMethod').mockResolvedValue({
    brand: 'visa',
    last4: '4242',
    exp_month: 12,
    exp_year: 2030,
  })
}

function makeBusiness(overrides: Partial<Business> = {}): Business {
  return {
    id: 1,
    name: 'Cafetería Luna',
    subdomain: 'luna',
    subdomain_type: 'custom',
    sector: 'cafe',
    plan: 'pro',
    onboarding_completed_at: '2026-01-01T00:00:00Z',
    tagline: null,
    description: null,
    phone: null,
    email: null,
    address: null,
    lat: null,
    lng: null,
    google_maps_url: null,
    google_business_url: null,
    booking_url: null,
    instagram_url: null,
    tiktok_url: null,
    facebook_url: null,
    vcard_enabled: false,
    schedule: null,
    logo_url: null,
    whatsapp_url: null,
    is_published: true,
    is_free: false,
    is_pro: true,
    template: {
      id: 1,
      name: 'Default',
      slug: 'default',
      primary_color: '#000',
      requires_pro: false,
      hero_photo_slots: 1,
      thumbnail_url: null,
      category: null,
      suitable_sectors: [],
      sort_order: 10,
      featured: false,
    },
    images: { cover: [], gallery: [], about: [] },
    services: [],
    stats: null,
    ...overrides,
  } as Business
}

function renderAt(path: string, businessOverrides: Partial<Business> = {}) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false, gcTime: 0 } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <MemoryRouter initialEntries={[path]}>
          <DashboardContext.Provider
            value={{ business: makeBusiness(businessOverrides), stats: EMPTY_STATS, refetch: () => {} }}
          >
            <Routes>
              <Route path="/dashboard/account" element={<AccountPage />} />
            </Routes>
          </DashboardContext.Provider>
        </MemoryRouter>
      </ToastProvider>
    </QueryClientProvider>,
  )
}

describe('AccountPage', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    setupAccountAndBillingMocks()
  })

  it('renderiza el título "Mi cuenta" y el subtítulo descriptivo', () => {
    renderAt('/dashboard/account')
    expect(screen.getByRole('heading', { level: 1, name: 'Mi cuenta' })).toBeInTheDocument()
    expect(screen.getByText(/Datos personales, plan, facturas/i)).toBeInTheDocument()
  })

  it('muestra el nombre del negocio y el plan en la tarjeta de resumen', () => {
    renderAt('/dashboard/account')
    expect(screen.getByText('Cafetería Luna')).toBeInTheDocument()
    expect(screen.getByText('Plan Pro')).toBeInTheDocument()
  })

  it('muestra "Plan Gratis" para usuarios free', () => {
    renderAt('/dashboard/account', { is_pro: false, is_free: true, plan: 'free' })
    expect(screen.getByText('Plan Gratis')).toBeInTheDocument()
  })

  it('renderiza los 4 tabs Perfil/Plan/Facturas/Pago', () => {
    renderAt('/dashboard/account')
    expect(screen.getByRole('button', { name: 'Perfil' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Plan' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Facturas' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Pago' })).toBeInTheDocument()
  })

  it('muestra el tab Perfil por defecto cuando no hay query string', async () => {
    renderAt('/dashboard/account')
    expect(
      await screen.findByRole('heading', { level: 2, name: 'Datos personales' }),
    ).toBeInTheDocument()
  })

  it('muestra el tab Plan cuando ?tab=plan', async () => {
    renderAt('/dashboard/account?tab=plan')
    expect(await screen.findByText('Plan Pro')).toBeInTheDocument()
  })

  it('muestra el tab Facturas cuando ?tab=facturas', async () => {
    renderAt('/dashboard/account?tab=facturas')
    expect(await screen.findByRole('heading', { name: 'Historial de facturas' })).toBeInTheDocument()
  })

  it('muestra el tab Pago cuando ?tab=pago', async () => {
    renderAt('/dashboard/account?tab=pago')
    expect(await screen.findByRole('heading', { name: 'Método de pago' })).toBeInTheDocument()
  })

  it('cae al tab Perfil cuando el query string es inválido', async () => {
    renderAt('/dashboard/account?tab=cualquiercosa')
    expect(
      await screen.findByRole('heading', { level: 2, name: 'Datos personales' }),
    ).toBeInTheDocument()
  })

  it('cambia al tab Plan al hacer click en su botón', async () => {
    renderAt('/dashboard/account')
    fireEvent.click(screen.getByRole('button', { name: 'Plan' }))
    expect((await screen.findAllByText('Plan Pro')).length).toBeGreaterThanOrEqual(1)
  })

  it('cambia al tab Facturas al hacer click', async () => {
    renderAt('/dashboard/account')
    fireEvent.click(screen.getByRole('button', { name: 'Facturas' }))
    expect(await screen.findByRole('heading', { name: 'Historial de facturas' })).toBeInTheDocument()
  })
})
