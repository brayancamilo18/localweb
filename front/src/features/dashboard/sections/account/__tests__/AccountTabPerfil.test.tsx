import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import AccountTabPerfil from '../AccountTabPerfil'
import { ToastProvider } from '../../../../../components/ui/Toast'
import * as accountApi from '../../../../../api/account'
import { useAuthStore } from '../../../../../store/authStore'

function renderTab() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false, gcTime: 0 },
    },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <MemoryRouter>
          <AccountTabPerfil />
        </MemoryRouter>
      </ToastProvider>
    </QueryClientProvider>,
  )
}

const profileFixture = {
  user: {
    id: 1,
    name: 'Ana Pérez',
    email: 'ana@example.com',
    email_verified_at: '2026-01-01T00:00:00Z',
  },
  business_name: 'Cafetería Luna',
}

describe('AccountTabPerfil', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    useAuthStore.getState().clearAuth()
  })

  it('muestra "Cargando datos…" mientras profileQ está pendiente', () => {
    vi.spyOn(accountApi, 'getAccountProfile').mockImplementation(
      () => new Promise(() => {}),
    )
    renderTab()
    expect(screen.getByText(/Cargando datos…/i)).toBeInTheDocument()
  })

  it('muestra el nombre y el email del usuario tras cargar', async () => {
    vi.spyOn(accountApi, 'getAccountProfile').mockResolvedValue(profileFixture as never)
    renderTab()
    expect(await screen.findByDisplayValue('Ana Pérez')).toBeInTheDocument()
    expect(screen.getByDisplayValue('ana@example.com')).toBeInTheDocument()
  })

  it('muestra el badge "Verificado" cuando el email está verificado', async () => {
    vi.spyOn(accountApi, 'getAccountProfile').mockResolvedValue(profileFixture as never)
    renderTab()
    expect(await screen.findByText('Verificado')).toBeInTheDocument()
  })

  it('muestra el badge "Sin verificar" cuando el email no está verificado', async () => {
    vi.spyOn(accountApi, 'getAccountProfile').mockResolvedValue({
      ...profileFixture,
      user: { ...profileFixture.user, email_verified_at: null },
    } as never)
    renderTab()
    expect(await screen.findByText('Sin verificar')).toBeInTheDocument()
  })

  it('mantiene el botón Guardar deshabilitado cuando no hay cambios', async () => {
    vi.spyOn(accountApi, 'getAccountProfile').mockResolvedValue(profileFixture as never)
    renderTab()
    await screen.findByDisplayValue('Ana Pérez')
    expect(screen.getByRole('button', { name: 'Guardar cambios' })).toBeDisabled()
  })

  it('habilita Guardar al modificar el nombre y muestra Descartar', async () => {
    vi.spyOn(accountApi, 'getAccountProfile').mockResolvedValue(profileFixture as never)
    renderTab()
    const nameInput = await screen.findByDisplayValue('Ana Pérez')
    fireEvent.change(nameInput, { target: { value: 'Ana López' } })
    expect(screen.getByRole('button', { name: 'Guardar cambios' })).not.toBeDisabled()
    expect(screen.getByRole('button', { name: 'Descartar' })).toBeInTheDocument()
  })

  it('al pulsar Descartar restaura los valores originales', async () => {
    vi.spyOn(accountApi, 'getAccountProfile').mockResolvedValue(profileFixture as never)
    renderTab()
    const nameInput = await screen.findByDisplayValue('Ana Pérez')
    fireEvent.change(nameInput, { target: { value: 'Ana López' } })
    fireEvent.click(screen.getByRole('button', { name: 'Descartar' }))
    expect(screen.getByDisplayValue('Ana Pérez')).toBeInTheDocument()
  })

  it('muestra hint de re-verificación cuando el email cambia', async () => {
    vi.spyOn(accountApi, 'getAccountProfile').mockResolvedValue(profileFixture as never)
    renderTab()
    const emailInput = await screen.findByDisplayValue('ana@example.com')
    fireEvent.change(emailInput, { target: { value: 'nuevo@example.com' } })
    expect(
      screen.getByText(/Tendrás que verificar la nueva dirección/i),
    ).toBeInTheDocument()
  })

  it('llama al API solo con los campos modificados', async () => {
    vi.spyOn(accountApi, 'getAccountProfile').mockResolvedValue(profileFixture as never)
    const updateSpy = vi.spyOn(accountApi, 'updateAccountProfile').mockResolvedValue({
      ...profileFixture,
      user: { ...profileFixture.user, name: 'Ana López' },
      email_changed: false,
    } as never)
    renderTab()
    const nameInput = await screen.findByDisplayValue('Ana Pérez')
    fireEvent.change(nameInput, { target: { value: 'Ana López' } })
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }))
    await waitFor(() => expect(updateSpy).toHaveBeenCalledWith({ name: 'Ana López' }))
  })

  it('muestra campo de contraseña al cambiar el email y mantiene Guardar deshabilitado sin ella', async () => {
    vi.spyOn(accountApi, 'getAccountProfile').mockResolvedValue(profileFixture as never)
    renderTab()
    const emailInput = await screen.findByDisplayValue('ana@example.com')
    fireEvent.change(emailInput, { target: { value: 'nuevo@example.com' } })
    expect(screen.getByText(/Necesaria para confirmar el cambio de email/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Guardar cambios' })).toBeDisabled()
  })

  it('muestra error de validación 422 en el campo email', async () => {
    vi.spyOn(accountApi, 'getAccountProfile').mockResolvedValue(profileFixture as never)
    vi.spyOn(accountApi, 'updateAccountProfile').mockRejectedValue({
      isAxiosError: true,
      response: {
        status: 422,
        data: { message: 'Datos inválidos', errors: { email: ['Ese email ya está en uso'] } },
      },
    } as never)
    renderTab()
    const emailInput = await screen.findByDisplayValue('ana@example.com')
    fireEvent.change(emailInput, { target: { value: 'tomado@example.com' } })
    fireEvent.change(screen.getByPlaceholderText('Tu contraseña'), { target: { value: 'miPassword1' } })
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }))
    expect(await screen.findByText('Ese email ya está en uso')).toBeInTheDocument()
  })

  it('mantiene Cambiar contraseña deshabilitado por defecto', async () => {
    vi.spyOn(accountApi, 'getAccountProfile').mockResolvedValue(profileFixture as never)
    renderTab()
    await screen.findByDisplayValue('Ana Pérez')
    expect(screen.getByRole('button', { name: 'Cambiar contraseña' })).toBeDisabled()
  })

  it('habilita Cambiar contraseña cuando los 3 campos son válidos', async () => {
    vi.spyOn(accountApi, 'getAccountProfile').mockResolvedValue(profileFixture as never)
    renderTab()
    await screen.findByDisplayValue('Ana Pérez')
    fireEvent.change(screen.getByLabelText('Contraseña actual'), {
      target: { value: 'viejaPassword1' },
    })
    fireEvent.change(screen.getByLabelText('Nueva contraseña'), {
      target: { value: 'nuevaPassword2' },
    })
    fireEvent.change(screen.getByLabelText('Confirmar nueva contraseña'), {
      target: { value: 'nuevaPassword2' },
    })
    expect(screen.getByRole('button', { name: 'Cambiar contraseña' })).not.toBeDisabled()
  })

  it('muestra error si la confirmación no coincide', async () => {
    vi.spyOn(accountApi, 'getAccountProfile').mockResolvedValue(profileFixture as never)
    renderTab()
    await screen.findByDisplayValue('Ana Pérez')
    fireEvent.change(screen.getByLabelText('Nueva contraseña'), {
      target: { value: 'nuevaPassword2' },
    })
    fireEvent.change(screen.getByLabelText('Confirmar nueva contraseña'), {
      target: { value: 'distinta' },
    })
    expect(screen.getByText('Las contraseñas no coinciden')).toBeInTheDocument()
  })

  it('mantiene Cambiar contraseña deshabilitado si nueva = actual', async () => {
    vi.spyOn(accountApi, 'getAccountProfile').mockResolvedValue(profileFixture as never)
    renderTab()
    await screen.findByDisplayValue('Ana Pérez')
    fireEvent.change(screen.getByLabelText('Contraseña actual'), {
      target: { value: 'mismaPassword1' },
    })
    fireEvent.change(screen.getByLabelText('Nueva contraseña'), {
      target: { value: 'mismaPassword1' },
    })
    fireEvent.change(screen.getByLabelText('Confirmar nueva contraseña'), {
      target: { value: 'mismaPassword1' },
    })
    expect(screen.getByRole('button', { name: 'Cambiar contraseña' })).toBeDisabled()
  })

  it('muestra error 422 en current_password cuando el backend lo rechaza', async () => {
    vi.spyOn(accountApi, 'getAccountProfile').mockResolvedValue(profileFixture as never)
    vi.spyOn(accountApi, 'updateAccountPassword').mockRejectedValue({
      isAxiosError: true,
      response: {
        status: 422,
        data: {
          message: 'La contraseña actual es incorrecta',
          errors: { current_password: ['La contraseña actual es incorrecta'] },
        },
      },
    } as never)
    renderTab()
    await screen.findByDisplayValue('Ana Pérez')
    fireEvent.change(screen.getByLabelText('Contraseña actual'), {
      target: { value: 'noCorrecta' },
    })
    fireEvent.change(screen.getByLabelText('Nueva contraseña'), {
      target: { value: 'nuevaPassword2' },
    })
    fireEvent.change(screen.getByLabelText('Confirmar nueva contraseña'), {
      target: { value: 'nuevaPassword2' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Cambiar contraseña' }))
    expect(await screen.findByText('La contraseña actual es incorrecta')).toBeInTheDocument()
  })

  it('limpia los campos de contraseña tras cambio exitoso', async () => {
    vi.spyOn(accountApi, 'getAccountProfile').mockResolvedValue(profileFixture as never)
    vi.spyOn(accountApi, 'updateAccountPassword').mockResolvedValue({
      message: 'Contraseña actualizada',
    } as never)
    renderTab()
    await screen.findByDisplayValue('Ana Pérez')
    fireEvent.change(screen.getByLabelText('Contraseña actual'), {
      target: { value: 'viejaPassword1' },
    })
    fireEvent.change(screen.getByLabelText('Nueva contraseña'), {
      target: { value: 'nuevaPassword2' },
    })
    fireEvent.change(screen.getByLabelText('Confirmar nueva contraseña'), {
      target: { value: 'nuevaPassword2' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Cambiar contraseña' }))
    await waitFor(() => {
      expect(screen.getByLabelText('Contraseña actual')).toHaveValue('')
      expect(screen.getByLabelText('Nueva contraseña')).toHaveValue('')
      expect(screen.getByLabelText('Confirmar nueva contraseña')).toHaveValue('')
    })
  })

  it('muestra estado de error con botón Reintentar si la query falla', async () => {
    const refetchSpy = vi
      .spyOn(accountApi, 'getAccountProfile')
      .mockRejectedValueOnce(new Error('boom'))
    renderTab()
    expect(await screen.findByText(/No se pudieron cargar tus datos/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Reintentar/i })).toBeInTheDocument()
    refetchSpy.mockResolvedValueOnce(profileFixture as never)
    fireEvent.click(screen.getByRole('button', { name: /Reintentar/i }))
    expect(await screen.findByDisplayValue('Ana Pérez')).toBeInTheDocument()
  })
})
