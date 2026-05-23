import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import MiPagina from '../MiPagina'
import { DashboardContext, EMPTY_STATS } from '../../context/DashboardContext'
import { ToastProvider } from '../../../../components/ui/Toast'
import { mockTemplate } from '../../../../test/mockTemplate'
import type { Business } from '../../../../types/api'

const navigateMock = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return { ...actual, useNavigate: () => navigateMock }
})

function makeBusiness(): Business {
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
    city: null,
    country: null,
    country_code: null,
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
    favicon_url: null,
    whatsapp_url: null,
    is_published: true,
    is_free: false,
    is_pro: true,
    template: mockTemplate({ id: 1, name: 'D', slug: 'd', primary_color: '#000' }),
    images: { cover: [], gallery: [], about: [] },
    services: [],
    stats: null,
  } as Business
}

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })
  return render(
    <QueryClientProvider client={qc}>
      <ToastProvider>
        <MemoryRouter>
          <DashboardContext.Provider
            value={{ business: makeBusiness(), stats: EMPTY_STATS, refetch: () => {} }}
          >
            <MiPagina />
          </DashboardContext.Provider>
        </MemoryRouter>
      </ToastProvider>
    </QueryClientProvider>,
  )
}

describe('MiPagina — botón Cuenta', () => {
  beforeEach(() => navigateMock.mockReset())

  it('navega a /dashboard/account al pulsar Cuenta', () => {
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: /cuenta/i }))
    expect(navigateMock).toHaveBeenCalledWith('/dashboard/account')
  })
})
