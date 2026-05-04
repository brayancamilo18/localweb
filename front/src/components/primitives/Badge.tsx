import type { ReactNode } from 'react'

type BadgeProps = {
  children: ReactNode
  tone?: 'success' | 'warning' | 'danger' | 'pro' | 'default'
  dot?: boolean
  size?: 'sm' | 'md'
}

export default function Badge({ children, tone = 'default', dot, size = 'md' }: BadgeProps) {
  const tones = {
    default: { bg: 'var(--lw-surface)', color: 'var(--lw-text-2)', border: 'var(--lw-border)' },
    pro: {
      bg: 'var(--lw-pro)',
      color: '#FFFBF5',
      border: '1px solid rgba(0, 0, 0, 0.18)',
    },
    success: { bg: 'var(--lw-success-soft)', color: '#15803D', border: 'transparent' },
    warning: { bg: '#FEF3C7', color: '#92400E', border: 'transparent' },
    danger: { bg: 'var(--lw-danger-soft)', color: 'var(--lw-danger)', border: 'transparent' },
  } as const
  const t = tones[tone]
  const isSm = size === 'sm'

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: isSm ? 4 : 5,
        height: isSm ? 18 : 22,
        padding: isSm ? '0 6px' : '0 8px',
        background: t.bg,
        color: t.color,
        border: `1px solid ${t.border}`,
        borderRadius: 999,
        fontSize: isSm ? 10 : 11,
        fontWeight: 600,
        letterSpacing: '.02em',
        whiteSpace: 'nowrap',
      }}
    >
      {dot ? <span style={{ width: 6, height: 6, borderRadius: 999, background: t.color }} /> : null}
      {children}
    </span>
  )
}
