import React from "react";

interface QrPosterPreviewProps {
  businessName: string;
  tagline?: string;
  publicUrl: string;
  qrDataUri: string;
  message: string;
  color: string;
  logoDataUri?: string;
  size: "a4" | "a5" | "square";
}

const DIMENSIONS: Record<QrPosterPreviewProps["size"], { w: number; h: number; scale: number }> = {
  a4: { w: 794, h: 1123, scale: 1 },
  a5: { w: 559, h: 794, scale: 0.7 },
  square: { w: 794, h: 794, scale: 1 },
};

// Lighten a hex color by mixing with white (for subtle backgrounds)
function tint(hex: string, ratio: number): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  const nr = Math.round(r + (255 - r) * ratio);
  const ng = Math.round(g + (255 - g) * ratio);
  const nb = Math.round(b + (255 - b) * ratio);
  return `rgb(${nr}, ${ng}, ${nb})`;
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
  const { w, h, scale } = DIMENSIONS[size];

  // Scaled sizes (in px) — dompdf-friendly absolute values
  const s = (n: number) => Math.round(n * scale);

  const headerHeight = s(size === "square" ? 150 : 180);
  const qrSize = s(size === "square" ? 320 : 380);
  const qrPadding = s(28);
  const qrBoxSize = qrSize + qrPadding * 2;

  const fontStack = "'Helvetica Neue', Arial, sans-serif";

  const softTint = tint(color, 0.92);
  const borderTint = tint(color, 0.75);

  return (
    <div
      style={{
        width: `${w}px`,
        height: `${h}px`,
        backgroundColor: "#ffffff",
        position: "relative",
        fontFamily: fontStack,
        color: "#111111",
        boxSizing: "border-box",
        overflow: "hidden",
        border: `1px solid ${borderTint}`,
      }}
    >
      {/* HEADER block (color band) */}
      <div
        style={{
          width: "100%",
          height: `${headerHeight}px`,
          backgroundColor: color,
          textAlign: "center",
          padding: `${s(28)}px ${s(40)}px`,
          boxSizing: "border-box",
          color: "#ffffff",
        }}
      >
        {logoDataUri ? (
          <div style={{ marginBottom: `${s(10)}px` }}>
            <img
              src={logoDataUri}
              alt={businessName}
              style={{
                maxHeight: `${s(80)}px`,
                maxWidth: `${s(260)}px`,
                display: "inline-block",
              }}
            />
          </div>
        ) : null}

        <div
          style={{
            fontSize: `${s(logoDataUri ? 32 : 44)}px`,
            fontWeight: 700,
            letterSpacing: "-0.01em",
            lineHeight: 1.1,
            marginTop: logoDataUri ? `${s(6)}px` : 0,
          }}
        >
          {businessName}
        </div>

        {tagline ? (
          <div
            style={{
              fontSize: `${s(16)}px`,
              fontWeight: 400,
              marginTop: `${s(10)}px`,
              opacity: 0.92,
              lineHeight: 1.3,
            }}
          >
            {tagline}
          </div>
        ) : null}
      </div>

      {/* Decorative thin bar */}
      <div
        style={{
          width: "100%",
          height: `${s(6)}px`,
          backgroundColor: tint(color, 0.55),
        }}
      />

      {/* MESSAGE */}
      <div
        style={{
          textAlign: "center",
          marginTop: `${s(40)}px`,
          marginBottom: `${s(18)}px`,
          paddingLeft: `${s(40)}px`,
          paddingRight: `${s(40)}px`,
        }}
      >
        <div
          style={{
            display: "inline-block",
            fontSize: `${s(34)}px`,
            fontWeight: 700,
            color: color,
            letterSpacing: "-0.01em",
            lineHeight: 1.1,
          }}
        >
          {message}
        </div>
      </div>

      {/* QR BOX — centered using table layout (dompdf-friendly) */}
      <table
        cellPadding={0}
        cellSpacing={0}
        style={{
          width: "100%",
          borderCollapse: "collapse",
          marginTop: `${s(8)}px`,
        }}
      >
        <tbody>
          <tr>
            <td style={{ textAlign: "center", verticalAlign: "middle" }}>
              <div
                style={{
                  display: "inline-block",
                  width: `${qrBoxSize}px`,
                  height: `${qrBoxSize}px`,
                  backgroundColor: "#ffffff",
                  border: `${s(4)}px solid ${color}`,
                  padding: `${qrPadding}px`,
                  boxSizing: "border-box",
                }}
              >
                <img
                  src={qrDataUri}
                  alt={`QR ${businessName}`}
                  width={qrSize}
                  height={qrSize}
                  style={{
                    display: "block",
                    width: `${qrSize}px`,
                    height: `${qrSize}px`,
                  }}
                />
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      {/* URL */}
      <div
        style={{
          textAlign: "center",
          marginTop: `${s(28)}px`,
          paddingLeft: `${s(40)}px`,
          paddingRight: `${s(40)}px`,
        }}
      >
        <div
          style={{
            display: "inline-block",
            fontSize: `${s(18)}px`,
            fontWeight: 600,
            color: "#222222",
            backgroundColor: softTint,
            padding: `${s(10)}px ${s(20)}px`,
            border: `1px solid ${borderTint}`,
            letterSpacing: "0.02em",
          }}
        >
          {publicUrl}
        </div>
        <div
          style={{
            fontSize: `${s(13)}px`,
            color: "#666666",
            marginTop: `${s(10)}px`,
          }}
        >
          Apunta la cámara de tu móvil al código
        </div>
      </div>

      {/* FOOTER pinned bottom */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: `${s(20)}px`,
          textAlign: "center",
          fontSize: `${s(11)}px`,
          color: "#999999",
          letterSpacing: "0.05em",
        }}
      >
        Hecho con <span style={{ fontWeight: 700, color: "#666666" }}>ONEZ</span>
      </div>
    </div>
  );
};

export default QrPosterPreview;

export type { QrPosterPreviewProps };
