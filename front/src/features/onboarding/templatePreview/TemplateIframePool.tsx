import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from 'react'

type TemplateIframePoolContextValue = {
  requestLoad: (variant: string) => void
  isLoaded: (variant: string) => boolean
  attach: (variant: string, host: HTMLElement | null) => void
}

const TemplateIframePoolContext = createContext<TemplateIframePoolContextValue | null>(null)

export function useTemplateIframePool(): TemplateIframePoolContextValue {
  const ctx = useContext(TemplateIframePoolContext)
  if (!ctx) {
    throw new Error('useTemplateIframePool debe usarse dentro de TemplateIframePoolProvider')
  }
  return ctx
}

export type TemplateIframePoolProviderProps = {
  children: ReactNode
  /** Renderiza el iframe thumb de una plantilla ya solicitada (variant = slug canónico). */
  renderThumb: (variant: string) => ReactNode
}

/**
 * Mantiene iframes de plantillas ya visitadas montados en un aparcadero oculto.
 * Al paginar o reordenar el grid, se reubica el mismo nodo DOM (sin recargar el HTML).
 */
export function TemplateIframePoolProvider({ children, renderThumb }: TemplateIframePoolProviderProps) {
  const parkRef = useRef<HTMLDivElement>(null)
  const wrappersRef = useRef<Map<string, HTMLDivElement>>(new Map())
  const [loadedVariants, setLoadedVariants] = useState<string[]>([])

  const requestLoad = useCallback((variant: string) => {
    setLoadedVariants((prev) => (prev.includes(variant) ? prev : [...prev, variant]))
  }, [])

  const isLoaded = useCallback(
    (variant: string) => loadedVariants.includes(variant),
    [loadedVariants],
  )

  const attach = useCallback((variant: string, host: HTMLElement | null) => {
    const wrapper = wrappersRef.current.get(variant)
    const park = parkRef.current
    const target = host ?? park
    if (!wrapper || !target) return
    if (wrapper.parentElement !== target) {
      target.appendChild(wrapper)
    }
  }, [])

  const value = useMemo<TemplateIframePoolContextValue>(
    () => ({
      requestLoad,
      isLoaded,
      attach,
    }),
    [requestLoad, isLoaded, attach],
  )

  return (
    <TemplateIframePoolContext.Provider value={value}>
      {children}
      <div
        ref={parkRef}
        className="lw-template-iframe-park"
        aria-hidden
        style={{
          position: 'fixed',
          left: -10000,
          top: 0,
          width: 1,
          height: 1,
          overflow: 'hidden',
          visibility: 'hidden',
          pointerEvents: 'none',
        }}
      >
        {loadedVariants.map((variant) => (
          <div
            key={variant}
            ref={(el) => {
              if (el) wrappersRef.current.set(variant, el)
              else wrappersRef.current.delete(variant)
            }}
            className="lw-template-iframe-park-slot"
            data-template-variant={variant}
          >
            {renderThumb(variant)}
          </div>
        ))}
      </div>
    </TemplateIframePoolContext.Provider>
  )
}

export type PooledTemplateThumbHostProps = {
  variant: string
  hostRef: RefObject<HTMLDivElement | null>
}

/** Reubica el iframe del pool en el contenedor visible de la tarjeta. */
export function PooledTemplateThumbHost({ variant, hostRef }: PooledTemplateThumbHostProps) {
  const { attach, isLoaded } = useTemplateIframePool()
  const loaded = isLoaded(variant)

  useLayoutEffect(() => {
    if (!loaded) return
    attach(variant, hostRef.current)
    return () => {
      attach(variant, null)
    }
  }, [variant, hostRef, loaded, attach])

  return null
}
