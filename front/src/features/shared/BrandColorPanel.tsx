import type { CSSProperties, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Icon } from '../../components/primitives/primitives'
import { getColorDisplayName } from '../../lib/hexColorName'
import { brandColorTokens, isLightHex } from './brandColorTokens'

const T = brandColorTokens

type ShellProps = {
  children: ReactNode
  style?: CSSProperties
}

export function BrandColorPanelShell({ children, style }: ShellProps) {
  return (
    <section
      style={{
        borderRadius: 24,
        background: T.cream,
        boxShadow: T.panelShadow,
        marginBottom: 24,
        padding: '28px',
        ...style,
      }}
    >
      {children}
    </section>
  )
}

export function BrandColorLivePreview({
  hex,
  isDefault = false,
  showActions = true,
}: {
  hex: string
  isDefault?: boolean
  showActions?: boolean
}) {
  const name = getColorDisplayName(hex)
  const btnTextColor = isLightHex(hex) ? T.ink : '#fff'

  return (
    <div
      style={{
        borderRadius: 16,
        padding: '22px 24px',
        marginBottom: 24,
        display: 'flex',
        alignItems: 'center',
        gap: 20,
        background: T.ink08,
        boxShadow: `inset 0 0 0 1px ${T.ink0D}`,
      }}
    >
      <div
        aria-hidden
        style={{
          width: 64,
          height: 64,
          borderRadius: 16,
          flexShrink: 0,
          background: hex,
          boxShadow: `inset 0 0 0 1px ${T.ink1A}, 0 10px 24px color-mix(in srgb, ${hex} 32%, transparent)`,
          transition: 'background 200ms ease-out, box-shadow 200ms ease-out',
        }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            lineHeight: 1.35,
            color: T.ink60,
          }}
        >
          Color seleccionado
        </div>
        <div
          style={{
            marginTop: 4,
            fontSize: 17,
            fontWeight: 600,
            lineHeight: 1.3,
            color: T.ink,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            flexWrap: 'wrap',
          }}
        >
          {name}
          {isDefault ? (
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                padding: '2px 6px',
                borderRadius: 6,
                background: T.ink08,
                color: T.ink80,
              }}
            >
              Por defecto
            </span>
          ) : null}
        </div>
        <div style={{ fontSize: 13, marginTop: 6, lineHeight: 1.4, color: T.ink60 }}>
          Vista previa botones y enlaces
        </div>
      </div>
      {showActions ? (
        <div
          style={{
            display: 'none',
            flexDirection: 'column',
            alignItems: 'flex-start',
            justifyContent: 'center',
            gap: 10,
            flexShrink: 0,
            minWidth: 148,
          }}
          className="brand-color-preview-actions"
        >
          <button
            type="button"
            style={{
              padding: '11px 20px',
              minHeight: 42,
              fontSize: 13,
              fontWeight: 600,
              lineHeight: 1.25,
              letterSpacing: '0.01em',
              borderRadius: 10,
              border: 'none',
              whiteSpace: 'nowrap',
              color: btnTextColor,
              background: hex,
              cursor: 'default',
            }}
          >
            Reservar ahora
          </button>
          <span
            style={{
              fontSize: 13,
              fontWeight: 600,
              lineHeight: 1.35,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              padding: '2px 0',
              color: hex,
            }}
          >
            Ver carta <Icon name="arrowRight" size={14} color={hex} />
          </span>
        </div>
      ) : null}
      <style>{`
        @media (min-width: 640px) {
          .brand-color-preview-actions { display: flex !important; }
        }
      `}</style>
    </div>
  )
}

export function BrandColorPaletteGrid({
  palette,
  templateName,
  value,
  defaultColor,
  onChange,
  disabled = false,
  onReset,
  resetDisabled = false,
}: {
  palette: string[]
  templateName?: string
  value: string
  defaultColor: string
  onChange: (hex: string) => void
  disabled?: boolean
  onReset?: () => void
  resetDisabled?: boolean
}) {
  const normalizedDefault = defaultColor.toLowerCase()

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          minHeight: 40,
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontSize: 12,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              lineHeight: 1.35,
              color: T.ink70,
            }}
          >
            {templateName ? `Paleta · ${templateName}` : 'Paleta de la plantilla'}
          </div>
          {templateName ? (
            <div style={{ fontSize: 11, marginTop: 4, lineHeight: 1.4, color: T.ink60, fontWeight: 500 }}>
              Colores de esta plantilla; al cambiar de diseño verás otra paleta.
            </div>
          ) : null}
        </div>
        {onReset ? (
          <button
            type="button"
            disabled={resetDisabled || disabled}
            onClick={onReset}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 7,
              fontSize: 13,
              fontWeight: 600,
              lineHeight: 1.25,
              letterSpacing: '0.01em',
              padding: '10px 14px',
              minHeight: 40,
              borderRadius: 10,
              border: 'none',
              whiteSpace: 'nowrap',
              background: 'transparent',
              color: T.ink,
              cursor: resetDisabled || disabled ? 'not-allowed' : 'pointer',
              opacity: resetDisabled || disabled ? 0.4 : 1,
            }}
          >
            <Icon name="refresh" size={15} color={T.ink} />
            Restablecer
          </button>
        ) : null}
      </div>
      <div
        role="group"
        aria-label="Elige el color de marca"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
          gap: 12,
        }}
        className="brand-color-palette-grid"
      >
        {palette.map((hex) => {
          const lower = hex.toLowerCase()
          const sel = value.toLowerCase() === lower
          const isDefault = lower === normalizedDefault
          const colorName = getColorDisplayName(hex)
          const shortLabel = isDefault ? 'Default' : colorName.split(' ')[0] ?? colorName

          return (
            <button
              key={hex}
              type="button"
              disabled={disabled}
              className="brand-color-swatch-btn"
              aria-label={`Color marca: ${colorName}${isDefault ? ' (predeterminado de la plantilla)' : ''}`}
              aria-pressed={sel}
              onClick={() => onChange(lower)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 10,
                padding: '10px 6px',
                borderRadius: 16,
                border: 'none',
                cursor: disabled ? 'not-allowed' : 'pointer',
                background: 'transparent',
                opacity: disabled ? 0.55 : 1,
              }}
            >
              <div style={{ position: 'relative' }}>
                <div
                  aria-hidden
                  className="brand-color-swatch-circle"
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    background: hex,
                    boxShadow: `inset 0 0 0 1px ${T.ink1A}, 0 4px 10px color-mix(in srgb, ${hex} 19%, transparent)`,
                    transition: 'transform 120ms ease-out, box-shadow 120ms ease-out',
                  }}
                />
                {sel ? (
                  <div
                    style={{
                      position: 'absolute',
                      bottom: -4,
                      right: -4,
                      width: 20,
                      height: 20,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: T.verde,
                      boxShadow: `0 0 0 2px ${T.cream}`,
                    }}
                  >
                    <Icon name="check" size={12} color="#fff" />
                  </div>
                ) : null}
              </div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  lineHeight: 1.35,
                  color: sel ? T.ink : T.ink60,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  width: '100%',
                  textAlign: 'center',
                  padding: '0 2px',
                }}
              >
                {shortLabel}
              </div>
            </button>
          )
        })}
      </div>
      <style>{`
        .brand-color-swatch-btn:hover:not(:disabled) .brand-color-swatch-circle {
          transform: scale(1.06);
        }
        .brand-color-swatch-btn:focus-visible {
          outline: 2px solid var(--lw-accent);
          outline-offset: 3px;
        }
        @media (min-width: 640px) {
          .brand-color-palette-grid {
            grid-template-columns: repeat(6, minmax(0, 1fr)) !important;
          }
        }
      `}</style>
    </div>
  )
}

export function BrandColorLockedBlock({
  palette,
  templateName,
  onGoToTemplates,
  compact = false,
}: {
  palette: string[]
  templateName?: string
  onGoToTemplates?: () => void
  compact?: boolean
}) {
  return (
    <div
      style={{
        borderRadius: 16,
        padding: compact ? 16 : 20,
        display: 'flex',
        alignItems: 'flex-start',
        gap: 16,
        position: 'relative',
        overflow: 'hidden',
        background: T.ink08,
        boxShadow: `inset 0 0 0 1px ${T.ink0D}`,
      }}
    >
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          opacity: 0.04,
          pointerEvents: 'none',
          backgroundImage: `repeating-linear-gradient(45deg, var(--lw-text) 0 1px, transparent 1px 14px)`,
        }}
      />
      <div style={{ display: 'flex', marginLeft: -8, flexShrink: 0, position: 'relative' }}>
        {palette.slice(0, 4).map((hex, i) => (
          <div
            key={hex}
            aria-hidden
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: hex,
              filter: 'grayscale(1)',
              opacity: 0.5,
              marginLeft: i === 0 ? 0 : -8,
              boxShadow: `0 0 0 2px ${T.cream}`,
            }}
          />
        ))}
      </div>
      <div style={{ flex: 1, minWidth: 0, position: 'relative' }}>
        <div style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.4, color: T.ink }}>
          {templateName
            ? `La plantilla «${templateName}» no admite cambio de color de marca.`
            : 'Tu plantilla actual no admite cambio de color de marca.'}
        </div>
        <div style={{ fontSize: 12, marginTop: 6, lineHeight: 1.5, color: T.ink80 }}>
          Elige otra plantilla en Diseño: cada una tiene su propia paleta y no todas permiten personalizar el
          color.
        </div>
        {onGoToTemplates ? (
          <button
            type="button"
            onClick={onGoToTemplates}
            style={{
              marginTop: 12,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 12,
              fontWeight: 600,
              padding: '8px 14px',
              borderRadius: 8,
              border: 'none',
              color: '#fff',
              background: T.verde,
              boxShadow: `0 6px 14px ${T.verde33}`,
              cursor: 'pointer',
            }}
          >
            Cambiar plantilla
            <Icon name="arrowRight" size={14} color="#fff" />
          </button>
        ) : null}
      </div>
    </div>
  )
}

export function BrandColorFooterHint({ muted = false }: { muted?: boolean }) {
  return (
    <div
      style={{
        marginTop: 24,
        borderRadius: 12,
        padding: '12px 16px',
        fontSize: 12,
        lineHeight: 1.5,
        display: 'flex',
        alignItems: 'flex-start',
        gap: 10,
        background: muted ? T.ink08 : T.verde08,
        color: muted ? T.ink80 : T.ink99,
      }}
    >
      <div
        aria-hidden
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          marginTop: 6,
          flexShrink: 0,
          background: muted ? T.ink60 : T.verde,
        }}
      />
      <span>
        Los cambios se aplican <strong style={{ color: T.ink, fontWeight: 600 }}>inmediatamente</strong> y se ven en
        tu web pública en menos de 1 minuto.
      </span>
    </div>
  )
}

/** Bloqueo plan Free (Pro). */
export function BrandColorProUpsell() {
  return (
    <BrandColorPanelShell>
      <h2 className="lw-h2" style={{ margin: '0 0 8px', fontSize: 17 }}>
        Color de marca
      </h2>
      <p className="lw-small" style={{ margin: '0 0 16px', color: 'var(--lw-text-2)', lineHeight: 1.55 }}>
        Personaliza el color principal de tu web. Cada plantilla tiene su propia paleta de colores.
      </p>
      <div
        style={{
          borderRadius: 16,
          padding: 16,
          display: 'flex',
          gap: 12,
          alignItems: 'center',
          flexWrap: 'wrap',
          background: T.ink08,
          boxShadow: `inset 0 0 0 1px ${T.ink0D}`,
        }}
      >
        <Icon name="lock" size={18} color="#92400E" />
        <div style={{ flex: 1, minWidth: 200, fontSize: 13, fontWeight: 600, color: '#78350F' }}>
          El color de marca personalizado está disponible en el plan Pro
        </div>
        <Link to="/dashboard/account?tab=plan" style={{ textDecoration: 'none' }}>
          <button
            type="button"
            style={{
              fontSize: 13,
              fontWeight: 600,
              padding: '8px 14px',
              borderRadius: 8,
              border: 'none',
              color: '#fff',
              background: T.verde,
              cursor: 'pointer',
            }}
          >
            Ver planes
          </button>
        </Link>
      </div>
      <BrandColorFooterHint muted />
    </BrandColorPanelShell>
  )
}
