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

function ColorCompareRow({ current, suggested }: { current: string; suggested: string }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        marginBottom: 20,
        flexWrap: 'wrap',
      }}
    >
      <ColorCompareTile label="Color actual" hex={current} />
      <Icon name="arrowRight" size={20} color={T.ink60} />
      <ColorCompareTile label="Sugerido" hex={suggested} />
    </div>
  )
}

function ColorCompareTile({ label, hex }: { label: string; hex: string }) {
  return (
    <div style={{ textAlign: 'center', flex: '1 1 120px', minWidth: 120 }}>
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
          width: 56,
          height: 56,
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
}: {
  id: string
  name: string
  checked: boolean
  onSelect: () => void
  title: string
  detail: string
  children?: ReactNode
}) {
  return (
    <div
      style={{
        borderRadius: 16,
        padding: 16,
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
      <div style={{ padding: '8px 0' }}>
        <h2 id={titleId} style={{ margin: '0 0 12px', fontSize: 20, fontWeight: 600, color: T.ink }}>
          {title}
        </h2>
        <p style={{ margin: 0, fontSize: 14, color: T.ink99 }}>Calculando opciones de color…</p>
      </div>
    )
  } else if (!brand?.has_current) {
    body = (
      <div style={{ padding: '8px 0' }}>
        <h2 id={titleId} style={{ margin: '0 0 12px', fontSize: 20, fontWeight: 600, color: T.ink }}>
          {title}
        </h2>
        <p style={{ margin: 0, fontSize: 14, color: T.ink }}>¿Confirmas el cambio de plantilla a «{templateName}»?</p>
      </div>
    )
  } else if (brand.current_in_new) {
    body = (
      <div style={{ padding: '8px 0' }}>
        <h2 id={titleId} style={{ margin: '0 0 12px', fontSize: 20, fontWeight: 600, color: T.ink }}>
          {title}
        </h2>
        <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5, color: T.ink99 }}>
          Tu color de marca actual ({getColorDisplayName(brand.current_color)}) también está disponible en esta
          plantilla. Se mantendrá al cambiar.
        </p>
      </div>
    )
  } else if (!brand.new_template_supported) {
    body = (
      <div style={{ padding: '8px 0' }}>
        <h2 id={titleId} style={{ margin: '0 0 16px', fontSize: 20, fontWeight: 600, color: T.ink }}>
          {title}
        </h2>
        <BrandColorLockedBlock palette={palette.length ? palette : [brand.current_color]} compact />
        <p style={{ margin: '16px 0 0', fontSize: 12, color: T.ink60, lineHeight: 1.5 }}>
          Tu color {getColorDisplayName(brand.current_color)} quedará guardado por si vuelves a una plantilla
          compatible.
        </p>
      </div>
    )
  } else {
    body = (
      <div style={{ padding: '8px 0' }}>
        <h2 id={titleId} style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 600, color: T.ink }}>
          {title}
        </h2>
        <p style={{ margin: '0 0 20px', fontSize: 14, lineHeight: 1.5, color: T.ink99 }}>
          Tu color de marca actual no está disponible en esta plantilla. Elige cómo continuar:
        </p>

        <ColorCompareRow current={brand.current_color} suggested={brand.suggested_color} />

        <BrandColorLivePreview hex={selectedHex} isDefault={selectedIsDefault} showActions={false} />

        <div style={{ display: 'grid', gap: 12, marginBottom: 16 }}>
          <ChoiceOption
            id={suggestedId}
            name="brand-choice"
            checked={choiceMode === 'suggested'}
            onSelect={() => setChoiceMode('suggested')}
            title="Usar el color sugerido"
            detail={getColorDisplayName(brand.suggested_color)}
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
          >
            {choiceMode === 'palette' ? (
              <div style={{ marginTop: 16, paddingLeft: 4 }}>
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
          />
        </div>

        <p style={{ margin: 0, fontSize: 12, color: T.ink60, lineHeight: 1.5 }}>
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

      <div style={{ paddingRight: 36 }}>{body}</div>

      {showRichPicker ? (
        <BrandColorFooterHint />
      ) : (
        <div style={{ height: 8 }} />
      )}

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: 8,
          marginTop: 8,
          paddingTop: 20,
          borderTop: `1px solid var(--lw-border)`,
        }}
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
        style={{
          width: 'min(576px, calc(100vw - 32px))',
          maxHeight: 'calc(100vh - 32px)',
          overflow: 'auto',
          position: 'relative',
        }}
      >
        <BrandColorPanelShell style={{ marginBottom: 0 }}>
          {panelInner}
        </BrandColorPanelShell>
      </div>
    </div>,
    document.body,
  )
}
