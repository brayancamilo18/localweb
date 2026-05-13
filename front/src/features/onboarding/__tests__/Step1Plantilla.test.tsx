import { fireEvent, render, screen } from '@testing-library/react'
import Step1Plantilla from '../steps/Step1Plantilla'

const templates = [
  { id: 1, name: 'Clásica', slug: 'classic', primary_color: '#111111', requires_pro: false, hero_photo_slots: 1 },
  { id: 2, name: 'Premium', slug: 'premium', primary_color: '#ff00aa', requires_pro: true, hero_photo_slots: 1 },
]

describe('Step1Plantilla', () => {
  it('renderiza las plantillas', () => {
    render(<Step1Plantilla templates={templates} value={{}} onChange={vi.fn()} />)
    expect(screen.getByText('Clásica')).toBeInTheDocument()
    expect(screen.getByText('Premium')).toBeInTheDocument()
  })

  it('seleccionar plantilla la marca como activa', () => {
    const onChange = vi.fn()
    render(<Step1Plantilla templates={templates} value={{}} onChange={onChange} />)
    fireEvent.click(screen.getByText('Clásica'))
    expect(onChange).toHaveBeenCalledWith({ template_id: 1 })
  })

  it('plantilla PRO muestra badge PRO', () => {
    render(<Step1Plantilla templates={templates} value={{}} onChange={vi.fn()} />)
    expect(screen.getByText('PRO')).toBeInTheDocument()
  })

  it('botón Continuar sin selección muestra error', () => {
    render(<Step1Plantilla templates={templates} value={{}} onChange={vi.fn()} onContinue={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }))
    expect(screen.getByText('Debes elegir una plantilla')).toBeInTheDocument()
  })
})
