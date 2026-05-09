export type ToastType = 'success' | 'error' | 'info'

export type ToastAction = {
  label: string
  onClick: () => void
}

/**
 * Forma rica del toast que el usuario nos pasa al llamar a `showToast({...})`.
 * `duration`:
 *  - undefined → usa el default (3000 ms).
 *  - número > 0 → ese tiempo de auto-dismiss en ms.
 *  - null o 0 → no auto-dismiss (queda hasta que el usuario lo cierre o haga click en la acción).
 */
export type ToastInput = {
  type: ToastType
  title: string
  description?: string
  action?: ToastAction
  duration?: number | null
}

export type Toast = {
  id: number
  type: ToastType
  title: string
  description?: string
  action?: ToastAction
  /** ms de auto-dismiss; null = persistente. Resuelto ya con default aplicado. */
  duration: number | null
}

export const DEFAULT_TOAST_DURATION_MS = 3000

/** Cuántos toasts mostramos como máximo a la vez antes de empujar al más viejo. */
export const MAX_VISIBLE_TOASTS = 4
