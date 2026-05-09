import { useContext } from 'react'
import { ToastContext, type ToastContextValue } from './ToastContext'

/**
 * Acceso tipado al contexto de toasts. Si lo invocas fuera del `ToastProvider` (p. ej. en
 * un test que olvida envolver el árbol) lanzamos: error explícito > undefined silencioso.
 */
export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    throw new Error('useToast must be used within ToastProvider')
  }
  return ctx
}
