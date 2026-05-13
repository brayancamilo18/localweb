import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import MiPaginaQrSection from '../MiPaginaQrSection'
import { ToastProvider } from '../../../../components/ui/Toast'
import * as qrApi from '../../../../api/qr'
import * as billingApi from '../../../../api/billing'

// La sección consume useDashboard() para leer business.logo_url (logo → base64
// para el PDF) y business.tagline. Los tests no envuelven con el provider completo.
vi.mock('../../context/DashboardContext', () => ({
  useDashboard: () => ({
    business: { logo_url: null, tagline: null },
    stats: { daily_visits: [], total: 0, days_limit: 0, whatsapp_clicks: 0, phone_clicks: 0 },
    refetch: () => {},
  }),
}))

function renderSection() {
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
          <MiPaginaQrSection />
        </MemoryRouter>
      </ToastProvider>
    </QueryClientProvider>,
  )
}

const PRO_INFO: qrApi.QrInfo = {
  public_url: 'https://cafeluna.localweb.app',
  is_pro: true,
  business_name: 'Cafetería Luna',
  tagline: null,
  has_logo: true,
  default_color: '#2563EB',
  template_color: '#2563EB',
}

const FREE_INFO: qrApi.QrInfo = {
  ...PRO_INFO,
  is_pro: false,
  business_name: 'Panadería Pepe',
  default_color: '#FF6B00',
  template_color: '#FF6B00',
}

describe('MiPaginaQrSection', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  // ─── Loading ────────────────────────────────────────────────────
  it('muestra "Cargando código QR…" inicialmente', () => {
    vi.spyOn(qrApi, 'getQrInfo').mockImplementation(() => new Promise(() => {}))
    renderSection()
    expect(screen.getByText(/Cargando código QR/i)).toBeInTheDocument()
  })

  // ─── Sin página publicada (error) ───────────────────────────────
  it('muestra mensaje si aún no hay página publicada', async () => {
    vi.spyOn(qrApi, 'getQrInfo').mockRejectedValueOnce(new Error('boom'))
    renderSection()
    expect(await screen.findByText(/Aún no tienes una página publicada/i)).toBeInTheDocument()
  })

  // ─── Header + descripción ──────────────────────────────────────
  it('renderiza título "Código QR" y la descripción', async () => {
    vi.spyOn(qrApi, 'getQrInfo').mockResolvedValue(PRO_INFO)
    renderSection()
    expect(await screen.findByRole('heading', { level: 2, name: 'Código QR' })).toBeInTheDocument()
    expect(screen.getByText(/Genera un código QR de tu página/i)).toBeInTheDocument()
  })

  // ─── Pro ───────────────────────────────────────────────────────
  it('NO muestra el badge "Solo Pro" para usuarios Pro', async () => {
    vi.spyOn(qrApi, 'getQrInfo').mockResolvedValue(PRO_INFO)
    renderSection()
    await screen.findByRole('heading', { name: 'Código QR' })
    expect(screen.queryByText('Solo Pro')).not.toBeInTheDocument()
  })

  it('inicializa el campo Color con el default_color del backend', async () => {
    vi.spyOn(qrApi, 'getQrInfo').mockResolvedValue(PRO_INFO)
    renderSection()
    expect(await screen.findByDisplayValue('#2563EB')).toBeInTheDocument()
  })

  it('muestra el botón "Restablecer" solo si el color difiere del default', async () => {
    vi.spyOn(qrApi, 'getQrInfo').mockResolvedValue(PRO_INFO)
    renderSection()
    const colorInput = await screen.findByDisplayValue('#2563EB')

    expect(screen.queryByRole('button', { name: /Restablecer/i })).not.toBeInTheDocument()

    fireEvent.change(colorInput, { target: { value: '#FF0000' } })
    expect(screen.getByRole('button', { name: /Restablecer/i })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Restablecer/i }))
    expect(screen.getByDisplayValue('#2563EB')).toBeInTheDocument()
  })

  it('limita el mensaje del póster a 80 caracteres', async () => {
    vi.spyOn(qrApi, 'getQrInfo').mockResolvedValue(PRO_INFO)
    renderSection()
    await screen.findByDisplayValue('¡Escanéame!')
    const messageInput = screen.getByPlaceholderText('¡Escanéame!')
    fireEvent.change(messageInput, { target: { value: 'x'.repeat(120) } })
    expect((messageInput as HTMLInputElement).value).toHaveLength(80)
  })

  it('muestra contador de caracteres del mensaje', async () => {
    vi.spyOn(qrApi, 'getQrInfo').mockResolvedValue(PRO_INFO)
    renderSection()
    await screen.findByDisplayValue('¡Escanéame!')
    expect(screen.getByText(/11\/80 caracteres/i)).toBeInTheDocument()
  })

  it('muestra el toggle "Incluir logo" solo si el negocio tiene logo', async () => {
    vi.spyOn(qrApi, 'getQrInfo').mockResolvedValueOnce({ ...PRO_INFO, has_logo: false })
    const { unmount } = renderSection()
    await screen.findByDisplayValue('#2563EB')
    expect(screen.queryByText(/Incluir logo en el póster/i)).not.toBeInTheDocument()
    unmount()

    vi.spyOn(qrApi, 'getQrInfo').mockResolvedValueOnce(PRO_INFO)
    renderSection()
    expect(await screen.findByText(/Incluir logo en el póster/i)).toBeInTheDocument()
  })

  it('renderiza los 3 tamaños de póster en el select', async () => {
    vi.spyOn(qrApi, 'getQrInfo').mockResolvedValue(PRO_INFO)
    renderSection()
    await screen.findByDisplayValue('#2563EB')
    const options = screen.getAllByRole('option')
    const labels = options.map((o) => o.textContent)
    expect(labels).toContain('A4 (210 × 297 mm)')
    expect(labels).toContain('A5 (148 × 210 mm)')
    expect(labels).toContain('Cuadrado (21 × 21 cm)')
  })

  it('muestra los botones de descarga PNG y póster PDF para Pro', async () => {
    vi.spyOn(qrApi, 'getQrInfo').mockResolvedValue(PRO_INFO)
    renderSection()
    expect(await screen.findByRole('button', { name: /Descargar PNG/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Descargar póster PDF/i })).toBeInTheDocument()
  })

  it('renderiza la URL pública sin el protocolo bajo la previsualización', async () => {
    vi.spyOn(qrApi, 'getQrInfo').mockResolvedValue(PRO_INFO)
    renderSection()
    expect(await screen.findByText('cafeluna.localweb.app')).toBeInTheDocument()
  })

  // ─── Free ──────────────────────────────────────────────────────
  it('muestra badge "Solo Pro" para usuarios Free', async () => {
    vi.spyOn(qrApi, 'getQrInfo').mockResolvedValue(FREE_INFO)
    renderSection()
    expect(await screen.findByText('Solo Pro')).toBeInTheDocument()
  })

  it('muestra overlay "Disponible en Pro" sobre la previsualización para Free', async () => {
    vi.spyOn(qrApi, 'getQrInfo').mockResolvedValue(FREE_INFO)
    renderSection()
    expect(await screen.findByText('Disponible en Pro')).toBeInTheDocument()
  })

  it('muestra upsell con CTA "Mejorar a Pro" para Free', async () => {
    vi.spyOn(qrApi, 'getQrInfo').mockResolvedValue(FREE_INFO)
    renderSection()
    expect(await screen.findByText(/Mejora a Pro para descargar tu QR/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Mejorar a Pro/i })).toBeInTheDocument()
  })

  it('llama a checkout al pulsar "Mejorar a Pro"', async () => {
    vi.spyOn(qrApi, 'getQrInfo').mockResolvedValue(FREE_INFO)
    const checkoutSpy = vi
      .spyOn(billingApi, 'postCheckout')
      .mockResolvedValue('https://checkout.stripe.test/abc')
    renderSection()
    fireEvent.click(await screen.findByRole('button', { name: /Mejorar a Pro/i }))
    await waitFor(() => expect(checkoutSpy).toHaveBeenCalled())
  })

  it('los campos del formulario están deshabilitados para Free', async () => {
    vi.spyOn(qrApi, 'getQrInfo').mockResolvedValue(FREE_INFO)
    renderSection()
    const colorInput = await screen.findByDisplayValue('#FF6B00')
    expect(colorInput).toBeDisabled()
    expect(screen.getByPlaceholderText('¡Escanéame!')).toBeDisabled()
  })

  it('NO muestra botones de descarga PNG/PDF para Free', async () => {
    vi.spyOn(qrApi, 'getQrInfo').mockResolvedValue(FREE_INFO)
    renderSection()
    await screen.findByText('Solo Pro')
    expect(screen.queryByRole('button', { name: /Descargar PNG/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Descargar póster PDF/i })).not.toBeInTheDocument()
  })

  it('inicializa el color con el default_color naranja del template Free', async () => {
    vi.spyOn(qrApi, 'getQrInfo').mockResolvedValue(FREE_INFO)
    renderSection()
    expect(await screen.findByDisplayValue('#FF6B00')).toBeInTheDocument()
  })

  // ─── Descarga PNG ──────────────────────────────────────────────
  it('al pulsar "Descargar PNG" crea un anchor con la URL del backend y dispara click', async () => {
    vi.spyOn(qrApi, 'getQrInfo').mockResolvedValue(PRO_INFO)
    const urlSpy = vi
      .spyOn(qrApi, 'getQrPngDownloadUrl')
      .mockReturnValue('/api/v1/qr/png?size=1024')

    const realCreate = document.createElement.bind(document)
    const clickSpy = vi.fn()
    const createSpy = vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      const el = realCreate(tag) as HTMLAnchorElement
      if (tag === 'a') el.click = clickSpy
      return el
    })

    renderSection()
    fireEvent.click(await screen.findByRole('button', { name: /Descargar PNG/i }))

    await waitFor(() => expect(urlSpy).toHaveBeenCalled())
    await waitFor(() => expect(clickSpy).toHaveBeenCalled())

    createSpy.mockRestore()
  })

  it('al pulsar PNG con color modificado pasa el color como override a la URL', async () => {
    vi.spyOn(qrApi, 'getQrInfo').mockResolvedValue(PRO_INFO)
    const urlSpy = vi
      .spyOn(qrApi, 'getQrPngDownloadUrl')
      .mockReturnValue('/api/v1/qr/png?size=1024&color=%23FF0000')
    renderSection()
    const colorInput = await screen.findByDisplayValue('#2563EB')
    fireEvent.change(colorInput, { target: { value: '#FF0000' } })
    fireEvent.click(screen.getByRole('button', { name: /Descargar PNG/i }))
    await waitFor(() => {
      expect(urlSpy).toHaveBeenCalledWith({ size: 1024, color: '#FF0000' })
    })
  })

  it('al pulsar PNG sin modificar el color NO pasa color override', async () => {
    vi.spyOn(qrApi, 'getQrInfo').mockResolvedValue(PRO_INFO)
    const urlSpy = vi
      .spyOn(qrApi, 'getQrPngDownloadUrl')
      .mockReturnValue('/api/v1/qr/png?size=1024')
    renderSection()
    await screen.findByDisplayValue('#2563EB')
    fireEvent.click(screen.getByRole('button', { name: /Descargar PNG/i }))
    await waitFor(() => {
      expect(urlSpy).toHaveBeenCalledWith({ size: 1024, color: undefined })
    })
  })

  // ─── Descarga PDF ──────────────────────────────────────────────
  it('al pulsar "Descargar póster PDF" llama a postQrPoster con las opciones del formulario', async () => {
    vi.spyOn(qrApi, 'getQrInfo').mockResolvedValue(PRO_INFO)
    const blob = new Blob(['%PDF-1.4 fake'], { type: 'application/pdf' })
    const posterSpy = vi.spyOn(qrApi, 'postQrPoster').mockResolvedValue(blob)
    const createObjUrl = vi.fn().mockReturnValue('blob:fake')
    const revokeObjUrl = vi.fn()
    Object.assign(URL, { createObjectURL: createObjUrl, revokeObjectURL: revokeObjUrl })

    renderSection()
    await screen.findByDisplayValue('#2563EB')
    fireEvent.click(screen.getByRole('button', { name: /Descargar póster PDF/i }))

    await waitFor(() => {
      expect(posterSpy).toHaveBeenCalledWith({
        size: 'a4',
        message: '¡Escanéame!',
        include_logo: true,
      })
    })
    await waitFor(() => expect(createObjUrl).toHaveBeenCalledWith(blob))
  })

  it('envía color override al PDF cuando el color difiere del default', async () => {
    vi.spyOn(qrApi, 'getQrInfo').mockResolvedValue(PRO_INFO)
    const posterSpy = vi
      .spyOn(qrApi, 'postQrPoster')
      .mockResolvedValue(new Blob([], { type: 'application/pdf' }))
    Object.assign(URL, { createObjectURL: vi.fn().mockReturnValue('blob:fake'), revokeObjectURL: vi.fn() })

    renderSection()
    const colorInput = await screen.findByDisplayValue('#2563EB')
    fireEvent.change(colorInput, { target: { value: '#FF0000' } })
    fireEvent.click(screen.getByRole('button', { name: /Descargar póster PDF/i }))

    await waitFor(() => {
      expect(posterSpy).toHaveBeenCalledWith(expect.objectContaining({ color: '#FF0000' }))
    })
  })

  it('envía size del select al PDF', async () => {
    vi.spyOn(qrApi, 'getQrInfo').mockResolvedValue(PRO_INFO)
    const posterSpy = vi
      .spyOn(qrApi, 'postQrPoster')
      .mockResolvedValue(new Blob([], { type: 'application/pdf' }))
    Object.assign(URL, { createObjectURL: vi.fn().mockReturnValue('blob:fake'), revokeObjectURL: vi.fn() })

    renderSection()
    await screen.findByDisplayValue('#2563EB')
    const sizeSelect = screen.getByRole('combobox')
    fireEvent.change(sizeSelect, { target: { value: 'a5' } })
    fireEvent.click(screen.getByRole('button', { name: /Descargar póster PDF/i }))

    await waitFor(() => {
      expect(posterSpy).toHaveBeenCalledWith(expect.objectContaining({ size: 'a5' }))
    })
  })

  it('include_logo es false cuando el negocio no tiene logo', async () => {
    vi.spyOn(qrApi, 'getQrInfo').mockResolvedValue({ ...PRO_INFO, has_logo: false })
    const posterSpy = vi
      .spyOn(qrApi, 'postQrPoster')
      .mockResolvedValue(new Blob([], { type: 'application/pdf' }))
    Object.assign(URL, { createObjectURL: vi.fn().mockReturnValue('blob:fake'), revokeObjectURL: vi.fn() })

    renderSection()
    await screen.findByDisplayValue('#2563EB')
    fireEvent.click(screen.getByRole('button', { name: /Descargar póster PDF/i }))

    await waitFor(() => {
      expect(posterSpy).toHaveBeenCalledWith(expect.objectContaining({ include_logo: false }))
    })
  })

  it('muestra error toast si la descarga del PDF falla', async () => {
    vi.spyOn(qrApi, 'getQrInfo').mockResolvedValue(PRO_INFO)
    vi.spyOn(qrApi, 'postQrPoster').mockRejectedValue(new Error('boom'))

    renderSection()
    await screen.findByDisplayValue('#2563EB')
    fireEvent.click(screen.getByRole('button', { name: /Descargar póster PDF/i }))

    expect(await screen.findByText(/No se pudo generar el póster/i)).toBeInTheDocument()
  })

  it('los botones de descarga están mutuamente bloqueados durante una descarga', async () => {
    vi.spyOn(qrApi, 'getQrInfo').mockResolvedValue(PRO_INFO)
    vi.spyOn(qrApi, 'postQrPoster').mockImplementation(() => new Promise(() => {}))
    Object.assign(URL, { createObjectURL: vi.fn().mockReturnValue('blob:fake'), revokeObjectURL: vi.fn() })

    renderSection()
    await screen.findByDisplayValue('#2563EB')
    fireEvent.click(screen.getByRole('button', { name: /Descargar póster PDF/i }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Descargar PNG/i })).toBeDisabled()
    })
  })
})
