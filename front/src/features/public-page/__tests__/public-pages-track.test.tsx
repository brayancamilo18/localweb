import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { PubSoft } from '../public-pages'
import { trackClick } from '../../../api/public'

vi.mock('../../../api/public', () => ({
  trackClick: vi.fn().mockResolvedValue(undefined),
  getPublicBusiness: vi.fn(),
}))

vi.mock('../../../lib/cookieConsent', () => ({
  hasConsent: vi.fn(() => true),
}))

const mockTrackClick = vi.mocked(trackClick)

const baseBusiness = {
  subdomain: 'test-subdomain',
  name: 'Salón Test',
  tagline: 'Tu estilo',
  description: 'Descripción',
  phone: '+34 600 11 22 33',
  whatsapp_url: 'https://wa.me/34600112233',
  address: 'Calle Mayor 1',
  schedule: null,
  is_pro: false,
  images: {},
}

describe('PubSoft contact click tracking', () => {
  it('calls trackClick on WhatsApp button click without blocking navigation', () => {
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null)

    render(
      <MemoryRouter initialEntries={['/test-subdomain']}>
        <Routes>
          <Route path="/:subdomain" element={<PubSoft business={baseBusiness} />} />
        </Routes>
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByRole('button', { name: /whatsapp/i }))

    expect(mockTrackClick).toHaveBeenCalledWith('test-subdomain', 'whatsapp_click')
    expect(openSpy).toHaveBeenCalledWith(
      'https://wa.me/34600112233',
      '_blank',
      'noopener,noreferrer',
    )

    openSpy.mockRestore()
  })
})
