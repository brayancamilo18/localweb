import type { CSSProperties, ReactNode } from 'react'

type CardProps = {
  children: ReactNode
  padding?: number
  style?: CSSProperties
  className?: string
  onClick?: () => void
}

export default function Card({ children, padding = 20, style, className, onClick }: CardProps) {
  return (
    <div
      className={className}
      onClick={onClick}
      style={{
        background: 'var(--lw-bg-elev)',
        border: '1px solid var(--lw-border)',
        borderRadius: 'var(--lw-r)',
        padding,
        boxShadow: 'var(--lw-shadow-1)',
        ...style,
      }}
    >
      {children}
    </div>
  )
}
