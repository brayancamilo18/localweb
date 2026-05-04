import type { CSSProperties, ReactNode } from 'react'
import Icon from './Icon'

type BtnProps = {
  children: ReactNode
  kind?: 'primary' | 'outline' | 'ghost' | 'danger' | 'success' | 'dark'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  icon?: string
  iconRight?: string
  fullWidth?: boolean
  disabled?: boolean
  loading?: boolean
  style?: CSSProperties
  onClick?: () => void
  type?: 'button' | 'submit' | 'reset'
}

export default function Btn({
  children,
  kind = 'primary',
  size = 'md',
  icon,
  iconRight,
  fullWidth,
  disabled,
  loading,
  style,
  onClick,
  type = 'button',
}: BtnProps) {
  const sizes = {
    sm: { h: 32, px: 12, fs: 13, gap: 6, radius: 'var(--lw-r-sm)' },
    md: { h: 38, px: 14, fs: 14, gap: 8, radius: 'var(--lw-r-sm)' },
    lg: { h: 44, px: 18, fs: 15, gap: 8, radius: 'var(--lw-r)' },
    xl: { h: 52, px: 24, fs: 16, gap: 10, radius: 'var(--lw-r)' },
  } as const
  const kinds = {
    primary: {
      bg: 'var(--lw-accent)',
      color: '#fff',
      border: 'transparent',
      shadow: '0 1px 0 rgba(255,255,255,.15) inset, 0 1px 2px rgba(15,23,42,.12)',
    },
    outline: { bg: 'var(--lw-bg-elev)', color: 'var(--lw-text)', border: 'var(--lw-border)', shadow: 'var(--lw-shadow-1)' },
    ghost: { bg: 'transparent', color: 'var(--lw-text-2)', border: 'transparent' },
    danger: { bg: 'var(--lw-bg-elev)', color: 'var(--lw-danger)', border: 'var(--lw-border)' },
    success: {
      bg: 'var(--lw-success)',
      color: '#fff',
      border: 'transparent',
      shadow: '0 1px 0 rgba(255,255,255,.12) inset, 0 1px 2px rgba(15,23,42,.1)',
    },
    dark: {
      bg: 'var(--lw-text)',
      color: '#fff',
      border: 'transparent',
      shadow: '0 1px 0 rgba(255,255,255,.06) inset, 0 1px 2px rgba(15,23,42,.18)',
    },
  } as const

  const s = sizes[size]
  const k = kinds[kind] as { bg: string; color: string; border: string; shadow?: string }
  const isDisabled = Boolean(disabled || loading)

  return (
    <>
      <style>{'@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}'}</style>
      <button
        type={type}
        disabled={isDisabled}
        onClick={onClick}
        style={{
          position: 'relative',
          height: s.h,
          padding: `0 ${s.px}px`,
          fontSize: s.fs,
          fontWeight: 500,
          gap: s.gap,
          borderRadius: s.radius,
          background: k.bg,
          color: k.color,
          border: `1px solid ${k.border}`,
          boxShadow: k.shadow || 'none',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: isDisabled ? 'not-allowed' : 'pointer',
          opacity: isDisabled ? 0.5 : 1,
          width: fullWidth ? '100%' : undefined,
          fontFamily: 'inherit',
          whiteSpace: 'nowrap',
          transition: 'background .12s',
          ...style,
        }}
      >
        {loading ? (
          <>
            <Icon name="refresh" size={s.fs + 2} style={{ animation: 'spin 1s linear infinite' }} />
            <span style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0,0,0,0)' }}>
              {children}
            </span>
          </>
        ) : (
          <>
            {icon ? <Icon name={icon} size={s.fs + 2} /> : null}
            {children}
            {iconRight ? <Icon name={iconRight} size={s.fs + 2} /> : null}
          </>
        )}
      </button>
    </>
  )
}
