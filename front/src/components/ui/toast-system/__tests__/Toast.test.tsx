/**
 * Tests del nuevo sistema de toasts.
 *
 * Notas sobre el entorno:
 *   - vitest config usa pool=vmThreads, isolate=false, fileParallelism=false. Los timers
 *     fake se "pegan" entre tests del mismo fichero si no los reseteamos. Por eso
 *     `useRealTimers()` en afterEach.
 *   - El provider monta el container en `document.body` vía portal. `cleanup()` (afterEach
 *     global de test-setup) lo desmonta correctamente, no necesitamos limpiar a mano.
 *   - El item desaparece del DOM cuando termina la animación CSS de salida (200 ms en
 *     `toast.module.css`). Con fake timers tenemos que avanzar 200 ms tras cada cierre.
 */

import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ToastProvider, useToast } from '../index'
import type { ToastInput } from '../index'

const EXIT_MS = 200
const DEFAULT_MS = 3000

/**
 * Harness reusable: el padre llamante decide qué toast disparar dándole una `factory`
 * que se ejecuta al hacer click en "fire". Mantiene los tests cortos sin contaminar la
 * API pública con utilidades de test.
 */
function Harness({ factory }: { factory: () => ToastInput | { msg: string; type: 'success' | 'error' | 'info' } }) {
  const { showToast } = useToast()
  return (
    <button
      type="button"
      onClick={() => {
        const input = factory()
        if ('msg' in input) {
          showToast(input.msg, input.type)
        } else {
          showToast(input)
        }
      }}
    >
      fire
    </button>
  )
}

function setup(factory: () => ToastInput | { msg: string; type: 'success' | 'error' | 'info' }) {
  return render(
    <ToastProvider>
      <Harness factory={factory} />
    </ToastProvider>,
  )
}

/** Devuelve los items del stack actual en orden visual (más viejo arriba). */
function stackItems(): HTMLElement[] {
  const viewport = screen.queryByTestId('lw-toast-viewport')
  if (!viewport) return []
  return Array.from(viewport.querySelectorAll<HTMLElement>('[data-toast-type]'))
}

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.runOnlyPendingTimers()
  vi.useRealTimers()
})

describe('ToastProvider · render visual', () => {
  it('renderiza un toast success con título, descripción y action', () => {
    const onClick = vi.fn()
    setup(() => ({
      type: 'success',
      title: '¡Tu web está publicada!',
      description: 'estudio-marta.localweb.es ya es visible.',
      action: { label: 'Compartir', onClick },
    }))

    fireEvent.click(screen.getByRole('button', { name: 'fire' }))

    expect(screen.getByText('¡Tu web está publicada!')).toBeInTheDocument()
    expect(screen.getByText('estudio-marta.localweb.es ya es visible.')).toBeInTheDocument()
    // El botón de acción es un <button> con su label visible.
    expect(screen.getByRole('button', { name: /Compartir/i })).toBeInTheDocument()
  })

  it('action.onClick se ejecuta al hacer click y cierra el toast', () => {
    const onAction = vi.fn()
    setup(() => ({
      type: 'error',
      title: 'No se pudo guardar',
      action: { label: 'Reintentar', onClick: onAction },
    }))
    fireEvent.click(screen.getByRole('button', { name: 'fire' }))

    fireEvent.click(screen.getByRole('button', { name: /Reintentar/i }))
    expect(onAction).toHaveBeenCalledTimes(1)

    // Tras el click la animación de salida tarda 200 ms en desmontar el nodo.
    act(() => {
      vi.advanceTimersByTime(EXIT_MS + 10)
    })
    expect(screen.queryByText('No se pudo guardar')).not.toBeInTheDocument()
  })
})

describe('ToastProvider · auto-dismiss', () => {
  it('se cierra automáticamente a los 3000 ms por defecto', () => {
    setup(() => ({ type: 'info', title: 'Subiendo 4 fotos…' }))
    fireEvent.click(screen.getByRole('button', { name: 'fire' }))
    expect(screen.getByText('Subiendo 4 fotos…')).toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(DEFAULT_MS - 1)
    })
    expect(screen.getByText('Subiendo 4 fotos…')).toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(1 + EXIT_MS)
    })
    expect(screen.queryByText('Subiendo 4 fotos…')).not.toBeInTheDocument()
  })

  it('duration: null nunca auto-dismissea', () => {
    setup(() => ({ type: 'info', title: 'Persistente', duration: null }))
    fireEvent.click(screen.getByRole('button', { name: 'fire' }))

    act(() => {
      // Avanzamos un buen rato (10 segundos): si tuviera timer, ya habría caído.
      vi.advanceTimersByTime(10_000)
    })
    expect(screen.getByText('Persistente')).toBeInTheDocument()
  })

  it('hover pausa el timer y al salir continúa donde estaba (no reinicia)', () => {
    setup(() => ({ type: 'success', title: 'Cambios guardados' }))
    fireEvent.click(screen.getByRole('button', { name: 'fire' }))

    const item = stackItems()[0]
    expect(item).toBeDefined()

    // Avanzamos 1500 ms (mitad del default).
    act(() => {
      vi.advanceTimersByTime(1500)
    })
    // Pausamos con hover.
    fireEvent.mouseEnter(item!)
    // Avanzamos un montón: como está pausado, no se cierra.
    act(() => {
      vi.advanceTimersByTime(10_000)
    })
    expect(screen.getByText('Cambios guardados')).toBeInTheDocument()

    // Quitamos el hover: el timer reanuda con los ~1500 ms restantes.
    fireEvent.mouseLeave(item!)
    act(() => {
      vi.advanceTimersByTime(1499)
    })
    expect(screen.getByText('Cambios guardados')).toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(1 + EXIT_MS)
    })
    expect(screen.queryByText('Cambios guardados')).not.toBeInTheDocument()
  })
})

describe('ToastProvider · interacciones', () => {
  it('click en X cierra inmediatamente con animación de salida', () => {
    setup(() => ({ type: 'info', title: 'Cerrame ya' }))
    fireEvent.click(screen.getByRole('button', { name: 'fire' }))

    fireEvent.click(screen.getByRole('button', { name: 'Cerrar notificación' }))

    act(() => {
      vi.advanceTimersByTime(EXIT_MS + 10)
    })
    expect(screen.queryByText('Cerrame ya')).not.toBeInTheDocument()
  })
})

describe('ToastProvider · API back-compat', () => {
  it('showToast("texto", "success") sigue funcionando como toast simple', () => {
    setup(() => ({ msg: 'Listo', type: 'success' }))
    fireEvent.click(screen.getByRole('button', { name: 'fire' }))

    expect(screen.getByText('Listo')).toBeInTheDocument()
    // Sin descripción, sin action: solo título.
    const item = stackItems()[0]!
    expect(within(item).queryByRole('button', { name: 'Cerrar notificación' })).toBeInTheDocument()
  })
})

describe('ToastProvider · stack', () => {
  it('limita a 4 toasts simultáneos: el 5º expulsa al más viejo', () => {
    function StackHarness() {
      const { showToast } = useToast()
      return (
        <button
          type="button"
          onClick={() => {
            for (let i = 1; i <= 5; i += 1) {
              showToast({ type: 'info', title: `T${i}`, duration: null })
            }
          }}
        >
          fire5
        </button>
      )
    }
    render(
      <ToastProvider>
        <StackHarness />
      </ToastProvider>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'fire5' }))

    expect(stackItems()).toHaveLength(4)
    // T1 (el más viejo) tuvo que ser expulsado; T2..T5 sobreviven.
    expect(screen.queryByText('T1')).not.toBeInTheDocument()
    expect(screen.getByText('T2')).toBeInTheDocument()
    expect(screen.getByText('T5')).toBeInTheDocument()
  })
})

describe('ToastProvider · accesibilidad', () => {
  it('role="alert" para type=error', () => {
    setup(() => ({ type: 'error', title: 'Boom' }))
    fireEvent.click(screen.getByRole('button', { name: 'fire' }))
    const alert = screen.getByRole('alert')
    expect(alert).toHaveAttribute('aria-live', 'assertive')
    expect(within(alert).getByText('Boom')).toBeInTheDocument()
  })

  it('role="status" para type=success', () => {
    setup(() => ({ type: 'success', title: 'Ok!' }))
    fireEvent.click(screen.getByRole('button', { name: 'fire' }))
    const status = screen.getByRole('status')
    expect(status).toHaveAttribute('aria-live', 'polite')
    expect(within(status).getByText('Ok!')).toBeInTheDocument()
  })

  it('role="status" para type=info', () => {
    setup(() => ({ type: 'info', title: 'Info' }))
    fireEvent.click(screen.getByRole('button', { name: 'fire' }))
    const status = screen.getByRole('status')
    expect(status).toHaveAttribute('aria-live', 'polite')
    expect(within(status).getByText('Info')).toBeInTheDocument()
  })
})
