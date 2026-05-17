import { useEffect, useRef, useState, type CSSProperties } from 'react'

export type CookiePreferencesButtonProps = {
  onClick: () => void
  visible: boolean
  style?: CSSProperties
}

export default function CookiePreferencesButton({
  onClick,
  visible,
  style,
}: CookiePreferencesButtonProps) {
  const [mounted, setMounted] = useState(visible)
  const [animatedIn, setAnimatedIn] = useState(false)
  const [hover, setHover] = useState(false)
  const [pressed, setPressed] = useState(false)
  const [focusVisible, setFocusVisible] = useState(false)
  const [tooltipVisible, setTooltipVisible] = useState(false)
  const [tooltipShown, setTooltipShown] = useState(false)
  const tooltipTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const exitTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (visible) {
      if (exitTimer.current) clearTimeout(exitTimer.current)
      setMounted(true)
      const raf = requestAnimationFrame(() => setAnimatedIn(true))
      return () => cancelAnimationFrame(raf)
    }
    setAnimatedIn(false)
    exitTimer.current = setTimeout(() => setMounted(false), 160)
    return () => {
      if (exitTimer.current) clearTimeout(exitTimer.current)
    }
  }, [visible])

  useEffect(() => {
    return () => {
      if (tooltipTimer.current) clearTimeout(tooltipTimer.current)
      if (exitTimer.current) clearTimeout(exitTimer.current)
    }
  }, [])

  if (!mounted) return null

  const startTooltip = () => {
    if (tooltipTimer.current) clearTimeout(tooltipTimer.current)
    tooltipTimer.current = setTimeout(() => {
      setTooltipVisible(true)
      requestAnimationFrame(() => setTooltipShown(true))
    }, 600)
  }

  const cancelTooltip = () => {
    if (tooltipTimer.current) clearTimeout(tooltipTimer.current)
    setTooltipShown(false)
    setTooltipVisible(false)
  }

  const baseBg = hover ? 'rgba(255,255,255,0.97)' : 'rgba(255,255,255,0.88)'
  const baseShadow = pressed
    ? '0 1px 4px rgba(0,0,0,0.10)'
    : hover
      ? '0 4px 12px rgba(0,0,0,0.14)'
      : '0 2px 8px rgba(0,0,0,0.10), 0 1px 2px rgba(0,0,0,0.06)'

  let scale = 1
  if (!animatedIn) scale = 0.6
  else if (pressed) scale = 0.93
  else if (hover) scale = 1.1

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 20,
        right: 20,
        zIndex: 9998,
        ...style,
      }}
    >
      <button
        type="button"
        aria-label="Gestionar preferencias de cookies"
        title="Gestionar cookies"
        onClick={onClick}
        onMouseEnter={() => {
          setHover(true)
          startTooltip()
        }}
        onMouseLeave={() => {
          setHover(false)
          setPressed(false)
          cancelTooltip()
        }}
        onMouseDown={() => setPressed(true)}
        onMouseUp={() => setPressed(false)}
        onFocus={(e) => {
          if (e.target.matches(':focus-visible')) setFocusVisible(true)
        }}
        onBlur={() => setFocusVisible(false)}
        style={{
          position: 'relative',
          width: 32,
          height: 32,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 0,
          fontSize: 16,
          lineHeight: 1,
          background: baseBg,
          WebkitBackdropFilter: 'blur(10px) saturate(180%)',
          backdropFilter: 'blur(10px) saturate(180%)',
          border: '1px solid rgba(0,0,0,0.09)',
          borderRadius: 999,
          boxShadow: baseShadow,
          cursor: 'pointer',
          opacity: animatedIn ? 1 : 0,
          transform: `scale(${scale})`,
          transition: animatedIn
            ? 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.15s ease, background 0.15s ease, opacity 0.2s ease'
            : 'transform 0.15s ease-in, opacity 0.15s ease-in',
          outline: focusVisible ? '2px solid #0F6E56' : 'none',
          outlineOffset: focusVisible ? 3 : 0,
          fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        }}
      >
        <span aria-hidden="true">🍪</span>
        {tooltipVisible && (
          <span
            role="tooltip"
            style={{
              position: 'absolute',
              bottom: 'calc(100% + 8px)',
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'rgba(11, 31, 26, 0.88)',
              WebkitBackdropFilter: 'blur(8px)',
              backdropFilter: 'blur(8px)',
              color: '#ffffff',
              fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
              fontSize: 11,
              fontWeight: 500,
              padding: '4px 10px',
              borderRadius: 6,
              whiteSpace: 'nowrap',
              pointerEvents: 'none',
              opacity: tooltipShown ? 1 : 0,
              transition: 'opacity 0.12s ease',
              zIndex: 1,
            }}
          >
            Gestionar cookies
            <span
              style={{
                position: 'absolute',
                top: '100%',
                left: '50%',
                transform: 'translateX(-50%)',
                width: 0,
                height: 0,
                borderLeft: '5px solid transparent',
                borderRight: '5px solid transparent',
                borderTop: '5px solid rgba(11, 31, 26, 0.88)',
              }}
            />
          </span>
        )}
      </button>
    </div>
  )
}
