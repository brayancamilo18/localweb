import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import type { ReactNode } from 'react'
import Diseno, { buildTemplateChangePayload } from '../Diseno'

const { showToast, previewTemplateChange, changeBusinessTemplate, refetch } = vi.hoisted(() => ({
  showToast: vi.fn(),
  previewTemplateChange: vi.fn(),
  changeBusinessTemplate: vi.fn(),
  refetch: vi.fn(),
}))

const templateTrust = {
  id: 7,
  name: 'Trust Clinic',
  slug: 'trust-clinic',
  requires_pro: false,
  locked: false,
}

const templatesResponse = {
  templates: [templateTrust],
  meta: {
    can_change: true,
    current_template_id: 1,
    on_cooldown: false,
    available_at: null,
  },
}

vi.mock('../../../../components/ui/Toast', () => ({
  useToast: () => ({ showToast }),
}))

vi.mock('../../../../api/dashboard', async () => {
  const actual = await vi.importActual<typeof import('../../../../api/dashboard')>(
    '../../../../api/dashboard',
  )
  return {
    ...actual,
    getDashboardTemplates: vi.fn(() => Promise.resolve(templatesResponse)),
    previewTemplateChange,
    changeBusinessTemplate,
  }
})

vi.mock('../../context/DashboardContext', () => ({
  useDashboard: () => ({
    business: {
      id: 1,
      name: 'Test',
      is_pro: true,
      template: { id: 1, name: 'Urban Bold', slug: 'urban-bold', primary_color: '#111' },
    },
    refetch,
  }),
}))

vi.mock('../../../public-page/PublicHtmlTemplateFrame', () => ({
  default: () => <div data-testid="public-frame" />,
}))

vi.mock('../BrandColorSection', () => ({
  default: () => <div data-testid="brand-color-section" />,
}))

vi.mock('../DisenoPagination', () => ({
  default: () => null,
}))

beforeAll(() => {
  class ResizeObserverStub {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  vi.stubGlobal('ResizeObserver', ResizeObserverStub)
  class IntersectionObserverStub {
    observe() {}
    disconnect() {}
    unobserve() {}
  }
  vi.stubGlobal('IntersectionObserver', IntersectionObserverStub as unknown as typeof IntersectionObserver)
})

function renderDiseno() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={qc}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  )
  return render(<Diseno />, { wrapper })
}

describe('Diseno template change flow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    changeBusinessTemplate.mockResolvedValue({ id: 1 })
    previewTemplateChange.mockResolvedValue({
      same_template: false,
      template: templateTrust,
      brand_color: {
        has_current: false,
        current_color: '#d4ff3a',
        current_in_new: false,
        suggested_color: '#1a4f3f',
        new_palette: ['#1a4f3f'],
        new_default: '#1a4f3f',
        new_template_supported: true,
      },
    })
  })

  it('clic en cambiar plantilla llama a previewTemplateChange primero', async () => {
    renderDiseno()
    await waitFor(() => expect(screen.getByText('Trust Clinic')).toBeInTheDocument())
    fireEvent.click(screen.getByText('Trust Clinic'))
    fireEvent.click(screen.getByRole('button', { name: 'Aplicar esta plantilla' }))
    await waitFor(() => expect(previewTemplateChange).toHaveBeenCalledWith(7))
  })

  it('si has_current=false llama a changeBusinessTemplate directamente sin abrir modal', async () => {
    renderDiseno()
    await waitFor(() => expect(screen.getByText('Trust Clinic')).toBeInTheDocument())
    fireEvent.click(screen.getByText('Trust Clinic'))
    fireEvent.click(screen.getByRole('button', { name: 'Aplicar esta plantilla' }))
    await waitFor(() =>
      expect(changeBusinessTemplate).toHaveBeenCalledWith({ template_id: 7 }),
    )
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('si has_current=true abre el modal con la preview cargada', async () => {
    previewTemplateChange.mockResolvedValue({
      same_template: false,
      template: templateTrust,
      brand_color: {
        has_current: true,
        current_color: '#ff80ab',
        current_in_new: false,
        suggested_color: '#7a3e3e',
        new_palette: ['#7a3e3e'],
        new_default: '#1a4f3f',
        new_template_supported: true,
      },
    })
    renderDiseno()
    await waitFor(() => expect(screen.getByText('Trust Clinic')).toBeInTheDocument())
    fireEvent.click(screen.getByText('Trust Clinic'))
    fireEvent.click(screen.getByRole('button', { name: 'Aplicar esta plantilla' }))
    await waitFor(() =>
      expect(screen.getByText(/no está disponible en esta plantilla/i)).toBeInTheDocument(),
    )
    expect(changeBusinessTemplate).not.toHaveBeenCalled()
  })

  it('confirmar el modal llama a changeBusinessTemplate con el brand_color elegido', async () => {
    previewTemplateChange.mockResolvedValue({
      same_template: false,
      template: templateTrust,
      brand_color: {
        has_current: true,
        current_color: '#ff80ab',
        current_in_new: true,
        suggested_color: '#ff80ab',
        new_palette: ['#ff80ab'],
        new_default: '#1a4f3f',
        new_template_supported: true,
      },
    })
    renderDiseno()
    await waitFor(() => expect(screen.getByText('Trust Clinic')).toBeInTheDocument())
    fireEvent.click(screen.getByText('Trust Clinic'))
    fireEvent.click(screen.getByRole('button', { name: 'Aplicar esta plantilla' }))
    await waitFor(() => expect(screen.getByText(/Se mantendrá al cambiar/i)).toBeInTheDocument())
    fireEvent.click(screen.getByRole('button', { name: 'Cambiar plantilla' }))
    await waitFor(() =>
      expect(changeBusinessTemplate).toHaveBeenCalledWith(
        buildTemplateChangePayload(7, 'omit'),
      ),
    )
  })
})

describe('buildTemplateChangePayload', () => {
  it('omite brand_color cuando choice es omit', () => {
    expect(buildTemplateChangePayload(3, 'omit')).toEqual({ template_id: 3 })
  })

  it('incluye brand_color cuando se elige un hex', () => {
    expect(buildTemplateChangePayload(3, '#7a3e3e')).toEqual({
      template_id: 3,
      brand_color: '#7a3e3e',
    })
  })

  it('envía null para limpiar brand_color', () => {
    expect(buildTemplateChangePayload(3, null)).toEqual({
      template_id: 3,
      brand_color: null,
    })
  })
})
