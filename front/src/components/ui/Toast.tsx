import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'

type ToastType = 'success' | 'error' | 'info'
type Toast = { id: number; message: string; type: ToastType }
type ToastContextValue = {
  showToast: (message: string, type: ToastType) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const value = useMemo(
    () => ({
      showToast(message: string, type: ToastType) {
        const id = Date.now() + Math.random()
        setToasts((prev) => [...prev, { id, message, type }])
        window.setTimeout(() => {
          setToasts((prev) => prev.filter((toast) => toast.id !== id))
        }, 3000)
      },
    }),
    [],
  )

  const bgByType: Record<ToastType, string> = {
    success: 'var(--lw-success)',
    error: 'var(--lw-danger)',
    info: 'var(--lw-accent)',
  }

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        style={{
          position: 'fixed',
          right: 16,
          bottom: 16,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          zIndex: 1000,
        }}
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            style={{
              minWidth: 220,
              maxWidth: 320,
              padding: '10px 12px',
              borderRadius: 'var(--lw-r-sm)',
              color: '#fff',
              background: bgByType[toast.type],
              boxShadow: 'var(--lw-shadow-pop)',
              fontSize: 13,
              fontWeight: 500,
            }}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within ToastProvider')
  }
  return context
}
