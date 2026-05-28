import { fireEvent, render, screen } from '@testing-library/react'
import type { ComponentProps } from 'react'
import type { TemplateChangePreview } from '../../../../api/dashboard'
import { getColorDisplayName } from '../../../../lib/hexColorName'
import TemplateChangeConfirmModal from '../TemplateChangeConfirmModal'

const trustPalette = ['#1a4f3f', '#1e4b7c', '#5c4a8c', '#7a3e3e', '#3d5a40', '#704214']

const previewStateC: TemplateChangePreview = {
  same_template: false,
  template: { id: 7, name: 'Trust Clinic', slug: 'trust-clinic' },
  brand_color: {
    has_current: true,
    current_color: '#ff80ab',
    current_in_new: false,
    suggested_color: '#7a3e3e',
    new_palette: trustPalette,
    new_default: '#1a4f3f',
    new_template_supported: true,
  },
}

const previewStateB: TemplateChangePreview = {
  ...previewStateC,
  brand_color: {
    ...previewStateC.brand_color!,
    current_in_new: true,
  },
}

const previewStateD: TemplateChangePreview = {
  ...previewStateC,
  template: { id: 12, name: 'Wild Pet', slug: 'wild-pet' },
  brand_color: {
    ...previewStateC.brand_color!,
    new_template_supported: false,
  },
}

function renderModal(
  props: Partial<ComponentProps<typeof TemplateChangeConfirmModal>> = {},
) {
  const onClose = vi.fn()
  const onConfirm = vi.fn()
  render(
    <TemplateChangeConfirmModal
      open
      onClose={onClose}
      preview={previewStateC}
      onConfirm={onConfirm}
      {...props}
    />,
  )
  return { onClose, onConfirm }
}

describe('TemplateChangeConfirmModal', () => {
  it('renderiza estado de loading cuando preview es null', () => {
    renderModal({ preview: null })
    expect(screen.getByText(/Calculando opciones de color/i)).toBeInTheDocument()
  })

  it('estado B: muestra mensaje "se mantendrá tu color" cuando current_in_new=true', () => {
    renderModal({ preview: previewStateB })
    expect(screen.getByText(/Se mantendrá al cambiar/i)).toBeInTheDocument()
    expect(screen.getByText(new RegExp(getColorDisplayName('#ff80ab'), 'i'))).toBeInTheDocument()
  })

  it('estado C: muestra dos columnas color actual + sugerido cuando current_in_new=false', () => {
    renderModal({ preview: previewStateC })
    expect(screen.getByText('Color actual')).toBeInTheDocument()
    expect(screen.getByText('Sugerido')).toBeInTheDocument()
    expect(screen.getAllByText(getColorDisplayName('#ff80ab')).length).toBeGreaterThan(0)
    expect(screen.getAllByText(getColorDisplayName('#7a3e3e')).length).toBeGreaterThan(0)
  })

  it('estado D: muestra mensaje de plantilla no soportada cuando new_template_supported=false', () => {
    renderModal({ preview: previewStateD })
    expect(screen.getByText(/no admite cambio de color de marca/i)).toBeInTheDocument()
  })

  it('estado C con opción sugerido seleccionada por defecto', () => {
    renderModal({ preview: previewStateC })
    const suggested = screen.getByRole('radio', { name: /Usar el color sugerido/i }) as HTMLInputElement
    expect(suggested.checked).toBe(true)
  })

  it('confirma con suggested_color cuando se elige esa opción', () => {
    const { onConfirm } = renderModal({ preview: previewStateC })
    fireEvent.click(screen.getByRole('button', { name: 'Cambiar plantilla' }))
    expect(onConfirm).toHaveBeenCalledWith('#7a3e3e')
  })

  it('confirma con null cuando se elige "color por defecto"', () => {
    const { onConfirm } = renderModal({ preview: previewStateC })
    fireEvent.click(screen.getByRole('radio', { name: /Usar el color por defecto/i }))
    fireEvent.click(screen.getByRole('button', { name: 'Cambiar plantilla' }))
    expect(onConfirm).toHaveBeenCalledWith(null)
  })

  it('confirma con color custom de paleta cuando se elige uno del picker', () => {
    const { onConfirm } = renderModal({ preview: previewStateC })
    fireEvent.click(screen.getByRole('radio', { name: /Elegir otro color de la nueva paleta/i }))
    fireEvent.click(screen.getByRole('button', { name: new RegExp(`Color marca: ${getColorDisplayName('#1e4b7c')}`, 'i') }))
    fireEvent.click(screen.getByRole('button', { name: 'Cambiar plantilla' }))
    expect(onConfirm).toHaveBeenCalledWith('#1e4b7c')
  })

  it("confirma con 'omit' en estado D", () => {
    const { onConfirm } = renderModal({ preview: previewStateD })
    fireEvent.click(screen.getByRole('button', { name: 'Cambiar plantilla' }))
    expect(onConfirm).toHaveBeenCalledWith('omit')
  })

  it('clic en cancelar llama a onClose sin disparar onConfirm', () => {
    const { onClose, onConfirm } = renderModal({ preview: previewStateC })
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(onClose).toHaveBeenCalled()
    expect(onConfirm).not.toHaveBeenCalled()
  })
})

describe('cover trim notice', () => {
  it('renders cover trim notice when preview.covers.will_trim is true', () => {
    renderModal({
      preview: {
        ...previewStateC,
        covers: {
          current_count: 3,
          new_slots: 1,
          excess: 2,
          will_trim: true,
        },
      },
    })

    const alert = screen.getByRole('alert')
    expect(alert).toHaveTextContent(/solo admite 1 foto en la portada/i)
    expect(alert).toHaveTextContent(/eliminarán las últimas 2/i)
  })

  it('does NOT render cover trim notice when will_trim is false', () => {
    renderModal({
      preview: {
        ...previewStateC,
        covers: {
          current_count: 1,
          new_slots: 3,
          excess: 0,
          will_trim: false,
        },
      },
    })

    expect(screen.queryByRole('alert')).toBeNull()
  })
})
