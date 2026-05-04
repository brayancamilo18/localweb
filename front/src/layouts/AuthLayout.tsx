import type { ReactNode } from 'react'
import Card from '../components/primitives/Card'
import Logo from '../components/primitives/Logo'

interface AuthLayoutProps {
  children: ReactNode
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <main
      style={{
        minHeight: '100vh',
        background: 'var(--lw-bg)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      <Card style={{ width: '100%', maxWidth: 400 }} padding={32}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
          <Logo />
        </div>
        {children}
      </Card>
    </main>
  )
}
