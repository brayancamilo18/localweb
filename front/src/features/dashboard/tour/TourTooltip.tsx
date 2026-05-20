import { useEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties } from 'react'

import { Btn, Icon } from '../../../components/primitives/primitives'
import { useBreakpoint } from './useBreakpoint'
import type { AnchorRect, TourSide, TourStep } from './types'
import './tour.css'

interface TourTooltipProps {
  step: TourStep
  /** Número de paso 1-indexed (para "Paso X de Y"). */
  index: number
  total: number
  rect: AnchorRect | null
  onNext: () => void
  onPrev: () => void
  onSkip: () => void
  isFirst: boolean
  isLast: boolean
  isLocked: boolean
  isPro: boolean
  proOnlyMode: boolean
}

function resolveMicrocopy(step: TourStep, isLocked: boolean, isPro: boolean): string | undefined {
  if (isLocked) return step.microcopyFree ?? step.microcopy
  return isPro ? step.microcopy : (step.microcopyFree ?? step.microcopy)
}

const TOOLTIP_W = 320
const TOOLTIP_GAP = 14
const VIEWPORT_MARGIN = 12

interface Position {
  side: TourSide
  style: CSSProperties
}

function flipSide(side: TourSide): TourSide {
  switch (side) {
    case 'top':
      return 'bottom'
    case 'bottom':
      return 'top'
    case 'left':
      return 'right'
    case 'right':
      return 'left'
    default:
      return 'center'
  }
}

function computeDesktopPosition(
  rect: AnchorRect,
  preferred: TourSide,
  tooltipW: number,
  tooltipH: number,
  vw: number,
  vh: number,
): Position {
  const trySide = (side: TourSide): { fits: boolean; style: CSSProperties } => {
    let top = 0
    let left = 0
    switch (side) {
      case 'right':
        left = rect.left + rect.width + TOOLTIP_GAP
        top = rect.top + rect.height / 2 - 28
        break
      case 'left':
        left = rect.left - tooltipW - TOOLTIP_GAP
        top = rect.top + rect.height / 2 - 28
        break
      case 'bottom':
        left = rect.left + rect.width / 2 - tooltipW / 2
        top = rect.top + rect.height + TOOLTIP_GAP
        break
      case 'top':
        left = rect.left + rect.width / 2 - tooltipW / 2
        top = rect.top - tooltipH - TOOLTIP_GAP
        break
      default:
        left = (vw - tooltipW) / 2
        top = (vh - tooltipH) / 2
    }
    const fits =
      left >= VIEWPORT_MARGIN &&
      top >= VIEWPORT_MARGIN &&
      left + tooltipW <= vw - VIEWPORT_MARGIN &&
      top + tooltipH <= vh - VIEWPORT_MARGIN
    // Clampeamos siempre para no salir nunca de pantalla aunque "no quepa".
    const clampedLeft = Math.max(VIEWPORT_MARGIN, Math.min(left, vw - tooltipW - VIEWPORT_MARGIN))
    const clampedTop = Math.max(VIEWPORT_MARGIN, Math.min(top, vh - tooltipH - VIEWPORT_MARGIN))
    return { fits, style: { top: clampedTop, left: clampedLeft } }
  }

  const primary = trySide(preferred)
  if (primary.fits) return { side: preferred, style: primary.style }
  const flipped = trySide(flipSide(preferred))
  if (flipped.fits) return { side: flipSide(preferred), style: flipped.style }
  return { side: preferred, style: primary.style }
}

/** Flecha hacia el ancla: lado opuesto al placement del tooltip (p. ej. tooltip a la derecha → flecha a la izquierda). */
function arrowTowardAnchor(tooltipSide: TourSide): TourSide {
  return flipSide(tooltipSide)
}

function arrowOffsetTop(
  toward: TourSide,
  rect: AnchorRect,
  tooltipTop: number,
  tooltipH: number,
): number | undefined {
  if (toward !== 'left' && toward !== 'right') return undefined
  const anchorCy = rect.top + rect.height / 2
  const min = 22
  const max = Math.max(min, tooltipH - 28)
  return Math.min(max, Math.max(min, anchorCy - tooltipTop - 6))
}

function Arrow({ side, offsetTop }: { side: TourSide; offsetTop?: number }) {
  if (side === 'center') return null
  const s = 12
  const triangles: Record<Exclude<TourSide, 'center'>, string> = {
    left: 'polygon(100% 0, 0 50%, 100% 100%)',
    right: 'polygon(0 0, 100% 50%, 0 100%)',
    top: 'polygon(0 100%, 50% 0, 100% 100%)',
    bottom: 'polygon(0 0, 50% 100%, 100% 0)',
  }
  const pos: Record<Exclude<TourSide, 'center'>, CSSProperties> = {
    left: { left: -s + 1, top: offsetTop ?? 22 },
    right: { right: -s + 1, top: offsetTop ?? 22 },
    top: { top: -s + 1, left: '50%', marginLeft: -s / 2 },
    bottom: { bottom: -s + 1, left: '50%', marginLeft: -s / 2 },
  }
  return (
    <span aria-hidden className="lw-tour-arrow" style={{ width: s, height: s, ...pos[side] }}>
      <span style={{ display: 'block', width: s, height: s, background: '#fff', clipPath: triangles[side] }} />
    </span>
  )
}

function ProgressBar({ index, total }: { index: number; total: number }) {
  return (
    <div className="lw-tour-progress" aria-hidden>
      {Array.from({ length: total }).map((_, i) => {
        const k = i + 1
        const klass =
          k < index
            ? 'lw-tour-progress__seg lw-tour-progress__seg--done'
            : k === index
              ? 'lw-tour-progress__seg lw-tour-progress__seg--cur'
              : 'lw-tour-progress__seg'
        return <span key={i} className={klass} />
      })}
    </div>
  )
}

export function TourTooltip(props: TourTooltipProps) {
  const { step, index, total, rect, onNext, onPrev, onSkip, isFirst, isLast, isLocked, isPro, proOnlyMode } =
    props
  const bp = useBreakpoint()

  const tooltipRef = useRef<HTMLDivElement | null>(null)
  const [measuredH, setMeasuredH] = useState<number>(180)

  useEffect(() => {
    const el = tooltipRef.current
    if (el !== null) setMeasuredH(el.offsetHeight)
  }, [step.id, isLocked, isPro, proOnlyMode, bp])

  const isMobile = bp === 'mobile'
  const isTablet = bp === 'tablet'

  const position: Position = useMemo(() => {
    if (isMobile) return { side: 'center', style: {} }
    if (isTablet || rect === null) {
      return {
        side: 'center',
        style: { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' },
      }
    }
    return computeDesktopPosition(rect, step.side, TOOLTIP_W, measuredH, window.innerWidth, window.innerHeight)
  }, [isMobile, isTablet, rect, step.side, measuredH])

  const description =
    proOnlyMode && step.descriptionPro !== undefined
      ? step.descriptionPro
      : isLocked && step.descriptionFree !== undefined
        ? step.descriptionFree
        : step.description
  const microcopy = !isLocked ? resolveMicrocopy(step, isLocked, isPro) : undefined

  const arrowSide = arrowTowardAnchor(position.side)
  const tooltipTop =
    typeof position.style.top === 'number' ? position.style.top : undefined
  const arrowTop =
    rect !== null && tooltipTop !== undefined
      ? arrowOffsetTop(arrowSide, rect, tooltipTop, measuredH)
      : undefined

  // -------- móvil: bottom-sheet --------
  if (isMobile) {
    return (
      <div className="lw-tour-sheet lw-tour-sheet--in" role="tooltip" aria-live="polite">
        <span aria-hidden className="lw-tour-drag-handle" />
        <div className="lw-tour-tooltip__indicator">
          <ProgressBar index={index} total={total} />
          <span className="lw-tour-step-text">
            Paso {index} de {total}
          </span>
        </div>
        <TooltipHeader step={step} isLocked={isLocked} />
        <p className="lw-tour-tooltip__desc">{description}</p>
        {microcopy !== undefined && (
          <div className="lw-tour-tip">
            <b>Tip · </b>
            {microcopy}
          </div>
        )}
        {isLocked && <LockedBanner />}
        <div className="lw-tour-sheet__actions">
          <Btn
            kind="outline"
            size="md"
            icon="chevronLeft"
            disabled={isFirst}
            onClick={onPrev}
            style={{ flex: 1, justifyContent: 'center', height: 46 }}
          >
            Anterior
          </Btn>
          <Btn
            kind="primary"
            size="md"
            iconRight={isLast ? 'check' : 'chevronRight'}
            onClick={onNext}
            style={{ flex: 1, justifyContent: 'center', height: 46 }}
          >
            {isLast ? 'Terminar' : 'Siguiente'}
          </Btn>
        </div>
        <Btn
          kind="ghost"
          size="sm"
          onClick={onSkip}
          style={{ width: '100%', marginTop: 6, height: 40, justifyContent: 'center' }}
        >
          Saltar tour
        </Btn>
      </div>
    )
  }

  // -------- desktop / tablet: popover --------
  return (
    <div
      ref={tooltipRef}
      className="lw-tour-tooltip lw-tour-tooltip--in"
      role="tooltip"
      aria-live="polite"
      style={{ width: TOOLTIP_W, ...position.style }}
    >
      <button
        type="button"
        className="lw-tour-close"
        aria-label="Cerrar tour"
        onClick={onSkip}
      >
        <Icon name="x" size={16} />
      </button>
      <div className="lw-tour-tooltip__indicator">
        <ProgressBar index={index} total={total} />
      </div>
      <TooltipHeader step={step} isLocked={isLocked} />
      <p className="lw-tour-tooltip__desc">{description}</p>
      {microcopy !== undefined && (
        <div className="lw-tour-tip">
          <b>Tip · </b>
          {microcopy}
        </div>
      )}
      {isLocked && <LockedBanner />}
      <div className="lw-tour-tooltip__actions">
        <Btn kind="ghost" size="sm" onClick={onSkip}>
          Saltar
        </Btn>
        <div className="lw-tour-tooltip__actions-right">
          {!isFirst && (
            <Btn kind="outline" size="sm" icon="chevronLeft" onClick={onPrev}>
              Anterior
            </Btn>
          )}
          <Btn kind="primary" size="sm" iconRight={isLast ? 'check' : 'chevronRight'} onClick={onNext}>
            {isLast ? 'Terminar' : 'Siguiente'}
          </Btn>
        </div>
      </div>
      <Arrow side={arrowSide} offsetTop={arrowTop} />
    </div>
  )
}

function TooltipHeader({ step, isLocked }: { step: TourStep; isLocked: boolean }) {
  return (
    <div className="lw-tour-tooltip__header">
      <span className="lw-tour-tooltip__icon">
        <Icon name={step.icon} size={18} color="var(--lw-accent)" />
      </span>
      <h4 className="lw-tour-tooltip__title">{step.title}</h4>
      {isLocked && (
        <span className="lw-tour-chip lw-tour-chip--pro">
          <Icon name="lock" size={11} /> Pro
        </span>
      )}
    </div>
  )
}

function LockedBanner() {
  return (
    <div className="lw-tour-locked">
      <Icon name="lock" size={12} color="var(--lw-accent)" />
      Disponible con el plan Pro. Mira lo que incluye o continúa con el tour.
    </div>
  )
}
