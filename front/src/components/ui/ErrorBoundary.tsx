import { Component, type ErrorInfo, type ReactNode } from 'react'

type Props = { children: ReactNode }
type State = { hasError: boolean }

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = { hasError: false }

  public static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  public componentDidCatch(_error: Error, _errorInfo: ErrorInfo) {}

  public render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            gap: 16,
            background: 'var(--lw-bg)',
            color: 'var(--lw-text)',
          }}
        >
          <h1 style={{ margin: 0, fontSize: 22 }}>Ha ocurrido un error</h1>
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{
              height: 38,
              padding: '0 14px',
              borderRadius: 'var(--lw-r-sm)',
              border: '1px solid var(--lw-border)',
              background: 'var(--lw-bg-elev)',
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            Recargar página
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
