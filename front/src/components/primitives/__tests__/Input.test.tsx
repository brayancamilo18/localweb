import { fireEvent, render, screen } from '@testing-library/react'
import Input from '../Input'

describe('Input', () => {
  it('renderiza con label', () => {
    render(<Input label="Correo" id="correo" />)
    expect(screen.getByLabelText('Correo')).toBeInTheDocument()
  })

  it('muestra error bajo el campo cuando error prop existe', () => {
    render(<Input label="Correo" id="correo2" error="Campo requerido" />)
    expect(screen.getByText('Campo requerido')).toBeInTheDocument()
  })

  it('onChange funciona correctamente', () => {
    const onChange = vi.fn()
    render(<Input label="Nombre" id="nombre" onChange={onChange} />)
    fireEvent.change(screen.getByLabelText('Nombre'), { target: { value: 'Brayan' } })
    expect(onChange).toHaveBeenCalledTimes(1)
  })
})
