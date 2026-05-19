import { fireEvent, render, screen } from '@testing-library/react'
import { SearchableCombobox } from '../SearchableCombobox'

const OPTIONS = [
  { value: 'lineal', label: 'Ciudad Lineal' },
  { value: 'hortaleza', label: 'Hortaleza' },
]

describe('SearchableCombobox', () => {
  it('muestra la ciudad elegida de inmediato al seleccionar una opción', () => {
    const onChange = vi.fn()
    const { rerender } = render(
      <SearchableCombobox
        label="Ciudad"
        value="lineal"
        options={OPTIONS}
        onChange={onChange}
      />,
    )

    const input = screen.getByRole('combobox')
    expect(input).toHaveValue('Ciudad Lineal')

    fireEvent.focus(input)
    fireEvent.click(screen.getByRole('button', { name: 'Hortaleza' }))

    expect(onChange).toHaveBeenCalledWith('hortaleza')
    expect(input).toHaveValue('Hortaleza')

    rerender(
      <SearchableCombobox
        label="Ciudad"
        value="hortaleza"
        options={OPTIONS}
        onChange={onChange}
      />,
    )
    expect(input).toHaveValue('Hortaleza')
  })
})
