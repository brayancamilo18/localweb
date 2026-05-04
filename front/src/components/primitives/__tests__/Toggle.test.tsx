import { fireEvent, render, screen } from '@testing-library/react'
import Toggle from '../Toggle'

describe('Toggle', () => {
  it('renderiza en estado checked false', () => {
    render(<Toggle checked={false} onChange={() => {}} label="Recibir alertas" />)
    expect(screen.getByRole('button', { name: /Recibir alertas/i })).toBeInTheDocument()
  })

  it('llama onChange con true al hacer clic', () => {
    const onChange = vi.fn()
    render(<Toggle checked={false} onChange={onChange} label="Toggle" />)
    fireEvent.click(screen.getByRole('button', { name: /Toggle/i }))
    expect(onChange).toHaveBeenCalledWith(true)
  })
})
