import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import AccountTabFacturas from '../AccountTabFacturas'
import { ToastProvider } from '../../../../../components/ui/Toast'
import * as billingApi from '../../../../../api/billing'
import type { BillingInvoice } from '../../../../../api/billing'

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
          <AccountTabFacturas />
        </MemoryRouter>
      </ToastProvider>
    </QueryClientProvider>,
  )
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

describe('AccountTabFacturas', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  // ─── Loading ────────────────────────────────────────────────────
  it('muestra "Cargando facturas…" mientras se carga', () => {
    vi.spyOn(billingApi, 'getInvoices').mockImplementation(() => new Promise(() => {}))
    renderTab()
    expect(screen.getByText(/Cargando facturas/i)).toBeInTheDocument()
  })

  // ─── Empty ──────────────────────────────────────────────────────
  it('muestra estado vacío cuando no hay facturas', async () => {
    vi.spyOn(billingApi, 'getInvoices').mockResolvedValue([])
    renderTab()
    expect(await screen.findByText(/Aún no hay facturas/i)).toBeInTheDocument()
    expect(screen.getByText(/Cuando hagas tu primer pago/i)).toBeInTheDocument()
  })

  // ─── Error ──────────────────────────────────────────────────────
  it('muestra error con botón Reintentar y se recupera al pulsarlo', async () => {
    const spy = vi.spyOn(billingApi, 'getInvoices').mockRejectedValueOnce(new Error('boom'))
    renderTab()
    expect(await screen.findByText(/No se pudieron cargar tus facturas/i)).toBeInTheDocument()
    spy.mockResolvedValueOnce([makeInvoice()])
    fireEvent.click(screen.getByRole('button', { name: /Reintentar/i }))
    expect(await screen.findByText('INV-0001')).toBeInTheDocument()
  })

  // ─── Listado básico ─────────────────────────────────────────────
  it('renderiza el número, fecha e importe formateados', async () => {
    vi.spyOn(billingApi, 'getInvoices').mockResolvedValue([makeInvoice()])
    renderTab()
    expect(await screen.findByText('INV-0001')).toBeInTheDocument()
    // 999 céntimos en EUR -> "9,99 €"
    expect(screen.getByText(/9,99/)).toBeInTheDocument()
    // Fecha en español (1762000000 -> noviembre de 2025)
    expect(screen.getByText(/2025/)).toBeInTheDocument()
  })

  it('cae a inv.id como fallback cuando number es null', async () => {
    vi.spyOn(billingApi, 'getInvoices').mockResolvedValue([
      makeInvoice({ number: null, id: 'in_xyz' }),
    ])
    renderTab()
    expect(await screen.findByText('in_xyz')).toBeInTheDocument()
  })

  it('muestra el contador con el número correcto en el header', async () => {
    vi.spyOn(billingApi, 'getInvoices').mockResolvedValue([
      makeInvoice({ id: 'in_1', number: 'INV-1' }),
      makeInvoice({ id: 'in_2', number: 'INV-2' }),
      makeInvoice({ id: 'in_3', number: 'INV-3' }),
    ])
    renderTab()
    expect(await screen.findByText(/3 facturas/)).toBeInTheDocument()
  })

  it('usa "1 factura" en singular cuando hay solo una', async () => {
    vi.spyOn(billingApi, 'getInvoices').mockResolvedValue([makeInvoice()])
    renderTab()
    expect(await screen.findByText(/1 factura/)).toBeInTheDocument()
    expect(screen.queryByText(/1 facturas/)).not.toBeInTheDocument()
  })

  // ─── Estados de la factura ──────────────────────────────────────
  it('muestra el badge "Pagada" para status paid', async () => {
    vi.spyOn(billingApi, 'getInvoices').mockResolvedValue([makeInvoice({ status: 'paid' })])
    renderTab()
    expect(await screen.findByText('Pagada')).toBeInTheDocument()
  })

  it('muestra el badge "Pendiente" para status open', async () => {
    vi.spyOn(billingApi, 'getInvoices').mockResolvedValue([makeInvoice({ status: 'open' })])
    renderTab()
    expect(await screen.findByText('Pendiente')).toBeInTheDocument()
  })

  it('muestra el badge "Anulada" para status void', async () => {
    vi.spyOn(billingApi, 'getInvoices').mockResolvedValue([makeInvoice({ status: 'void' })])
    renderTab()
    expect(await screen.findByText('Anulada')).toBeInTheDocument()
  })

  // ─── Acciones ──────────────────────────────────────────────────
  it('renderiza botones "Ver" y "PDF" para una factura con hosted_invoice_url', async () => {
    vi.spyOn(billingApi, 'getInvoices').mockResolvedValue([makeInvoice()])
    renderTab()
    await screen.findByText('INV-0001')
    expect(screen.getByRole('button', { name: /Ver/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Descargar factura INV-0001/i })).toBeInTheDocument()
  })

  it('NO renderiza botón "Ver" cuando hosted_invoice_url es null', async () => {
    vi.spyOn(billingApi, 'getInvoices').mockResolvedValue([
      makeInvoice({ hosted_invoice_url: null }),
    ])
    renderTab()
    await screen.findByText('INV-0001')
    expect(screen.queryByRole('button', { name: /^Ver$/ })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Descargar factura/i })).toBeInTheDocument()
  })

  it('al pulsar PDF descarga el blob y dispara el click del anchor temporal', async () => {
    vi.spyOn(billingApi, 'getInvoices').mockResolvedValue([makeInvoice()])
    const fakeBlob = new Blob(['%PDF-1.4 fake'], { type: 'application/pdf' })
    const downloadSpy = vi
      .spyOn(billingApi, 'downloadInvoiceBlob')
      .mockResolvedValue(fakeBlob)

    // jsdom no implementa URL.createObjectURL/revokeObjectURL: stubeamos ambos
    // para verificar que se generó/liberó el object URL del PDF.
    const createObjectURLSpy = vi
      .spyOn(URL, 'createObjectURL')
      .mockReturnValue('blob:mocked-url')
    const revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})

    // Espía en createElement para capturar el <a> creado por el handler.
    const realCreate = document.createElement.bind(document)
    const clickSpy = vi.fn()
    const createSpy = vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      const el = realCreate(tag) as HTMLAnchorElement
      if (tag === 'a') {
        el.click = clickSpy
      }
      return el
    })

    renderTab()
    fireEvent.click(await screen.findByRole('button', { name: /Descargar factura INV-0001/i }))

    await waitFor(() => expect(downloadSpy).toHaveBeenCalledWith('in_test_001'))
    await waitFor(() => expect(createObjectURLSpy).toHaveBeenCalledWith(fakeBlob))
    expect(clickSpy).toHaveBeenCalled()
    expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:mocked-url')

    createSpy.mockRestore()
    createObjectURLSpy.mockRestore()
    revokeObjectURLSpy.mockRestore()
  })

  it('muestra spinner solo en el botón de la factura clicada durante la descarga', async () => {
    const inv1 = makeInvoice({ id: 'in_a', number: 'INV-A' })
    const inv2 = makeInvoice({ id: 'in_b', number: 'INV-B' })
    vi.spyOn(billingApi, 'getInvoices').mockResolvedValue([inv1, inv2])

    // Promesa pendiente controlada para mantener el botón en loading.
    let resolveDownload: ((blob: Blob) => void) | undefined
    vi.spyOn(billingApi, 'downloadInvoiceBlob').mockImplementation(
      () => new Promise<Blob>((resolve) => { resolveDownload = resolve }),
    )
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mocked-url')
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})

    renderTab()
    const btnA = await screen.findByRole('button', { name: /Descargar factura INV-A/i })
    const btnB = screen.getByRole('button', { name: /Descargar factura INV-B/i })

    fireEvent.click(btnA)

    // Mientras la descarga está en curso: A queda disabled (por loading), B
    // también disabled (otro descargando) pero NO en loading.
    await waitFor(() => expect(btnA).toBeDisabled())
    expect(btnB).toBeDisabled()

    // Al resolver la promesa, ambos botones vuelven a estar habilitados.
    resolveDownload?.(new Blob(['x'], { type: 'application/pdf' }))
    await waitFor(() => expect(btnA).not.toBeDisabled())
    expect(btnB).not.toBeDisabled()
  })

  it('muestra toast de error si la descarga del blob falla', async () => {
    vi.spyOn(billingApi, 'getInvoices').mockResolvedValue([makeInvoice()])
    vi.spyOn(billingApi, 'downloadInvoiceBlob').mockRejectedValue(new Error('500'))

    renderTab()
    fireEvent.click(await screen.findByRole('button', { name: /Descargar factura INV-0001/i }))

    expect(await screen.findByText(/No se pudo descargar la factura/i)).toBeInTheDocument()
  })

  it('al pulsar "Ver" abre el hosted invoice en nueva pestaña', async () => {
    vi.spyOn(billingApi, 'getInvoices').mockResolvedValue([makeInvoice()])
    const openSpy = vi.spyOn(window, 'open').mockReturnValue(null)
    renderTab()
    fireEvent.click(await screen.findByRole('button', { name: /Ver/ }))
    expect(openSpy).toHaveBeenCalledWith(
      'https://invoice.stripe.test/in_test_001',
      '_blank',
      'noopener,noreferrer',
    )
    openSpy.mockRestore()
  })

  // ─── Paginación ────────────────────────────────────────────────
  it('NO muestra paginación cuando hay 10 o menos facturas', async () => {
    const items = Array.from({ length: 10 }, (_, i) =>
      makeInvoice({ id: `in_${i}`, number: `INV-${String(i).padStart(4, '0')}` }),
    )
    vi.spyOn(billingApi, 'getInvoices').mockResolvedValue(items)
    renderTab()
    await screen.findByText('INV-0000')
    expect(screen.queryByText(/Página \d+ de \d+/)).not.toBeInTheDocument()
  })

  it('muestra paginación cuando hay más de 10 facturas', async () => {
    const items = Array.from({ length: 12 }, (_, i) =>
      makeInvoice({ id: `in_${i}`, number: `INV-${String(i).padStart(4, '0')}` }),
    )
    vi.spyOn(billingApi, 'getInvoices').mockResolvedValue(items)
    renderTab()
    expect(await screen.findByText(/Página 1 de 2/)).toBeInTheDocument()
    // Las primeras 10 visibles, las 2 últimas no
    expect(screen.getByText('INV-0000')).toBeInTheDocument()
    expect(screen.getByText('INV-0009')).toBeInTheDocument()
    expect(screen.queryByText('INV-0010')).not.toBeInTheDocument()
  })

  it('navega a la página 2 al pulsar "Página siguiente"', async () => {
    const items = Array.from({ length: 12 }, (_, i) =>
      makeInvoice({ id: `in_${i}`, number: `INV-${String(i).padStart(4, '0')}` }),
    )
    vi.spyOn(billingApi, 'getInvoices').mockResolvedValue(items)
    renderTab()
    await screen.findByText('INV-0000')
    fireEvent.click(screen.getByRole('button', { name: /Página siguiente/i }))
    expect(await screen.findByText(/Página 2 de 2/)).toBeInTheDocument()
    expect(screen.getByText('INV-0010')).toBeInTheDocument()
    expect(screen.getByText('INV-0011')).toBeInTheDocument()
    expect(screen.queryByText('INV-0000')).not.toBeInTheDocument()
  })

  it('deshabilita "Página anterior" estando en página 1', async () => {
    const items = Array.from({ length: 12 }, (_, i) =>
      makeInvoice({ id: `in_${i}`, number: `INV-${String(i).padStart(4, '0')}` }),
    )
    vi.spyOn(billingApi, 'getInvoices').mockResolvedValue(items)
    renderTab()
    await screen.findByText('INV-0000')
    expect(screen.getByRole('button', { name: /Página anterior/i })).toBeDisabled()
    expect(screen.getByRole('button', { name: /Página siguiente/i })).not.toBeDisabled()
  })

  it('deshabilita "Página siguiente" estando en la última página', async () => {
    const items = Array.from({ length: 12 }, (_, i) =>
      makeInvoice({ id: `in_${i}`, number: `INV-${String(i).padStart(4, '0')}` }),
    )
    vi.spyOn(billingApi, 'getInvoices').mockResolvedValue(items)
    renderTab()
    await screen.findByText('INV-0000')
    fireEvent.click(screen.getByRole('button', { name: /Página siguiente/i }))
    await screen.findByText(/Página 2 de 2/)
    expect(screen.getByRole('button', { name: /Página siguiente/i })).toBeDisabled()
    expect(screen.getByRole('button', { name: /Página anterior/i })).not.toBeDisabled()
  })
})
