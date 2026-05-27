import { fireEvent, render, screen } from '@testing-library/react'
import { getColorDisplayName } from '../../../lib/hexColorName'
import BrandColorPicker from '../BrandColorPicker'

const palette = ['#d4ff3a', '#ff5a3a', '#3affe5', '#ffd23a', '#ff80ab', '#ff6b00']

describe('BrandColorPicker', () => {
  it('renderiza 6 swatches cuando recibe una paleta de 6 colores', () => {
    render(
      <BrandColorPicker
        palette={palette}
        value={null}
        defaultColor="#d4ff3a"
        effective="#d4ff3a"
        onChange={() => {}}
      />,
    )

    expect(screen.getByRole('group', { name: 'Elige el color de marca' }).querySelectorAll('button')).toHaveLength(6)
  })

  it('marca como seleccionado el swatch correspondiente a value', () => {
    render(
      <BrandColorPicker
        palette={palette}
        value="#ff5a3a"
        defaultColor="#d4ff3a"
        effective="#ff5a3a"
        onChange={() => {}}
      />,
    )

    expect(
      screen.getByRole('button', { name: `Color marca: ${getColorDisplayName('#ff5a3a')}` }),
    ).toHaveAttribute('aria-pressed', 'true')
  })

  it('marca el default cuando value es null', () => {
    render(
      <BrandColorPicker
        palette={palette}
        value={null}
        defaultColor="#d4ff3a"
        effective="#d4ff3a"
        onChange={() => {}}
      />,
    )

    expect(screen.getByRole('button', { name: /predeterminado de la plantilla/i })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })

  it('llama a onChange(color) cuando se clica un swatch no seleccionado', () => {
    const onChange = vi.fn()
    render(
      <BrandColorPicker
        palette={palette}
        value={null}
        defaultColor="#d4ff3a"
        effective="#d4ff3a"
        onChange={onChange}
      />,
    )

    fireEvent.click(
      screen.getByRole('button', { name: `Color marca: ${getColorDisplayName('#ff5a3a')}` }),
    )
    expect(onChange).toHaveBeenCalledWith('#ff5a3a')
  })

  it('llama a onChange(null) al pulsar Restablecer', () => {
    const onChange = vi.fn()
    render(
      <BrandColorPicker
        palette={palette}
        value="#ff5a3a"
        defaultColor="#d4ff3a"
        effective="#ff5a3a"
        onChange={onChange}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Restablecer' }))
    expect(onChange).toHaveBeenCalledWith(null)
  })

  it('deshabilita Restablecer si value === null', () => {
    render(
      <BrandColorPicker
        palette={palette}
        value={null}
        defaultColor="#d4ff3a"
        effective="#d4ff3a"
        onChange={() => {}}
      />,
    )

    expect(screen.getByRole('button', { name: 'Restablecer' })).toBeDisabled()
  })

  it('muestra aviso de contraste sin bloquear la selección', () => {
    const monoMeta = { usage: 'text' as const, bg: '#ffffff', ink: '#0a0a0a' }
    render(
      <BrandColorPicker
        palette={palette}
        templateMeta={monoMeta}
        value="#ffff00"
        defaultColor="#c2410c"
        effective="#ffff00"
        onChange={() => {}}
      />,
    )

    expect(screen.getByText(/Puede que este color no se vea bien/i)).toBeInTheDocument()
  })

  it('deshabilita los swatches cuando disabled=true', () => {
    render(
      <BrandColorPicker
        palette={palette}
        value={null}
        defaultColor="#d4ff3a"
        effective="#d4ff3a"
        disabled
        onChange={() => {}}
      />,
    )

    const swatches = screen.getByRole('group', { name: 'Elige el color de marca' }).querySelectorAll('button')
    swatches.forEach((btn) => expect(btn).toBeDisabled())
  })
})
