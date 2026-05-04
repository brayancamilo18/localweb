import { render } from '@testing-library/react'
import Icon from '../Icon'

describe('Icon', () => {
  it('renderiza SVG con name check', () => {
    const { container } = render(<Icon name="check" />)
    expect(container.querySelector('svg')).toBeInTheDocument()
  })

  it('renderiza SVG con name home', () => {
    const { container } = render(<Icon name="home" />)
    expect(container.querySelector('svg')).toBeInTheDocument()
  })

  it('aplica el size correcto al SVG', () => {
    const { container } = render(<Icon name="check" size={24} />)
    const svg = container.querySelector('svg')
    expect(svg).toHaveAttribute('width', '24')
    expect(svg).toHaveAttribute('height', '24')
  })
})
