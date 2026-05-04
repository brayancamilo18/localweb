import { fireEvent, render, screen } from '@testing-library/react'
import Btn from '../Btn'

describe('Btn', () => {
  it('renderiza con texto', () => {
    render(<Btn>Guardar</Btn>)
    expect(screen.getByRole('button', { name: 'Guardar' })).toBeInTheDocument()
  })

  it('aplica estilos de kind primary por defecto', () => {
    render(<Btn>Primary</Btn>)
    const btn = screen.getByRole('button', { name: 'Primary' })
    expect(btn).toHaveStyle({ background: 'var(--lw-accent)', color: 'rgb(255, 255, 255)' })
  })

  it('llama onClick cuando se hace clic', () => {
    const onClick = vi.fn()
    render(<Btn onClick={onClick}>Click</Btn>)
    fireEvent.click(screen.getByRole('button', { name: 'Click' }))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('cuando disabled true no llama onClick', () => {
    const onClick = vi.fn()
    render(
      <Btn disabled onClick={onClick}>
        Disabled
      </Btn>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Disabled' }))
    expect(onClick).not.toHaveBeenCalled()
  })

  it('cuando loading true muestra spinner y esta deshabilitado', () => {
    render(<Btn loading>Cargando</Btn>)
    const btn = screen.getByRole('button', { name: 'Cargando' })
    expect(btn).toBeDisabled()
    const spinner = btn.querySelector('svg')
    expect(spinner).toBeInTheDocument()
    expect(spinner).toHaveStyle({ animation: 'spin 1s linear infinite' })
  })

  it('kind danger aplica color danger', () => {
    render(<Btn kind="danger">Eliminar</Btn>)
    expect(screen.getByRole('button', { name: 'Eliminar' })).toHaveStyle({ color: 'var(--lw-danger)' })
  })

  it("kind='success' aplica background var(--lw-success)", () => {
    render(<Btn kind="success">Listo</Btn>)
    expect(screen.getByRole('button', { name: 'Listo' })).toHaveStyle({ background: 'var(--lw-success)' })
  })

  it("kind='dark' aplica background var(--lw-text)", () => {
    render(<Btn kind="dark">Oscuro</Btn>)
    expect(screen.getByRole('button', { name: 'Oscuro' })).toHaveStyle({ background: 'var(--lw-text)' })
  })
})
