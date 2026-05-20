import {
  forwardRef,
  useId,
  type ButtonHTMLAttributes,
  type CSSProperties,
  type InputHTMLAttributes,
  type ReactNode,
  type TextareaHTMLAttributes,
} from 'react'
import Logo from './Logo'

// ONEZ — Primitives & shared components
// Small, composable building blocks used across all artboards.

// ─────────────────────────────────────────────────────────────
// Icon — 1.5px stroke, lucide-style
// ─────────────────────────────────────────────────────────────
export type IconProps = {
  name: string
  size?: number
  stroke?: number
  color?: string
  style?: CSSProperties
}

export function Icon({ name, size = 16, stroke = 1.5, color = 'currentColor', style }: IconProps) {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none' as const,
    stroke: color,
    strokeWidth: stroke,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    style: { display: "inline-block", flexShrink: 0, ...style },
  };
  const paths: Record<string, ReactNode> = {
    check: <polyline points="4 12 10 18 20 6" />,
    x:     <><line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/></>,
    plus:  <><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>,
    minus: <line x1="5" y1="12" x2="19" y2="12"/>,
    chevronRight: <polyline points="9 6 15 12 9 18"/>,
    chevronLeft:  <polyline points="15 6 9 12 15 18"/>,
    chevronDown:  <polyline points="6 9 12 15 18 9"/>,
    arrowRight:   <><line x1="5" y1="12" x2="19" y2="12"/><polyline points="13 6 19 12 13 18"/></>,
    arrowUpRight: <><line x1="7" y1="17" x2="17" y2="7"/><polyline points="9 7 17 7 17 15"/></>,
    upload: <><path d="M12 16V4"/><polyline points="6 9 12 3 18 9"/><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"/></>,
    image:  <><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="1.6"/><polyline points="3 17 9 13 14 17 21 12"/></>,
    camera: <><path d="M4 8h3l2-2h6l2 2h3a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2z"/><circle cx="12" cy="13" r="3.5"/></>,
    clock:  <><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 14"/></>,
    map:    <><polygon points="3 6 9 4 15 6 21 4 21 18 15 20 9 18 3 20 3 6"/><line x1="9" y1="4" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="20"/></>,
    pin:    <><path d="M12 21s7-7.5 7-12a7 7 0 1 0-14 0c0 4.5 7 12 7 12z"/><circle cx="12" cy="9" r="2.5"/></>,
    phone:  <path d="M5 4h3l2 5-2.5 1.5a11 11 0 0 0 6 6L15 14l5 2v3a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/>,
    mail:   <><rect x="3" y="5" width="18" height="14" rx="2"/><polyline points="3 7 12 13 21 7"/></>,
    user:   <><circle cx="12" cy="9" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></>,
    users:  <><circle cx="9" cy="9" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 5a3.5 3.5 0 0 1 0 7"/><path d="M21.5 20a6.5 6.5 0 0 0-3.5-5.5"/></>,
    sparkle:<><path d="M12 3v6"/><path d="M12 15v6"/><path d="M3 12h6"/><path d="M15 12h6"/><path d="M6 6l3 3"/><path d="M15 15l3 3"/><path d="M18 6l-3 3"/><path d="M9 15l-3 3"/></>,
    bolt:   <polygon points="13 3 5 13 11 13 10 21 18 11 12 11 13 3"/>,
    smartphone:<><rect x="6" y="2" width="12" height="20" rx="2.5"/><line x1="11" y1="18" x2="13" y2="18"/></>,
    monitor:<><rect x="3" y="4" width="18" height="12" rx="2"/><line x1="8" y1="20" x2="16" y2="20"/><line x1="12" y1="16" x2="12" y2="20"/></>,
    eye:    <><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></>,
    edit:   <><path d="M4 20h4l10-10-4-4L4 16v4z"/><line x1="14" y1="6" x2="18" y2="10"/></>,
    settings:<><circle cx="12" cy="12" r="3"/><path d="M19 12a7 7 0 0 0-.1-1.2l2-1.6-2-3.4-2.4.8a7 7 0 0 0-2-1.2L14 3h-4l-.5 2.4a7 7 0 0 0-2 1.2l-2.4-.8-2 3.4 2 1.6A7 7 0 0 0 5 12c0 .4 0 .8.1 1.2l-2 1.6 2 3.4 2.4-.8a7 7 0 0 0 2 1.2L10 21h4l.5-2.4a7 7 0 0 0 2-1.2l2.4.8 2-3.4-2-1.6c.1-.4.1-.8.1-1.2z"/></>,
    grid:   <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>,
    barChart:<><line x1="4" y1="20" x2="20" y2="20"/><rect x="6" y="11" width="3" height="9"/><rect x="11" y="6" width="3" height="14"/><rect x="16" y="14" width="3" height="6"/></>,
    trending:<><polyline points="3 17 9 11 13 15 21 7"/><polyline points="15 7 21 7 21 13"/></>,
    creditCard:<><rect x="3" y="6" width="18" height="13" rx="2"/><line x1="3" y1="11" x2="21" y2="11"/></>,
    shield: <path d="M12 3l8 3v6c0 5-3.5 8.5-8 9-4.5-.5-8-4-8-9V6l8-3z"/>,
    lock:   <><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></>,
    unlock: <><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 7-2.5"/></>,
    menu:   <><line x1="4" y1="7" x2="20" y2="7"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="17" x2="20" y2="17"/></>,
    search: <><circle cx="11" cy="11" r="6.5"/><line x1="16" y1="16" x2="20" y2="20"/></>,
    trash:  <><polyline points="4 7 20 7"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/><path d="M6 7l1 13a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-13"/></>,
    info:   <><circle cx="12" cy="12" r="9"/><line x1="12" y1="11" x2="12" y2="16"/><circle cx="12" cy="8" r=".7" fill={color} stroke="none"/></>,
    alert:  <><path d="M12 3l10 17H2L12 3z"/><line x1="12" y1="10" x2="12" y2="14"/><circle cx="12" cy="17" r=".7" fill={color} stroke="none"/></>,
    star:   <polygon points="12 3 14.6 9 21 9.7 16 14 17.5 20.5 12 17.2 6.5 20.5 8 14 3 9.7 9.4 9 12 3"/>,
    whatsapp:<><path d="M3 21l1.6-5A9 9 0 1 1 8 19.4L3 21z"/><path d="M8.5 9.5c.5-.7 1.4-.7 1.8 0l.4 1c.2.5 0 .9-.3 1.2-.4.4-.4 1 0 1.5a5 5 0 0 0 2 2c.5.4 1.1.4 1.5 0 .3-.3.7-.5 1.2-.3l1 .4c.7.4.7 1.3 0 1.8-1 .7-2.4.7-3.4 0-1.6-1-3-2.4-4-4-.7-1-.7-2.4 0-3.4z"/></>,
    list:   <><line x1="8" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="20" y2="12"/><line x1="8" y1="18" x2="20" y2="18"/><circle cx="4.5" cy="6" r=".7" fill={color} stroke="none"/><circle cx="4.5" cy="12" r=".7" fill={color} stroke="none"/><circle cx="4.5" cy="18" r=".7" fill={color} stroke="none"/></>,
    home:   <><path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/></>,
    layout: <><rect x="3" y="4" width="18" height="16" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="9" x2="9" y2="20"/></>,
    palette:<><circle cx="7" cy="11" r="1.5"/><circle cx="11" cy="7" r="1.5"/><circle cx="16" cy="9" r="1.5"/><circle cx="17" cy="14" r="1.5"/><path d="M12 3a9 9 0 1 0 0 18c1 0 1.5-.5 1.5-1.5 0-1-1-1.5-1-2.5 0-1 1-2 2-2h2a4 4 0 0 0 4-4 9 9 0 0 0-9-8z"/></>,
    scissors:<><circle cx="6" cy="7" r="2.5"/><circle cx="6" cy="17" r="2.5"/><line x1="20" y1="4" x2="8.5" y2="15.5"/><line x1="14" y1="14" x2="20" y2="20"/><line x1="20" y1="4" x2="14" y2="10"/></>,
    refresh:<><polyline points="20 6 20 11 15 11"/><polyline points="4 18 4 13 9 13"/><path d="M20 11A8 8 0 0 0 6 7"/><path d="M4 13a8 8 0 0 0 14 4"/></>,
    bell:   <><path d="M6 8a6 6 0 0 1 12 0v5l1.5 3H4.5L6 13z"/><path d="M10 19a2 2 0 0 0 4 0"/></>,
    logOut: <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></>,
  };
  return <svg {...common}>{paths[name] || null}</svg>;
}

// ─────────────────────────────────────────────────────────────
// Buttons
// ─────────────────────────────────────────────────────────────
export type BtnKind = 'primary' | 'outline' | 'ghost' | 'danger' | 'success' | 'dark'
export type BtnSize = 'sm' | 'md' | 'lg' | 'xl'

export type BtnProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> & {
  children?: ReactNode
  kind?: BtnKind
  size?: BtnSize
  icon?: string
  iconRight?: string
  fullWidth?: boolean
  loading?: boolean
}

export function Btn({
  children,
  kind = 'primary',
  size = 'md',
  icon,
  iconRight,
  fullWidth,
  disabled,
  loading,
  style,
  type = 'button',
  ...rest
}: BtnProps) {
  const sizes: Record<BtnSize, { h: number; px: number; fs: number; gap: number; radius: string }> = {
    sm: { h: 32, px: 12, fs: 13, gap: 6, radius: "var(--lw-r-sm)" },
    md: { h: 38, px: 14, fs: 14, gap: 8, radius: "var(--lw-r-sm)" },
    lg: { h: 44, px: 18, fs: 15, gap: 8, radius: "var(--lw-r)" },
    xl: { h: 52, px: 24, fs: 16, gap: 10, radius: "var(--lw-r)" },
  };
  const s = sizes[size];
  const kinds: Record<BtnKind, { bg: string; color: string; border: string; shadow?: string }> = {
    primary: {
      bg: 'var(--lw-accent)',
      color: '#fff',
      border: 'transparent',
      shadow: '0 1px 0 rgba(255,255,255,.15) inset, 0 1px 2px rgba(15,23,42,.12)',
    },
    outline: {
      bg: 'var(--lw-bg-elev)',
      color: 'var(--lw-text)',
      border: 'var(--lw-border)',
      shadow: 'var(--lw-shadow-1)',
    },
    ghost: { bg: 'transparent', color: 'var(--lw-text-2)', border: 'transparent' },
    danger: { bg: 'var(--lw-bg-elev)', color: 'var(--lw-danger)', border: 'var(--lw-border)' },
    success: { bg: 'var(--lw-success)', color: '#fff', border: 'transparent' },
    dark: {
      bg: 'var(--lw-text)',
      color: '#fff',
      border: 'transparent',
      shadow: '0 1px 0 rgba(255,255,255,.06) inset, 0 1px 2px rgba(15,23,42,.18)',
    },
  }
  const k = kinds[kind]
  const isDisabled = Boolean(disabled || loading)
  return (
    <>
      <style>{'@keyframes lw-prim-spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}'}</style>
      <button {...rest} type={type} disabled={isDisabled}
      style={{
        position: 'relative',
        height: s.h, padding: `0 ${s.px}px`, fontSize: s.fs, fontWeight: 500,
        gap: s.gap, borderRadius: s.radius,
        background: k.bg, color: k.color, border: `1px solid ${k.border}`,
        boxShadow: k.shadow || "none",
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        opacity: isDisabled ? 0.5 : 1,
        width: fullWidth ? "100%" : undefined,
        fontFamily: "inherit", whiteSpace: "nowrap",
        transition: "background .12s",
        ...style,
      }}>
      {loading ? (
        <Icon
          name="refresh"
          size={s.fs + 2}
          style={{ animation: 'lw-prim-spin 0.8s linear infinite' }}
        />
      ) : (
        icon && <Icon name={icon} size={s.fs + 2} />
      )}
      {children}
      {!loading && iconRight && <Icon name={iconRight} size={s.fs + 2} />}
    </button>
    </>
  )
}

// ─────────────────────────────────────────────────────────────
// Inputs
// ─────────────────────────────────────────────────────────────
export type FieldProps = {
  label?: string
  hint?: string
  error?: string
  counter?: ReactNode
  optional?: boolean
  children: ReactNode
}

export function Field({ label, hint, error, counter, children, optional }: FieldProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {label && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <label style={{ fontSize: 'var(--lw-form-label)', fontWeight: 500, color: "var(--lw-text)" }}>
            {label}
            {optional && <span style={{ color: "var(--lw-text-4)", fontWeight: 400, marginLeft: 4 }}>· opcional</span>}
          </label>
          {counter && <span style={{ fontSize: 11, color: "var(--lw-text-4)", fontVariantNumeric: "tabular-nums" }}>{counter}</span>}
        </div>
      )}
      {children}
      {error && <div style={{ fontSize: 'var(--lw-form-caption)', color: "var(--lw-danger)", display: "flex", alignItems: "center", gap: 4 }}>
        <Icon name="alert" size={12}/>{error}
      </div>}
      {!error && hint && <div style={{ fontSize: 'var(--lw-form-caption)', color: "var(--lw-text-3)" }}>{hint}</div>}
    </div>
  );
}

export type DesignInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'prefix'> & {
  label?: string
  /** Enlace o control a la derecha del label (p. ej. «¿Olvidaste?»). */
  labelAside?: ReactNode
  error?: string
  helper?: string
  hint?: string
  prefix?: ReactNode
  suffix?: ReactNode
  focus?: boolean
  inputClassName?: string
  /** Por defecto el campo ocupa todo el ancho del contenedor. */
  fullWidth?: boolean
}

export const Input = forwardRef<HTMLInputElement, DesignInputProps>(function Input(
  {
    label,
    labelAside,
    error,
    helper,
    hint,
    prefix,
    suffix,
    focus,
    id,
    style,
    className,
    inputClassName,
    fullWidth = true,
    ...props
  },
  ref,
) {
  const autoId = useId()
  const inputId = id ?? autoId
  const hintText = hint ?? helper
  const disabled = Boolean(props.disabled)

  const shellClass = [
    'lw-input-shell',
    error && 'lw-input-shell--error',
    focus && 'lw-input-shell--focus',
    disabled && 'lw-input-shell--disabled',
  ]
    .filter(Boolean)
    .join(' ')

  const inner = (
    <div
      className={shellClass}
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '0 12px',
        gap: 8,
        position: 'relative',
        overflow: 'hidden',
        minHeight: 'var(--lw-form-control-height)',
        height: 'var(--lw-form-control-height)',
        transition: 'box-shadow .12s, border-color .12s',
        ...style,
      }}
    >
      {prefix ? <span className="lw-input-shell__affix">{prefix}</span> : null}
      <input
        ref={ref}
        id={inputId}
        className={['lw-input-shell__control', inputClassName].filter(Boolean).join(' ')}
        {...props}
      />
      {suffix ? <span className="lw-input-suffix">{suffix}</span> : null}
    </div>
  )

  return (
    <div
      className={className}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        width: fullWidth ? '100%' : 'auto',
        maxWidth: fullWidth ? undefined : '100%',
        flex: fullWidth ? undefined : '0 0 auto',
      }}
    >
      {label ? (
        <div className="lw-input-field__label-row">
          <label htmlFor={inputId} className="lw-input-field__label">
            {label}
          </label>
          {labelAside ? <span className="lw-input-field__label-aside">{labelAside}</span> : null}
        </div>
      ) : null}
      {inner}
      {error ? <div className="lw-input-field__error">{error}</div> : null}
      {!error && hintText ? <div className="lw-input-field__hint">{hintText}</div> : null}
    </div>
  )
})

export type DesignTextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string
  error?: string
  hint?: string
  helper?: string
  focus?: boolean
}

export const Textarea = forwardRef<HTMLTextAreaElement, DesignTextareaProps>(function Textarea(
  { label, error, hint, helper, focus, rows = 4, id, style, className, ...props },
  ref,
) {
  const autoId = useId()
  const tid = id ?? autoId
  const hintText = hint ?? helper

  const control = (
    <textarea
      ref={ref}
      id={tid}
      rows={rows}
      {...props}
      style={{
        width: '100%',
        maxWidth: '100%',
        minWidth: 0,
        boxSizing: 'border-box',
        padding: '10px 12px',
        background: 'var(--lw-bg-elev)',
        border: `1px solid ${error ? 'var(--lw-danger)' : focus ? 'var(--lw-accent)' : 'var(--lw-border)'}`,
        borderRadius: 'var(--lw-r-sm)',
        boxShadow: focus ? '0 0 0 3px var(--lw-accent-ring)' : 'none',
        fontFamily: 'inherit',
        fontSize: 'var(--lw-form-input)',
        lineHeight: 1.5,
        color: 'var(--lw-text)',
        resize: 'none',
        outline: 'none',
        ...style,
      }}
    />
  )

  if (!label && !error && !hintText) {
    return (
      <div className={className} style={{ width: '100%', minWidth: 0 }}>
        {control}
      </div>
    )
  }

  return (
    <div
      className={className}
      style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%', minWidth: 0 }}
    >
      {label ? (
        <label htmlFor={tid} style={{ fontSize: 'var(--lw-form-label)', fontWeight: 500, color: 'var(--lw-text)' }}>
          {label}
        </label>
      ) : null}
      {control}
      {error ? <div className="lw-input-field__error">{error}</div> : null}
      {!error && hintText ? <div className="lw-input-field__hint">{hintText}</div> : null}
    </div>
  )
})

// ─────────────────────────────────────────────────────────────
// Badge
// ─────────────────────────────────────────────────────────────
export type PublicBadgeTone =
  | 'success'
  | 'warning'
  | 'warn'
  | 'danger'
  | 'pro'
  | 'default'
  | 'neutral'
  | 'accent'
  | 'ghost'

type InternalBadgeTone = 'neutral' | 'accent' | 'pro' | 'success' | 'warn' | 'danger' | 'ghost'

export type BadgeProps = {
  children: ReactNode
  tone?: PublicBadgeTone
  dot?: boolean
  size?: 'sm' | 'md'
  icon?: string
  style?: CSSProperties
}

export function Badge({ children, tone = 'neutral', dot, icon, size = 'md', style }: BadgeProps) {
  const map: Partial<Record<PublicBadgeTone, InternalBadgeTone>> = {
    default: 'neutral',
    neutral: 'neutral',
    success: 'success',
    warning: 'warn',
    warn: 'warn',
    danger: 'danger',
    pro: 'pro',
    accent: 'accent',
    ghost: 'ghost',
  }
  const internal = map[tone] ?? 'neutral'
  const tones: Record<InternalBadgeTone, { bg: string; color: string; border: string }> = {
    neutral: { bg: 'var(--lw-surface)', color: 'var(--lw-text-2)', border: 'var(--lw-border)' },
    accent: { bg: 'var(--lw-accent-soft)', color: 'var(--lw-accent-hover)', border: 'transparent' },
    pro: {
      bg: 'var(--lw-pro)',
      color: '#FFFBF5',
      border: '1px solid rgba(0, 0, 0, 0.18)',
    },
    success: { bg: 'var(--lw-success-soft)', color: '#15803D', border: 'transparent' },
    warn: { bg: '#FEF3C7', color: '#92400E', border: 'transparent' },
    danger: { bg: 'var(--lw-danger-soft)', color: 'var(--lw-danger)', border: 'transparent' },
    ghost: { bg: 'transparent', color: 'var(--lw-text-3)', border: 'var(--lw-border)' },
  }
  const t = tones[internal]
  const isSm = size === "sm";
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: isSm ? 4 : 5,
      height: isSm ? 18 : 22, padding: isSm ? "0 6px" : "0 8px",
      background: t.bg, color: t.color, border: `1px solid ${t.border}`,
      borderRadius: 999,
      fontSize: isSm ? 10 : 11, fontWeight: 600,
      letterSpacing: ".02em",
      whiteSpace: "nowrap",
      ...style,
    }}>
      {dot && <span style={{ width: 6, height: 6, borderRadius: 999, background: t.color }}/>}
      {icon && <Icon name={icon} size={isSm ? 10 : 12}/>}
      {children}
    </span>
  );
}

export { Logo }

// ─────────────────────────────────────────────────────────────
// Placeholder image
// ─────────────────────────────────────────────────────────────
export function Placeholder({
  ratio = '16:9',
  label,
  dark,
  h,
  w,
  style,
  children,
}: {
  ratio?: string
  h?: number
  dark?: boolean
  label?: string
  style?: CSSProperties
  w?: number | string
  children?: ReactNode
}) {
  const [a, b] = ratio.split(":").map(Number);
  return (
    <div className={dark ? "lw-stripes lw-stripes-dark" : "lw-stripes"}
      style={{
        width: w || "100%",
        height: h || undefined,
        aspectRatio: h ? undefined : `${a}/${b}`,
        borderRadius: "var(--lw-r-sm)",
        position: "relative",
        overflow: "hidden",
        ...style,
      }}>
      {label && <span style={{ position: "absolute", bottom: 8, left: 10 }}>{label}</span>}
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Card
// ─────────────────────────────────────────────────────────────
export function Card({
  children,
  padding = 20,
  style,
  hover: _hover,
  onClick,
  className,
  'data-tour': dataTour,
}: {
  children: ReactNode
  padding?: number
  style?: CSSProperties
  hover?: boolean
  onClick?: () => void
  className?: string
  'data-tour'?: string
}) {
  void _hover
  return (
    <div
      className={className}
      data-tour={dataTour}
      onClick={onClick}
      style={{
        background: 'var(--lw-bg-elev)',
        border: '1px solid var(--lw-border)',
        borderRadius: 'var(--lw-r)',
        padding,
        boxShadow: 'var(--lw-shadow-1)',
        cursor: onClick ? 'pointer' : undefined,
        ...style,
      }}
    >
      {children}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Toggle / Switch
// ─────────────────────────────────────────────────────────────
export function Switch({
  checked,
  onChange,
  label,
  disabled,
  size = 'md',
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label?: string
  disabled?: boolean
  size?: 'sm' | 'md'
}) {
  const w = size === 'sm' ? 30 : 36
  const h = size === 'sm' ? 18 : 22
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 10,
        border: 'none',
        background: 'transparent',
        padding: 0,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <span
        style={{
          width: w,
          height: h,
          borderRadius: 999,
          position: 'relative',
          background: checked ? 'var(--lw-accent)' : '#CBD5E1',
          transition: 'background .15s',
        }}
      >
        <span
          style={{
            position: 'absolute',
            top: 2,
            left: checked ? w - h + 2 : 2,
            width: h - 4,
            height: h - 4,
            background: '#fff',
            borderRadius: 999,
            boxShadow: '0 1px 2px rgba(15,23,42,.2)',
            transition: 'left .15s',
          }}
        />
      </span>
      {label ? <span style={{ fontSize: 13, color: 'var(--lw-text-2)' }}>{label}</span> : null}
    </button>
  )
}

// ─────────────────────────────────────────────────────────────
// Segmented control
// ─────────────────────────────────────────────────────────────
export type SegmentedOption = { value: string; label: ReactNode }

export function Segmented({
  options,
  value,
  size = 'md',
  style,
  onChange,
}: {
  value: string
  onChange?: (v: string) => void
  options: Array<string | SegmentedOption>
  size?: 'sm' | 'md'
  style?: CSSProperties
}) {
  const h = size === 'sm' ? 30 : 34
  return (
    <div style={{
      display: "inline-flex", padding: 3, gap: 2,
      background: "var(--lw-surface)", borderRadius: "var(--lw-r-sm)",
      ...style,
    }}>
      {options.map((o) => {
        const v = typeof o === "string" ? o : o.value
        const active = v === value
        const lbl = typeof o === "string" ? o : o.label
        return (
          <span
            key={v}
            role="button"
            tabIndex={0}
            onClick={() => onChange?.(v)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onChange?.(v);
              }
            }}
            style={{
              height: h, padding: "0 12px",
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              borderRadius: 6,
              fontSize: 13, fontWeight: 500,
              background: active ? "var(--lw-bg-elev)" : "transparent",
              color: active ? "var(--lw-text)" : "var(--lw-text-3)",
              boxShadow: active ? "0 1px 2px rgba(15,23,42,.08)" : "none",
              border: active ? "1px solid var(--lw-border)" : "1px solid transparent",
              cursor: onChange ? "pointer" : "default",
            }}>{lbl}</span>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Mini map (SVG fake)
// ─────────────────────────────────────────────────────────────
export function MiniMap({
  h = 140,
  pin = true,
  style,
  address,
  lat,
  lng,
}: {
  h?: number
  pin?: boolean
  style?: CSSProperties
  address?: string
  lat?: number
  lng?: number
}) {
  const hasReal =
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    Number.isFinite(lat) &&
    Number.isFinite(lng)

  if (hasReal) {
    /* bbox estrecho ≈ manzana / calle (coherente con zoom ~17–18 en plantilla) */
    const d = 0.0028
    const west = lng - d
    const south = lat - d
    const east = lng + d
    const north = lat + d
    const bbox = `${west},${south},${east},${north}`
    const src =
      'https://www.openstreetmap.org/export/embed.html?bbox=' +
      encodeURIComponent(bbox) +
      '&layer=mapnik&marker=' +
      encodeURIComponent(`${lat},${lng}`)
    return (
      <div
        style={{
          height: h,
          borderRadius: 'var(--lw-r-sm)',
          overflow: 'hidden',
          position: 'relative',
          background: '#E8EEF4',
          border: '1px solid var(--lw-border)',
          ...style,
        }}
      >
        <iframe title="Mapa" src={src} loading="lazy" referrerPolicy="no-referrer-when-downgrade" style={{ border: 'none', width: '100%', height: '100%', display: 'block' }} />
        {address ? (
          <div
            className="lw-small"
            style={{
              position: 'absolute',
              left: 8,
              right: 8,
              bottom: 6,
              background: 'rgba(255,255,255,.92)',
              borderRadius: 6,
              padding: '4px 8px',
              border: '1px solid var(--lw-border)',
              maxHeight: 40,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {address}
          </div>
        ) : null}
      </div>
    )
  }

  return (
    <div style={{
      height: h, borderRadius: "var(--lw-r-sm)", overflow: "hidden",
      position: "relative",
      background: "#E8EEF4",
      border: "1px solid var(--lw-border)",
      ...style,
    }}>
      <svg viewBox="0 0 400 200" preserveAspectRatio="xMidYMid slice"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
        <rect width="400" height="200" fill="#E8EEF4"/>
        {/* roads */}
        <path d="M0 80 L400 60" stroke="#fff" strokeWidth="6"/>
        <path d="M0 80 L400 60" stroke="#CBD5E1" strokeWidth="1"/>
        <path d="M150 0 L130 200" stroke="#fff" strokeWidth="5"/>
        <path d="M150 0 L130 200" stroke="#CBD5E1" strokeWidth="1"/>
        <path d="M0 150 L400 130" stroke="#fff" strokeWidth="4"/>
        <path d="M0 150 L400 130" stroke="#CBD5E1" strokeWidth="1"/>
        <path d="M260 0 L240 200" stroke="#fff" strokeWidth="3"/>
        {/* blocks */}
        <rect x="20" y="90" width="80" height="50" fill="#F1F5F9"/>
        <rect x="160" y="20" width="70" height="30" fill="#F1F5F9"/>
        <rect x="170" y="90" width="55" height="35" fill="#F1F5F9"/>
        <rect x="270" y="70" width="100" height="50" fill="#F1F5F9"/>
        <rect x="280" y="140" width="80" height="50" fill="#F1F5F9"/>
        {/* park */}
        <rect x="20" y="20" width="100" height="55" fill="#DCEAD8"/>
      </svg>
      {pin ? (
        <div style={{
          position: "absolute", left: "50%", top: "48%", transform: "translate(-50%, -100%)",
        }}>
          <svg width="28" height="36" viewBox="0 0 28 36">
            <path d="M14 1c7 0 12 5.4 12 12.2 0 8-12 21.8-12 21.8S2 21.2 2 13.2C2 6.4 7 1 14 1z"
              fill="var(--lw-accent)" stroke="#fff" strokeWidth="2"/>
            <circle cx="14" cy="13" r="4" fill="#fff"/>
          </svg>
        </div>
      ) : null}
      {address ? (
        <div
          className="lw-small"
          style={{
            position: 'absolute',
            left: 8,
            right: 8,
            bottom: 6,
            background: 'rgba(255,255,255,.92)',
            borderRadius: 6,
            padding: '4px 8px',
            border: '1px solid var(--lw-border)',
          }}
        >
          {address}
        </div>
      ) : null}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Browser chrome (mini) — for landing screenshots, public-page mocks
// ─────────────────────────────────────────────────────────────
export function BrowserChrome({
  url,
  children,
  style,
}: {
  children: ReactNode
  url?: string
  style?: CSSProperties
}) {
  return (
    <div style={{
      borderRadius: "var(--lw-r)", overflow: "hidden",
      border: "1px solid var(--lw-border)",
      boxShadow: "var(--lw-shadow-2)",
      background: "var(--lw-bg-elev)",
      display: "flex",
      flexDirection: "column",
      minHeight: 0,
      ...style,
    }}>
      <div style={{
        height: 32, background: "#F1F5F9",
        borderBottom: "1px solid var(--lw-border)",
        display: "flex", alignItems: "center", padding: "0 10px", gap: 6,
      }}>
        <span style={{ width: 9, height: 9, borderRadius: 999, background: "#FCA5A5" }}/>
        <span style={{ width: 9, height: 9, borderRadius: 999, background: "#FCD34D" }}/>
        <span style={{ width: 9, height: 9, borderRadius: 999, background: "#86EFAC" }}/>
        {url && (
          <div style={{
            flex: 1, marginLeft: 8, height: 20,
            background: "#fff", borderRadius: 4,
            display: "flex", alignItems: "center", padding: "0 8px", gap: 6,
            border: "1px solid var(--lw-border)",
          }}>
            <Icon name="lock" size={10} color="var(--lw-text-4)"/>
            <span className="lw-mono" style={{ fontSize: 10, color: "var(--lw-text-3)" }}>{url}</span>
          </div>
        )}
      </div>
      <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>{children}</div>
    </div>
  );
}

