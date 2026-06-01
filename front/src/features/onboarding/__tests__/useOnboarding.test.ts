import { createElement, type ReactNode } from 'react'
import { act, renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { useOnboarding } from '../useOnboarding'
import * as onboardingApi from '../../../api/onboarding'
import { clearSignupPrefill } from '../../../lib/signupPrefill'

const navigateMock = vi.fn()

vi.mock('../../../lib/signupPrefill', () => ({
  clearSignupPrefill: vi.fn(),
}))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return {
    ...actual,
    useNavigate: () => navigateMock,
  }
})

vi.mock('../../../api/onboarding', () => ({
  getStatus: vi.fn(),
  step1: vi.fn(),
  step2: vi.fn(),
  step3: vi.fn(),
  step4: vi.fn(),
  step5: vi.fn(),
  step6: vi.fn(),
  step7: vi.fn(),
  step8: vi.fn(),
}))

const authSlice = { user: { id: 1 } as const, setAuth: vi.fn() }

vi.mock('../../../store/authStore', () => ({
  useAuthStore: Object.assign(
    (selector: (s: typeof authSlice) => unknown) => selector(authSlice),
    { getState: () => authSlice },
  ),
}))

vi.mock('../../../api/auth', () => ({
  me: vi.fn().mockResolvedValue({ user: { id: 1 }, business: null }),
}))

let queryClient: QueryClient

function wrapper({ children }: { children: ReactNode }) {
  return createElement(
    QueryClientProvider,
    { client: queryClient },
    createElement(MemoryRouter, null, children),
  )
}

function makeBillingSuccessWrapper() {
  return function BillingSuccessWrapper({ children }: { children: ReactNode }) {
    return createElement(
      QueryClientProvider,
      { client: queryClient },
      createElement(
        MemoryRouter,
        { initialEntries: ['/onboarding?billing=success&session_id=cs_test'] },
        children,
      ),
    )
  }
}

describe('useOnboarding', () => {
  beforeEach(() => {
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    vi.clearAllMocks()
    navigateMock.mockReset()
    vi.mocked(onboardingApi.getStatus).mockReset()
    vi.mocked(onboardingApi.step1).mockReset()
  })

  it('getStatus devuelve { is_complete: false, step: 1 } → currentStep es 1', async () => {
    vi.mocked(onboardingApi.getStatus).mockResolvedValue({ is_complete: false, step: 1 })
    const { result } = renderHook(() => useOnboarding(), { wrapper })
    await waitFor(() => expect(result.current.isPendingStatus).toBe(false))
    expect(result.current.currentStep).toBe(1)
  })

  it('getStatus devuelve { is_complete: true } → navigate("/dashboard") es llamado', async () => {
    vi.mocked(onboardingApi.getStatus).mockResolvedValue({ is_complete: true, step: 8 })
    renderHook(() => useOnboarding(), { wrapper })
    await waitFor(() => expect(navigateMock).toHaveBeenCalledWith('/dashboard', { replace: true }))
  })

  it('goNext en step 1 llama onboarding.step1 con los datos correctos', async () => {
    vi.mocked(onboardingApi.getStatus).mockResolvedValue({ is_complete: false, step: 1 })
    vi.mocked(onboardingApi.step1).mockResolvedValue({ ok: true, next_step: 2 })
    const { result } = renderHook(() => useOnboarding(), { wrapper })
    await waitFor(() => expect(result.current.isPendingStatus).toBe(false))

    await act(async () => {
      await result.current.goNext({ template_id: 1, sector: 'peluqueria' })
    })

    expect(onboardingApi.step1).toHaveBeenCalledWith(
      expect.objectContaining({ template_id: 1, sector: 'peluqueria' }),
    )
    expect(clearSignupPrefill).toHaveBeenCalled()
    expect(result.current.currentStep).toBe(2)
  })

  it('goNext con error de API → expone errors, no avanza', async () => {
    vi.mocked(onboardingApi.getStatus).mockResolvedValue({ is_complete: false, step: 1 })
    vi.mocked(onboardingApi.step1).mockRejectedValue({ response: { data: { message: 'Template inválido' } } })
    const { result } = renderHook(() => useOnboarding(), { wrapper })
    await waitFor(() => expect(result.current.isPendingStatus).toBe(false))

    await act(async () => {
      await result.current.goNext({ template_id: 999, sector: 'otros' })
    })

    expect(result.current.currentStep).toBe(1)
    expect(result.current.errors.message).toBe('Template inválido')
  })

  it('billing=success en URL → aterriza en step 8 (publicar)', async () => {
    vi.mocked(onboardingApi.getStatus).mockResolvedValue({
      is_complete: false,
      step: 8,
      draft: {
        template_id: 1,
        cover_path: 'x',
        business_name: 'Test',
        gallery_paths: ['g1'],
        schedule: {},
        address: 'a',
        phone: 'p',
      },
    })

    const { result } = renderHook(() => useOnboarding(), {
      wrapper: makeBillingSuccessWrapper(),
    })

    await waitFor(() => expect(result.current.isPendingStatus).toBe(false))
    await waitFor(() => expect(result.current.currentStep).toBe(8))
    expect(result.current.postCheckoutProGallery).toBe(false)
  })

  it('goPrev desde step 3 → currentStep es 2, no llama ningún endpoint', async () => {
    vi.mocked(onboardingApi.getStatus).mockResolvedValue({
      is_complete: false,
      step: 3,
      draft: { template_id: 1, cover_path: 'x', sector: 'peluqueria' },
    })
    const step1Spy = vi.mocked(onboardingApi.step1)
    const { result } = renderHook(() => useOnboarding(), { wrapper })
    await waitFor(() => expect(result.current.isPendingStatus).toBe(false))

    act(() => {
      result.current.goPrev()
    })

    expect(result.current.currentStep).toBe(2)
    expect(step1Spy).not.toHaveBeenCalled()
  })

  it('goNext en step 4 con dirty=false llama step4 vacío sin replace (camino rápido)', async () => {
    vi.mocked(onboardingApi.getStatus).mockResolvedValue({
      is_complete: false,
      step: 4,
      // Sin gallery_paths en draft: resolveOnboardingUiStep debe quedar en 4 (con paths salta a 5).
      draft: { template_id: 1, cover_path: 'x', business_name: 'N' },
    })
    vi.mocked(onboardingApi.step4).mockResolvedValue({ ok: true, next_step: 5 })
    const { result } = renderHook(() => useOnboarding(), { wrapper })
    await waitFor(() => expect(result.current.isPendingStatus).toBe(false))
    await waitFor(() => expect(result.current.currentStep).toBe(4))

    const fakeFile = new File([new Uint8Array([1])], 'g.jpg', { type: 'image/jpeg' })

    await act(async () => {
      await result.current.goNext({ photos: [fakeFile], dirty: false })
    })

    expect(onboardingApi.step4).toHaveBeenCalledWith([], { replace: false })
    expect(result.current.currentStep).toBe(5)
  })

  it('goNext en step 4 con dirty=true llama step4 con todas las fotos y replace=true', async () => {
    vi.mocked(onboardingApi.getStatus).mockResolvedValue({
      is_complete: false,
      step: 4,
      draft: { template_id: 1, cover_path: 'x', business_name: 'N' },
    })
    vi.mocked(onboardingApi.step4).mockResolvedValue({ ok: true, next_step: 5 })
    const { result } = renderHook(() => useOnboarding(), { wrapper })
    await waitFor(() => expect(result.current.isPendingStatus).toBe(false))
    await waitFor(() => expect(result.current.currentStep).toBe(4))

    const fakeFile = new File([new Uint8Array([1])], 'g.jpg', { type: 'image/jpeg' })

    await act(async () => {
      await result.current.goNext({ photos: [fakeFile], dirty: true })
    })

    expect(onboardingApi.step4).toHaveBeenCalledWith([fakeFile], { replace: true })
    expect(result.current.currentStep).toBe(5)
  })
})
