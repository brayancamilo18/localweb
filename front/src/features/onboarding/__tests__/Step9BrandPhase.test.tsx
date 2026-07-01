import { fireEvent, render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Step9ProSetup from '../steps/Step9ProSetup'
import type { ReactNode } from 'react'

const showToast = vi.fn()
const mutate = vi.fn()

vi.mock('../../shared/useBrandColor', () => ({
  useBrandColor: vi.fn(() => ({
    data: {
      palette: ['#d4ff3a', '#ff5a3a', '#3affe5', '#ffd23a', '#ff80ab', '#ff6b00'],
      current: null,
      effective: '#d4ff3a',
      default: '#d4ff3a',
      template_slug: 'urban-bold',
      template_meta: { usage: 'bg' as const, bg: '#f4f1ea', ink: '#0a0a0a' },
      contrast_warning: null,
      is_pro: true,
      is_supported: true,
    },
    isLoading: false,
    error: null,
    mutate,
    isPending: false,
  })),
}))

vi.mock('../../../components/ui/Toast', () => ({
  useToast: () => ({ showToast }),
}))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  }
})

vi.mock('../../shared/ProServicesEditor', () => ({
  default: () => <div data-testid="pro-services-editor" />,
}))

vi.mock('../../shared/ProEventsEditor', () => ({
  default: () => <div data-testid="pro-events-editor" />,
}))

vi.mock('../../shared/ProIntegrationsForm', () => ({
  default: () => <div data-testid="pro-integrations-form" />,
}))

vi.mock('../../shared/FaviconUploader', () => ({
  default: () => <div data-testid="favicon-uploader" />,
}))

function renderStep9(phase: 'services' | 'brand' | 'extras', onPhaseChange = vi.fn()) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  )

  return {
    onPhaseChange,
    ...render(
      <Step9ProSetup
        errors={{}}
        isLoading={false}
        setupPhase={phase}
        onSetupPhaseChange={onPhaseChange}
        offersServices
        onOffersServicesChange={vi.fn()}
        eventsEnabled={false}
        onEventsEnabledChange={vi.fn()}
        brandColorDefault="#d4ff3a"
        onBrandColorLiveChange={vi.fn()}
      />,
      { wrapper },
    ),
  }
}

describe('Step9 brand phase', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('inicia en fase services tras montar', () => {
    renderStep9('services')
    expect(screen.getByRole('heading', { name: 'Servicios en tu web' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Continuar a marca' })).toBeInTheDocument()
  })

  it('tras pulsar Continuar a marca se muestra la fase brand', () => {
    const { onPhaseChange } = renderStep9('services')
    fireEvent.click(screen.getByRole('button', { name: 'Continuar a marca' }))
    expect(onPhaseChange).toHaveBeenCalledWith('brand')
  })

  it('tras pulsar Continuar a enlaces desde brand se muestra extras', () => {
    const { onPhaseChange } = renderStep9('brand')
    fireEvent.click(screen.getByRole('button', { name: 'Continuar a enlaces' }))
    expect(onPhaseChange).toHaveBeenCalledWith('extras')
  })

  it('tras pulsar Volver a marca desde extras vuelve a brand', () => {
    const { onPhaseChange } = renderStep9('extras')
    fireEvent.click(screen.getByRole('button', { name: 'Volver a marca' }))
    expect(onPhaseChange).toHaveBeenCalledWith('brand')
  })

  it('si is_supported=false, fase brand muestra mensaje y solo botón continuar', async () => {
    const { useBrandColor } = await import('../../shared/useBrandColor')
    vi.mocked(useBrandColor).mockReturnValue({
      data: {
        palette: ['#d4ff3a'],
        current: null,
        effective: '#d4ff3a',
        default: '#d4ff3a',
        template_slug: 'wild-pet',
        template_meta: null,
        contrast_warning: null,
        is_pro: true,
        is_supported: false,
      },
      isLoading: false,
      error: null,
      mutate,
      mutateAsync: vi.fn(),
      isPending: false,
    })

    renderStep9('brand')
    expect(
      screen.getByText(/no permite cambiar el color de marca/i),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Continuar a enlaces' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Volver a servicios' })).not.toBeInTheDocument()
  })
})
