import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import TemplateCardPreview from '../TemplateCardPreview'
import type { Step1PreviewVariant } from '../../wizard'

const requestLoad = vi.fn()

vi.mock('../TemplateIframePool', () => ({
  useTemplateIframePool: () => ({
    requestLoad,
    isLoaded: () => false,
    attach: vi.fn(),
  }),
  PooledTemplateThumbHost: () => null,
}))

const variant = 'noir-elite' as Step1PreviewVariant

const baseTemplate = {
  name: 'Noir Elite',
  primary_color: '#C9A84C',
  thumbnail_url: null as string | null,
}

describe('TemplateCardPreview', () => {
  beforeEach(() => {
    requestLoad.mockClear()
    vi.stubGlobal(
      'IntersectionObserver',
      vi.fn(() => ({
        observe: vi.fn(),
        disconnect: vi.fn(),
        unobserve: vi.fn(),
        takeRecords: vi.fn(),
        root: null,
        rootMargin: '',
        thresholds: [],
      })),
    )
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('con thumbnail_url null usa el flujo lazy (placeholder + host)', () => {
    render(<TemplateCardPreview variant={variant} template={baseTemplate} />)

    expect(screen.getByText('Noir Elite')).toBeInTheDocument()
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
    expect(document.querySelector('.lw-lazy-template-iframe')).toBeTruthy()
  })

  it('con thumbnail_url válida renderiza img', () => {
    render(
      <TemplateCardPreview
        variant={variant}
        template={{ ...baseTemplate, thumbnail_url: 'https://cdn.example.com/thumb.webp' }}
      />,
    )

    const img = screen.getByRole('img', { hidden: true })
    expect(img).toHaveAttribute('src', 'https://cdn.example.com/thumb.webp')
  })

  it('si la imagen dispara onError muestra TemplateThumbPlaceholder', () => {
    render(
      <TemplateCardPreview
        variant={variant}
        template={{ ...baseTemplate, thumbnail_url: 'https://cdn.example.com/missing.webp' }}
      />,
    )

    const img = screen.getByRole('img', { hidden: true })
    fireEvent.error(img)

    expect(screen.getByText('Noir Elite')).toBeInTheDocument()
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
    expect(document.querySelector('.lw-template-thumb-placeholder')).toBeTruthy()
  })

  it('con thumbnail_url malformada usa el flujo lazy sin img', () => {
    render(
      <TemplateCardPreview
        variant={variant}
        template={{ ...baseTemplate, thumbnail_url: 'javascript:alert(1)' }}
      />,
    )

    expect(screen.getByText('Noir Elite')).toBeInTheDocument()
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
    expect(document.querySelector('.lw-lazy-template-iframe')).toBeTruthy()
  })

  it('con thumbnail_url vacía tras trim usa el flujo lazy', () => {
    render(
      <TemplateCardPreview variant={variant} template={{ ...baseTemplate, thumbnail_url: '   ' }} />,
    )

    expect(screen.queryByRole('img')).not.toBeInTheDocument()
    expect(document.querySelector('.lw-lazy-template-iframe')).toBeTruthy()
  })
})
