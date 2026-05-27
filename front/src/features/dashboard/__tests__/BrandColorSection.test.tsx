import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { getColorDisplayName } from '../../../lib/hexColorName'
import BrandColorSection from '../sections/BrandColorSection'

const showToast = vi.fn()
const mutate = vi.fn()

const palette = ['#d4ff3a', '#ff5a3a', '#3affe5', '#ffd23a', '#ff80ab', '#ff6b00']

let brandColorState = {
  palette,
  current: null as string | null,
  effective: '#d4ff3a',
  default: '#d4ff3a',
  template_slug: 'urban-bold',
  template_meta: { usage: 'bg' as const, bg: '#f4f1ea', ink: '#0a0a0a' },
  contrast_warning: null as string | null,
  is_pro: true,
  is_supported: true,
}

let dashboardBusiness = {
  is_pro: true,
  name: 'Test Biz',
  template: { name: 'Urban Bold', slug: 'urban-bold' },
}

vi.mock('../../../components/ui/Toast', () => ({
  useToast: () => ({ showToast }),
}))

vi.mock('../../shared/useBrandColor', () => ({
  useBrandColor: vi.fn(() => ({
    data: brandColorState,
    isLoading: false,
    error: null,
    mutate,
    isPending: false,
  })),
}))

vi.mock('../context/DashboardContext', () => ({
  useDashboard: () => ({
    business: dashboardBusiness,
    refetch: vi.fn(),
  }),
}))

function renderSection() {
  return render(
    <MemoryRouter>
      <BrandColorSection />
    </MemoryRouter>,
  )
}

describe('BrandColorSection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    brandColorState = {
      palette,
      current: null,
      effective: '#d4ff3a',
      default: '#d4ff3a',
      template_slug: 'urban-bold',
      template_meta: { usage: 'bg' as const, bg: '#f4f1ea', ink: '#0a0a0a' },
      contrast_warning: null,
      is_pro: true,
      is_supported: true,
    }
    dashboardBusiness = {
      is_pro: true,
      name: 'Test Biz',
      template: { name: 'Urban Bold', slug: 'urban-bold' },
    }
    mutate.mockImplementation(
      (_color: string | null, options?: { onSuccess?: (result?: { contrast_warning?: string | null }) => void }) => {
        options?.onSuccess?.({ contrast_warning: null })
      },
    )
  })

  it('usuario Free no ve la sección funcional de color de marca', () => {
    dashboardBusiness = { ...dashboardBusiness, is_pro: false }
    renderSection()
    expect(screen.getByText(/El color de marca personalizado está disponible en el plan Pro/i)).toBeInTheDocument()
    expect(screen.queryByRole('group', { name: 'Elige el color de marca' })).not.toBeInTheDocument()
  })

  it('usuario Pro con plantilla soportada ve el picker con su paleta', () => {
    renderSection()
    expect(screen.getByTestId('brand-color-section')).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /Color marca:/i })).toHaveLength(6)
    expect(screen.getByRole('button', { name: 'Confirmar color' })).toBeDisabled()
  })

  it('usuario Pro con plantilla wild-pet ve el mensaje de plantilla no soportada y NO ve picker', () => {
    brandColorState = { ...brandColorState, is_supported: false }
    renderSection()
    expect(screen.getByText(/no admite cambio de color de marca/i)).toBeInTheDocument()
    expect(screen.queryByRole('group', { name: 'Elige el color de marca' })).not.toBeInTheDocument()
  })

  it('clic en un swatch no guarda hasta pulsar Confirmar color', () => {
    renderSection()
    fireEvent.click(screen.getByRole('button', { name: `Color marca: ${getColorDisplayName('#ff5a3a')}` }))
    expect(mutate).not.toHaveBeenCalled()
    const confirm = screen.getByRole('button', { name: 'Confirmar color' })
    expect(confirm).not.toBeDisabled()
    fireEvent.click(confirm)
    expect(mutate).toHaveBeenCalledWith('#ff5a3a', expect.any(Object))
  })

  it('mutación exitosa muestra toast de éxito', async () => {
    renderSection()
    fireEvent.click(screen.getByRole('button', { name: `Color marca: ${getColorDisplayName('#ff5a3a')}` }))
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar color' }))
    await waitFor(() => {
      expect(showToast).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'success',
          title: 'Color actualizado',
        }),
      )
    })
  })

  it('mutación fallida muestra toast de error y revierte la selección', async () => {
    brandColorState = { ...brandColorState, current: '#3affe5' }
    mutate.mockImplementation((_color: string | null, options?: { onError?: () => void }) => {
      options?.onError?.()
    })
    renderSection()
    fireEvent.click(screen.getByRole('button', { name: `Color marca: ${getColorDisplayName('#ff5a3a')}` }))
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar color' }))
    await waitFor(() => {
      expect(showToast).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'error',
          title: 'No se pudo guardar el color',
        }),
      )
    })
    expect(screen.getByRole('button', { name: `Color marca: ${getColorDisplayName('#3affe5')}` })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })

  it('Restablecer solo cambia la selección local hasta confirmar', () => {
    brandColorState = { ...brandColorState, current: '#ff5a3a' }
    renderSection()
    fireEvent.click(screen.getByRole('button', { name: 'Restablecer' }))
    expect(mutate).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar color' }))
    expect(mutate).toHaveBeenCalledWith(null, expect.any(Object))
  })
})
