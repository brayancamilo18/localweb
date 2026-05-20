import { useEffect, useRef, useState } from 'react'
import type { AnchorRect, UseTourAnchorResult } from './types'

const POLL_TIMEOUT_MS = 1500

function readRect(el: Element): AnchorRect {
  const r = el.getBoundingClientRect()
  return { top: r.top, left: r.left, width: r.width, height: r.height }
}

/** Evita anclar al primer match oculto (p. ej. sidebar duplicado con display:none). */
export function findAnchorElement(selector: string): Element | null {
  const first = document.querySelector(selector)
  if (first === null) return null
  const { width, height } = first.getBoundingClientRect()
  if (width !== 0 || height !== 0) return first
  for (const el of document.querySelectorAll(selector)) {
    const r = el.getBoundingClientRect()
    if (r.width !== 0 && r.height !== 0) return el
  }
  return first
}

/**
 * Espera (con rAF) a que `selector` exista en el DOM y devuelve su rect.
 *
 * Reactividad:
 *   - Cuando el elemento aparece o cambia (scroll/resize), reemite rect.
 *   - Si pasan POLL_TIMEOUT_MS sin encontrarlo, devuelve ready=true con
 *     rect=null → el caller (TourTooltip) cae en presentación centrada.
 *
 * Por qué polling y no MutationObserver: tras navegar con react-router
 * la sección puede tardar un par de frames en montar, pero también puede
 * existir ya. Un MO con `subtree:true, childList:true` sobre body es
 * desproporcionado; el rAF gasta muy poco y para de por sí.
 */
export function useTourAnchor(selector: string | null): UseTourAnchorResult {
  const [rect, setRect] = useState<AnchorRect | null>(null)
  const [ready, setReady] = useState<boolean>(false)

  const selectorRef = useRef<string | null>(selector)
  selectorRef.current = selector

  useEffect(() => {
    setReady(false)
    setRect(null)

    if (selector === null || selector.length === 0) {
      setReady(true)
      return
    }

    let cancelled = false
    let rafId = 0
    const startedAt = performance.now()

    const tick = (): void => {
      if (cancelled) return
      const el = findAnchorElement(selector)
      if (el !== null) {
        setRect(readRect(el))
        setReady(true)
        return
      }
      if (performance.now() - startedAt > POLL_TIMEOUT_MS) {
        setRect(null)
        setReady(true)
        return
      }
      rafId = requestAnimationFrame(tick)
    }
    rafId = requestAnimationFrame(tick)

    const onReflow = (): void => {
      const sel = selectorRef.current
      if (sel === null || sel.length === 0) return
      const el = findAnchorElement(sel)
      if (el !== null) {
        setRect(readRect(el))
      }
    }
    window.addEventListener('resize', onReflow, { passive: true })
    window.addEventListener('scroll', onReflow, { passive: true, capture: true })

    return () => {
      cancelled = true
      if (rafId !== 0) cancelAnimationFrame(rafId)
      window.removeEventListener('resize', onReflow)
      window.removeEventListener('scroll', onReflow, { capture: true })
    }
  }, [selector])

  return { rect, ready }
}
