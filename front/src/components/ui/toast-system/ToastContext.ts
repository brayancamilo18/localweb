import { createContext } from 'react'
import type { ToastInput, ToastType } from './types'

/**
 * Sobrecargas que ofrece el hook:
 *  - `showToast(message, type)`               ← API antigua, sigue viva por compat.
 *  - `showToast({ type, title, description?, action?, duration? })` ← API rica nueva.
 *
 * Internamente la primera se normaliza a la segunda en el provider.
 */
export type ShowToast = {
  (message: string, type: ToastType): void
  (input: ToastInput): void
}

export type ToastContextValue = {
  showToast: ShowToast
  /** Útil para tests y para que un caller cierre programáticamente un toast. */
  dismissToast: (id: number) => void
}

/*
 * Vive en su propio fichero (no en `ToastProvider.tsx`) para no mezclar exports de
 * componentes con exports de no-componentes — esto satisface la regla
 * `react-refresh/only-export-components` y permite Fast Refresh limpio del provider.
 */
export const ToastContext = createContext<ToastContextValue | null>(null)
