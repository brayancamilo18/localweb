/* eslint-disable react-refresh/only-export-components --
 * Este fichero es un *shim* de re-export para preservar la API pública pre-rediseño
 * (ToastProvider + useToast viven juntos en `../components/ui/Toast`). Mover el hook a
 * otro fichero rompería los 6 imports existentes; se centraliza aquí a propósito.
 */
/*
 * Re-export del nuevo módulo `./toast-system/` (rediseño visual del sistema de notificaciones).
 *
 * Se mantiene este fichero para no romper los imports existentes:
 *   import { ToastProvider, useToast } from '../components/ui/Toast'
 *
 * Nota sobre el nombre del directorio: la spec original pedía `./toast/`, pero macOS y
 * Windows usan FS case-insensitive y un fichero `Toast.tsx` no puede convivir con un
 * directorio `toast/` (TypeScript los considera el mismo módulo). Renombramos el dir a
 * `toast-system/` para preservar este re-export y por tanto los 6 sitios que ya importan
 * `../components/ui/Toast`.
 *
 * La API pública sigue siendo la misma:
 *   - showToast('texto', 'success' | 'error' | 'info')             ← retro-compatible
 *   - showToast({ type, title, description?, action?, duration? }) ← nueva firma rica
 */
export { ToastProvider, useToast } from './toast-system'
export type { ToastInput, ToastAction, ToastType } from './toast-system'
