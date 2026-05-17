import React from 'react'

export interface QrPosterPreviewProps {
  businessName: string
  tagline?: string
  publicUrl: string
  qrDataUri: string
  message: string
  color: string
  logoDataUri?: string
  size: 'a4' | 'a5' | 'square'
}

export const QR_POSTER_DIMENSIONS = {
  a4: { w: 794, h: 1123, scale: 1 },
  a5: { w: 559, h: 794, scale: 0.7 },
  square: { w: 794, h: 794, scale: 1 },
} as const

const DIMENSIONS = QR_POSTER_DIMENSIONS

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n))
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  let h = hex.replace('#', '').trim()
  if (h.length === 3) h = h.split('').map((c) => c + c).join('')
  const num = parseInt(h, 16)
  if (Number.isNaN(num)) return { r: 15, g: 110, b: 86 }
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 }
}

function rgbToHex(r: number, g: number, b: number): string {
  const to = (n: number) => clamp(Math.round(n), 0, 255).toString(16).padStart(2, '0')
  return `#${to(r)}${to(g)}${to(b)}`
}

// Mix hex with white. ratio = 0 -> original color, ratio = 1 -> pure white.
export function tint(hex: string, ratio: number): string {
  const { r, g, b } = hexToRgb(hex)
  const t = clamp(ratio, 0, 1)
  return rgbToHex(r + (255 - r) * t, g + (255 - g) * t, b + (255 - b) * t)
}

const QrPosterPreview: React.FC<QrPosterPreviewProps> = ({
  businessName,
  tagline,
  publicUrl,
  qrDataUri,
  message,
  color,
  logoDataUri,
  size,
}) => {
  const dims = DIMENSIONS[size]
  const scale = dims.scale
  const s = (n: number) => Math.round(n * scale)

  const qrSize = size === 'square' ? s(300) : s(340)

  const accent = color
  const bgSoft = tint(color, 0.94)
  const divider = tint(color, 0.82)
  const qrBorder = tint(color, 0.70)
  const eyebrow = tint(color, 0.40)
  const dots = tint(color, 0.60)
  const taglineColor = tint(color, 0.20)

  const nearBlack = '#0B1F1A'
  const muted = '#888780'
  const white = '#FFFFFF'

  const fontStack = "'Helvetica Neue', Arial, sans-serif"

  return (
    <div
      style={{
        width: dims.w,
        height: dims.h,
        background: white,
        fontFamily: fontStack,
        color: nearBlack,
        position: 'relative',
        overflow: 'hidden',
        boxSizing: 'border-box',
      }}
    >
      {/* 1. Top accent strip */}
      <div style={{ width: '100%', height: s(4), background: accent, lineHeight: 0, fontSize: 0 }} />

      {/* 2. Header */}
      <div
        style={{
          width: '100%',
          background: white,
          paddingTop: s(40),
          paddingBottom: s(40),
          paddingLeft: s(48),
          paddingRight: s(48),
          textAlign: 'center',
          boxSizing: 'border-box',
        }}
      >
        {logoDataUri ? (
          <img
            src={logoDataUri}
            alt=""
            style={{
              display: 'inline-block',
              maxHeight: s(64),
              maxWidth: s(220),
              marginBottom: s(16),
            }}
          />
        ) : null}
        <div
          style={{
            fontSize: logoDataUri ? s(28) : s(38),
            fontWeight: 800,
            color: nearBlack,
            letterSpacing: '-0.03em',
            lineHeight: 1.05,
          }}
        >
          {businessName}
        </div>
        {tagline ? (
          <div
            style={{
              fontSize: s(15),
              color: taglineColor,
              fontWeight: 500,
              marginTop: s(8),
              letterSpacing: '0.01em',
            }}
          >
            {tagline}
          </div>
        ) : null}
      </div>

      {/* 3. Divider */}
      <div
        style={{
          height: 1,
          background: divider,
          marginLeft: s(48),
          marginRight: s(48),
          lineHeight: 0,
          fontSize: 0,
        }}
      />

      {/* 4. Message section */}
      <div
        style={{
          width: '100%',
          background: bgSoft,
          paddingTop: s(32),
          paddingBottom: s(32),
          paddingLeft: s(48),
          paddingRight: s(48),
          textAlign: 'center',
          boxSizing: 'border-box',
        }}
      >
        <div
          style={{
            fontSize: s(10),
            fontWeight: 600,
            letterSpacing: '0.12em',
            color: eyebrow,
            textTransform: 'uppercase',
            marginBottom: s(10),
          }}
        >
          ESCANEA Y VISÍTANOS
        </div>
        <div
          style={{
            fontSize: s(28),
            fontWeight: 700,
            color: accent,
            letterSpacing: '-0.02em',
            lineHeight: 1.2,
          }}
        >
          {message}
        </div>
      </div>

      {/* 5. QR section — table-based centering for dompdf parity */}
      <table
        cellPadding={0}
        cellSpacing={0}
        style={{
          width: '100%',
          background: white,
          borderCollapse: 'collapse',
          marginTop: 0,
          marginBottom: 0,
        }}
      >
        <tbody>
          <tr>
            <td
              style={{
                textAlign: 'center',
                paddingTop: s(36),
                paddingBottom: s(36),
              }}
            >
              <div
                style={{
                  display: 'inline-block',
                  background: white,
                  border: `${s(2)}px solid ${qrBorder}`,
                  padding: s(20),
                  textAlign: 'center',
                  boxSizing: 'content-box',
                }}
              >
                {/* Folder-tab top bar */}
                <div
                  style={{
                    width: '100%',
                    height: s(3),
                    background: accent,
                    marginBottom: s(12),
                    lineHeight: 0,
                    fontSize: 0,
                  }}
                />
                <img
                  src={qrDataUri}
                  alt="QR"
                  style={{
                    width: qrSize,
                    height: qrSize,
                    display: 'block',
                  }}
                />
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      {/* 6. URL section */}
      <div
        style={{
          width: '100%',
          paddingTop: s(20),
          paddingLeft: s(48),
          paddingRight: s(48),
          textAlign: 'center',
          boxSizing: 'border-box',
          background: white,
        }}
      >
        <div
          style={{
            fontSize: s(17),
            fontWeight: 700,
            color: nearBlack,
            letterSpacing: '0.01em',
          }}
        >
          {publicUrl}
        </div>
        <div
          style={{
            fontSize: s(8),
            color: dots,
            letterSpacing: `${s(6)}px`,
            marginTop: s(8),
            lineHeight: 1,
          }}
        >
          ●●●
        </div>
        <div
          style={{
            fontSize: s(12),
            color: muted,
            fontWeight: 400,
            marginTop: s(8),
          }}
        >
          Apunta la cámara de tu móvil al código QR
        </div>
      </div>

      {/* Spacer pushes footer toward bottom in flow */}
      <div style={{ height: s(20) }} />

      {/* 7. Bottom accent strip */}
      <div style={{ width: '100%', height: s(4), background: accent, lineHeight: 0, fontSize: 0 }} />

      {/* 8. Footer */}
      <div
        style={{
          width: '100%',
          background: white,
          paddingTop: s(14),
          paddingBottom: s(14),
          textAlign: 'center',
          boxSizing: 'border-box',
        }}
      >
        <span
          style={{
            fontWeight: 900,
            fontSize: s(11),
            color: nearBlack,
            letterSpacing: '-0.02em',
          }}
        >
          ONEZ
        </span>
        <span style={{ display: 'inline-block', width: s(6) }} />
        <span style={{ fontSize: s(11), color: muted, fontWeight: 400 }}>·</span>
        <span style={{ display: 'inline-block', width: s(6) }} />
        <span style={{ fontSize: s(11), color: muted, fontWeight: 400 }}>
          Tu página profesional
        </span>
      </div>
    </div>
  )
}

export default QrPosterPreview
