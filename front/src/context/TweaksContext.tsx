import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { applyTokens, TWEAKS_DEFAULT, type TweakValues } from '../theme/tweaksConfig'

export interface TweaksContextValue {
  tweaks: TweakValues
  setTweak: (key: keyof TweakValues, value: string) => void
}

const TweaksContext = createContext<TweaksContextValue | null>(null)

function safePostSetKeys(edits: Record<string, unknown>) {
  try {
    if (typeof window !== 'undefined' && window.parent !== window) {
      window.parent.postMessage({ type: '__edit_mode_set_keys', edits }, '*')
    }
  } catch {
    /* ignore */
  }
}

export function TweaksProvider({
  children,
  initial = TWEAKS_DEFAULT,
}: {
  children: ReactNode
  initial?: TweakValues
}) {
  const [values, setValues] = useState<TweakValues>(initial)

  const setTweak = useCallback((key: keyof TweakValues, value: string) => {
    const edits = { [key]: value } as Partial<TweakValues>
    setValues((prev) => ({ ...prev, ...edits }) as TweakValues)
    safePostSetKeys(edits as Record<string, unknown>)
  }, [])

  useEffect(() => {
    applyTokens(values)
  }, [values])

  const value = useMemo(() => ({ tweaks: values, setTweak }), [values, setTweak])

  return <TweaksContext.Provider value={value}>{children}</TweaksContext.Provider>
}

export function useTweaksContext(): TweaksContextValue {
  const ctx = useContext(TweaksContext)
  if (!ctx) {
    throw new Error('useTweaksContext must be used within TweaksProvider')
  }
  return ctx
}
