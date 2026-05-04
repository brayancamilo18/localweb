import { render, screen } from '@testing-library/react'
import Badge from '../Badge'

describe('Badge', () => {
  it('renderiza con tone success', () => {
    render(<Badge tone="success">Activo</Badge>)
    expect(screen.getByText('Activo')).toBeInTheDocument()
  })

  it('muestra dot cuando dot true', () => {
    const { container } = render(<Badge dot>Dot</Badge>)
    const dots = container.querySelectorAll('span span')
    expect(dots.length).toBeGreaterThan(0)
  })

  it('tone pro usa texto claro sobre fondo pro', () => {
    render(<Badge tone="pro">PRO</Badge>)
    expect(screen.getByText('PRO')).toHaveStyle({ color: '#FFFBF5', background: 'var(--lw-pro)' })
  })
})
