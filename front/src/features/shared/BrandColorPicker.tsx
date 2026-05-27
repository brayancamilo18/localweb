import {
  BrandColorLivePreview,
  BrandColorPaletteGrid,
} from './BrandColorPanel'
import BrandColorContrastWarning from './BrandColorContrastWarning'
import BrandColorCustomInput from './BrandColorCustomInput'
import type { BrandColorTemplateMeta } from '../../api/dashboard'

export type BrandColorPickerProps = {
  palette: string[]
  templateName?: string
  templateMeta?: BrandColorTemplateMeta | null
  value: string | null
  defaultColor: string
  effective: string
  disabled?: boolean
  /** Muestra estado de guardado sin bloquear nuevos clics. */
  saving?: boolean
  unsupportedReason?: string
  onChange: (color: string | null) => void
}

export default function BrandColorPicker({
  palette,
  templateName,
  templateMeta = null,
  value,
  defaultColor,
  effective,
  disabled = false,
  saving = false,
  onChange,
}: BrandColorPickerProps) {
  const pickerDisabled = disabled
  const normalizedDefault = defaultColor.toLowerCase()
  const selected = (value ?? normalizedDefault).toLowerCase()
  const isDefault = selected === normalizedDefault

  const handleSelect = (hex: string) => {
    if (pickerDisabled) return
    const lower = hex.toLowerCase()
    if (lower === normalizedDefault) {
      if (value !== null) onChange(null)
      return
    }
    onChange(lower)
  }

  const showCustom = templateMeta !== null

  return (
    <>
      <BrandColorLivePreview hex={effective} isDefault={isDefault && value === null} />
      <BrandColorContrastWarning hex={effective} templateMeta={templateMeta} />
      <BrandColorPaletteGrid
        palette={palette}
        templateName={templateName}
        value={selected}
        defaultColor={defaultColor}
        onChange={handleSelect}
        disabled={pickerDisabled}
        onReset={() => onChange(null)}
        resetDisabled={value === null}
      />
      {saving ? (
        <p className="lw-small" style={{ marginTop: 10, color: 'var(--lw-text-2)' }}>
          Guardando color…
        </p>
      ) : null}
      {showCustom ? (
        <div style={{ marginTop: 18 }}>
          <BrandColorCustomInput
            value={value}
            disabled={pickerDisabled}
            onValidColor={(hex) => onChange(hex)}
          />
        </div>
      ) : null}
    </>
  )
}
