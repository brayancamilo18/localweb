import { useEffect, useId, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Btn, Icon } from '../../../components/primitives/primitives'
import type { TemplateChangePreview } from '../../../api/dashboard'
import { getColorDisplayName } from '../../../lib/hexColorName'
import {
  BrandColorFooterHint,
  BrandColorLivePreview,
  BrandColorLockedBlock,
  BrandColorPaletteGrid,
  BrandColorPanelShell,
} from '../../shared/BrandColorPanel'
import { brandColorTokens } from '../../shared/brandColorTokens'
import './templateChangeConfirmModal.css'

export type BrandColorChoice = string | null | 'omit'

type Props = {
  open: boolean
  onClose: () => void
  preview: TemplateChangePreview | null
  onConfirm: (brandColorChoice: BrandColorChoice) => void
  isPending?: boolean
}

type ChoiceMode = 'suggested' | 'palette' | 'default'

const T = brandColorTokens

function ColorCompareRow({
  current,
  suggested,
  compact = false,
}: {
  current: string
  suggested: string
  compact?: boolean
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: compact ? 'flex-start' : 'center',
        gap: compact ? 12 : 16,
        marginBottom: compact ? 0 : 20,
        flexWrap: 'wrap',
      }}
    >
      <ColorCompareTile label="Color actual" hex={current} compact={compact} />
      <Icon name="arrowRight" size={compact ? 16 : 20} color={T.ink60} />
      <ColorCompareTile label="Sugerido" hex={suggested} compact={compact} />
    </div>
  )
}

function ColorCompareTile({ label, hex, compact = false }: { label: string; hex: string; compact?: boolean }) {
  return (
    <div style={{ textAlign: 'center', flex: compact ? '0 0 auto' : '1 1 120px', minWidth: compact ? 88 : 120 }}>
      <div
        style={{
          fontSize: 10,
          fontWeight: 600,
          color: T.ink60,
          marginBottom: 8,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
        }}
      >
        {label}
      </div>
      <div
        aria-hidden
        style={{
          width: compact ? 44 : 56,
          height: compact ? 44 : 56,
          borderRadius: '50%',
          margin: '0 auto 8px',
          background: hex,
          boxShadow: `inset 0 0 0 1px var(--lw-border), 0 6px 14px color-mix(in srgb, ${hex} 28%, transparent)`,
        }}
      />
      <div style={{ fontSize: 13, fontWeight: 600, color: T.ink }}>{getColorDisplayName(hex)}</div>
    </div>
  )
}

function ChoiceOption({
  id,
  name,
  checked,
  onSelect,
  title,
  detail,
  children,
  compact = false,
}: {
  id: string
  name: string
  checked: boolean
  onSelect: () => void
  title: string
  detail: string
  children?: ReactNode
  compact?: boolean
}) {
  return (
    <div
      style={{
        borderRadius: compact ? 14 : 16,
        padding: compact ? '12px 14px' : 16,
        background: checked ? '#fff' : 'transparent',
        boxShadow: checked ? `inset 0 0 0 1.5px ${T.verde}` : `inset 0 0 0 1px var(--lw-border)`,
      }}
    >
      <label
        htmlFor={id}
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 12,
          cursor: 'pointer',
          margin: 0,
        }}
      >
        <input
          type="radio"
          id={id}
          name={name}
          checked={checked}
          onChange={onSelect}
          style={{ marginTop: 4, accentColor: T.verde }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: T.ink }}>{title}</div>
          <div style={{ fontSize: 12, marginTop: 2, color: T.ink99 }}>{detail}</div>
        </div>
      </label>
      {children}
    </div>
  )
}

function CoverTrimNotice({ excess, newSlots, currentCount }: { excess: number; newSlots: number; currentCount: number }) {
  const slotsLabel = newSlots === 1 ? '1 foto en la portada' : `${newSlots} fotos en la portada`
  const photosWord = excess === 1 ? 'foto' : 'fotos'
  return (
    <div
      role="alert"
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
        padding: '12px 14px',
        marginBottom: 16,
        borderRadius: 12,
        background: '#FFF7ED',
        border: '1px solid #FDBA74',
      }}
    >
      <div style={{ flexShrink: 0, marginTop: 2 }}>
        <Icon name="info" size={18} color="#9A3412" />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#7C2D12', marginBottom: 4 }}>
          Esta plantilla solo admite {slotsLabel}
        </div>
        <div style={{ fontSize: 12.5, lineHeight: 1.5, color: '#9A3412' }}>
          Tienes {currentCount} fotos de portada. Si confirmas el cambio, se eliminarán las últimas {excess} {photosWord} y se mantendrá solo la primera. Esta acción no se puede deshacer.
        </div>
      </div>
    </div>
  )
}

export default function TemplateChangeConfirmModal({
  open,
  onClose,
  preview,
  onConfirm,
  isPending = false,
}: Props) {
  const titleId = useId()
  const suggestedId = useId()
  const paletteId = useId()
  const defaultId = useId()
  const [choiceMode, setChoiceMode] = useState<ChoiceMode>('suggested')
  const [paletteChoice, setPaletteChoice] = useState<string | null>(null)

  const brand = preview?.brand_color
  const templateName = preview?.template?.name ?? 'nueva plantilla'
  const palette = brand?.new_palette ?? []

  const covers = preview?.covers
  const showCoverTrimNotice = Boolean(covers?.will_trim)

  useEffect(() => {
    if (!open || !brand) return
    setChoiceMode('suggested')
    setPaletteChoice(brand.suggested_color)
  }, [open, brand?.suggested_color, brand?.current_color])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isPending) onClose()
    }
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, onClose, isPending])

  if (!open) return null

  const title = preview?.template ? `Cambiar plantilla a «${templateName}»` : 'Cambiar plantilla'

  const handleConfirm = () => {
    if (!brand) {
      onConfirm('omit')
      return
    }
    if (brand.current_in_new || !brand.new_template_supported) {
      onConfirm('omit')
      return
    }
    if (choiceMode === 'suggested') {
      onConfirm(brand.suggested_color)
      return
    }
    if (choiceMode === 'default') {
      onConfirm(null)
      return
    }
    onConfirm(paletteChoice ?? brand.suggested_color)
  }

  const selectedHex =
    choiceMode === 'suggested'
      ? brand?.suggested_color ?? '#000000'
      : choiceMode === 'default'
        ? brand?.new_default ?? '#000000'
        : paletteChoice ?? brand?.suggested_color ?? '#000000'

  const selectedIsDefault =
    choiceMode === 'default' || selectedHex.toLowerCase() === (brand?.new_default ?? '').toLowerCase()

  const showRichPicker = Boolean(
    brand?.has_current && !brand.current_in_new && brand.new_template_supported,
  )

  let body: ReactNode

  if (preview === null) {
    body = (
      <div>
        <h2 id={titleId} className="lw-tpl-change-modal__title">
          {title}
        </h2>
        <p className="lw-tpl-change-modal__intro">Calculando opciones de color…</p>
      </div>
    )
  } else if (!brand?.has_current) {
    body = (
      <div>
        <h2 id={titleId} className="lw-tpl-change-modal__title">
          {title}
        </h2>
        <p className="lw-tpl-change-modal__intro">¿Confirmas el cambio de plantilla a «{templateName}»?</p>
      </div>
    )
  } else if (brand.current_in_new) {
    body = (
      <div>
        <h2 id={titleId} className="lw-tpl-change-modal__title">
          {title}
        </h2>
        <p className="lw-tpl-change-modal__intro">
          Tu color de marca actual ({getColorDisplayName(brand.current_color)}) también está disponible en esta
          plantilla. Se mantendrá al cambiar.
        </p>
      </div>
    )
  } else if (!brand.new_template_supported) {
    body = (
      <div className="lw-tpl-change-modal__body lw-tpl-change-modal__body--locked">
        <h2 id={titleId} className="lw-tpl-change-modal__title">
          {title}
        </h2>
        <BrandColorLockedBlock
          palette={palette.length ? palette : [brand.current_color]}
          templateName={templateName}
          compact
        />
        <p className="lw-tpl-change-modal__saved-note">
          Tu color <strong>{getColorDisplayName(brand.current_color)}</strong> quedará guardado por si vuelves a
          una plantilla compatible.
        </p>
      </div>
    )
  } else {
    body = (
      <div style={{ padding: '4px 0' }}>
        <h2 id={titleId} style={{ margin: '0 0 6px', fontSize: 20, fontWeight: 600, color: T.ink }}>
          {title}
        </h2>
        <p style={{ margin: '0 0 16px', fontSize: 14, lineHeight: 1.45, color: T.ink99 }}>
          Tu color de marca actual no está disponible en esta plantilla. Elige cómo continuar:
        </p>

        <div className="lw-tpl-change-modal__rich-grid">
          <div className="lw-tpl-change-modal__rich-visual">
            <ColorCompareRow current={brand.current_color} suggested={brand.suggested_color} compact />
            <BrandColorLivePreview hex={selectedHex} isDefault={selectedIsDefault} showActions={false} compact />
          </div>

          <div className="lw-tpl-change-modal__rich-choices">
            <div style={{ display: 'grid', gap: 10 }}>
              <ChoiceOption
                id={suggestedId}
                name="brand-choice"
                checked={choiceMode === 'suggested'}
                onSelect={() => setChoiceMode('suggested')}
                title="Usar el color sugerido"
                detail={getColorDisplayName(brand.suggested_color)}
                compact
              />

              <ChoiceOption
                id={paletteId}
                name="brand-choice"
                checked={choiceMode === 'palette'}
                onSelect={() => setChoiceMode('palette')}
                title="Elegir otro color de la nueva paleta"
                detail={
                  choiceMode === 'palette'
                    ? getColorDisplayName(paletteChoice ?? brand.suggested_color)
                    : `${palette.length} colores disponibles`
                }
                compact
              >
                {choiceMode === 'palette' ? (
                  <div style={{ marginTop: 12, paddingLeft: 4 }}>
                    <BrandColorPaletteGrid
                      palette={palette}
                      value={paletteChoice ?? brand.suggested_color}
                      defaultColor={brand.new_default}
                      onChange={setPaletteChoice}
                    />
                  </div>
                ) : null}
              </ChoiceOption>

              <ChoiceOption
                id={defaultId}
                name="brand-choice"
                checked={choiceMode === 'default'}
                onSelect={() => setChoiceMode('default')}
                title="Usar el color por defecto de la plantilla"
                detail={getColorDisplayName(brand.new_default)}
                compact
              />
            </div>
          </div>
        </div>

        <p style={{ margin: '14px 0 0', fontSize: 12, color: T.ink60, lineHeight: 1.5 }}>
          Tu color <strong style={{ color: T.ink }}>{getColorDisplayName(brand.current_color)}</strong> quedará
          guardado por si vuelves a la plantilla anterior.
        </p>
      </div>
    )
  }

  const panelInner = (
    <>
      <button
        type="button"
        onClick={onClose}
        disabled={isPending}
        aria-label="Cerrar"
        style={{
          position: 'absolute',
          top: 20,
          right: 20,
          zIndex: 2,
          padding: 8,
          border: 'none',
          borderRadius: '50%',
          background: 'transparent',
          cursor: isPending ? 'not-allowed' : 'pointer',
          color: T.ink60,
        }}
      >
        <Icon name="x" size={20} />
      </button>

      <div className="lw-tpl-change-modal__content">
        {showCoverTrimNotice && covers ? (
          <CoverTrimNotice
            excess={covers.excess}
            newSlots={covers.new_slots}
            currentCount={covers.current_count}
          />
        ) : null}
        {body}
      </div>

      {showRichPicker ? <BrandColorFooterHint /> : null}

      <div
        className={`lw-tpl-change-modal__footer${showRichPicker ? '' : ' lw-tpl-change-modal__footer--compact'}`}
      >
        <button
          type="button"
          onClick={onClose}
          disabled={isPending}
          style={{
            padding: '10px 20px',
            fontSize: 14,
            fontWeight: 500,
            border: 'none',
            borderRadius: 12,
            background: 'transparent',
            color: T.ink99,
            cursor: isPending ? 'not-allowed' : 'pointer',
          }}
        >
          Cancelar
        </button>
        <Btn
          type="button"
          kind="primary"
          loading={isPending}
          disabled={isPending || preview === null}
          onClick={handleConfirm}
        >
          Cambiar plantilla
        </Btn>
      </div>
    </>
  )

  return createPortal(
    <div
      className="lw-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onMouseDown={(e) => {
        if (!isPending && e.target === e.currentTarget) onClose()
      }}
      style={{
        background: 'color-mix(in srgb, var(--lw-text) 40%, transparent)',
        backdropFilter: 'blur(8px)',
      }}
    >
      <div
        className={`lw-tpl-change-modal${showRichPicker ? ' lw-tpl-change-modal--wide' : ''}`}
      >
        <BrandColorPanelShell className="lw-tpl-change-modal__panel">
          {panelInner}
        </BrandColorPanelShell>
      </div>
    </div>,
    document.body,
  )
}
