import { render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import LazyTemplateIframe from '../LazyTemplateIframe'

describe('LazyTemplateIframe', () => {
  let observerCallback: IntersectionObserverCallback | null = null

  beforeEach(() => {
    observerCallback = null
    vi.stubGlobal(
      'IntersectionObserver',
      vi.fn((cb: IntersectionObserverCallback) => {
        observerCallback = cb
        return {
          observe: vi.fn(),
          disconnect: vi.fn(),
          unobserve: vi.fn(),
          takeRecords: vi.fn(),
          root: null,
          rootMargin: '',
          thresholds: [],
        }
      }),
    )
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('muestra el placeholder hasta que el elemento entra en el viewport', () => {
    const onFirstVisible = vi.fn()
    render(
      <LazyTemplateIframe placeholder={<span>placeholder</span>} onFirstVisible={onFirstVisible}>
        <span>iframe cargado</span>
      </LazyTemplateIframe>,
    )

    expect(screen.getByText('placeholder')).toBeInTheDocument()
    expect(screen.queryByText('iframe cargado')).not.toBeInTheDocument()
    expect(onFirstVisible).not.toHaveBeenCalled()
  })

  it('monta los hijos y notifica solo una vez al intersectar', () => {
    const onFirstVisible = vi.fn()
    render(
      <LazyTemplateIframe placeholder={<span>placeholder</span>} onFirstVisible={onFirstVisible}>
        <span>iframe cargado</span>
      </LazyTemplateIframe>,
    )

    observerCallback?.([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver)

    expect(screen.getByText('iframe cargado')).toBeInTheDocument()
    expect(screen.queryByText('placeholder')).not.toBeInTheDocument()
    expect(onFirstVisible).toHaveBeenCalledTimes(1)

    observerCallback?.([{ isIntersecting: false } as IntersectionObserverEntry], {} as IntersectionObserver)
    expect(screen.getByText('iframe cargado')).toBeInTheDocument()
  })

  it('monta los hijos tras el fallback de seguridad si el observer no dispara', () => {
    vi.useFakeTimers()
    const onFirstVisible = vi.fn()

    render(
      <LazyTemplateIframe
        placeholder={<span>placeholder</span>}
        onFirstVisible={onFirstVisible}
        visibilityFallbackMs={1500}
      >
        <span>iframe cargado</span>
      </LazyTemplateIframe>,
    )

    expect(screen.getByText('placeholder')).toBeInTheDocument()

    vi.advanceTimersByTime(1500)

    expect(screen.getByText('iframe cargado')).toBeInTheDocument()
    expect(onFirstVisible).toHaveBeenCalledTimes(1)

    vi.useRealTimers()
  })
})
