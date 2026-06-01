import { useCallback, useLayoutEffect, useRef, useState } from 'react'

// Excluir iOS/iPadOS (y Android WebKit): CSS.supports devuelve true pero al quitar
// -webkit-text-security dinámicamente WebKit solo repinta el último carácter.
const isWebKitMobile =
  typeof navigator !== 'undefined' &&
  /iP(hone|ad|od)|Android.*AppleWebKit/i.test(navigator.userAgent)

const supportsCssMask =
  !isWebKitMobile &&
  typeof CSS !== 'undefined' &&
  typeof CSS.supports === 'function' &&
  CSS.supports('-webkit-text-security', 'disc')

/** Muestra/oculta contraseña sin mover el cursor (CSS mask; fallback type+selection). */
export function usePasswordReveal(initialVisible = false) {
  const [visible, setVisible] = useState(initialVisible)
  const inputRef = useRef<HTMLInputElement>(null)
  const pendingSelection = useRef<{ start: number; end: number } | null>(null)

  const captureSelection = useCallback(() => {
    const el = inputRef.current
    if (!el) return
    const len = el.value.length
    pendingSelection.current = {
      start: el.selectionStart ?? len,
      end: el.selectionEnd ?? len,
    }
  }, [])

  const toggle = useCallback(() => {
    if (!supportsCssMask) {
      captureSelection()
    }
    setVisible((v) => !v)
  }, [captureSelection])

  useLayoutEffect(() => {
    if (supportsCssMask) return
    const el = inputRef.current
    const sel = pendingSelection.current
    if (!el || !sel) return

    const len = el.value.length
    const start = Math.min(sel.start, len)
    const end = Math.min(sel.end, len)

    const restore = () => {
      el.focus({ preventScroll: true })
      try {
        el.setSelectionRange(start, end)
      } catch {
        /* ignore */
      }
    }

    restore()
    requestAnimationFrame(restore)
    pendingSelection.current = null
  }, [visible])

  return {
    visible,
    toggle,
    captureSelection,
    inputRef,
    /** Siempre text con máscara CSS cuando el navegador lo permite (no resetea el cursor). */
    inputType: supportsCssMask ? ('text' as const) : visible ? ('text' as const) : ('password' as const),
    inputClassName: supportsCssMask && !visible ? 'lw-password-masked' : undefined,
  }
}
