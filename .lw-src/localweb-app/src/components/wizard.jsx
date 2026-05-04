import React, { createContext, useContext, useState } from "react";
import {
  Icon, Btn, Field, Input, Textarea, Badge, Card, Logo, Placeholder,
  Segmented, Switch, MiniMap, BrowserChrome,
} from "./primitives.jsx";

// LocalWeb — Onboarding wizard (8 pasos)
// Each step is a self-contained component returning a desktop split (form + preview).
// Mobile variants exposed separately.

export const WizardNavContext = createContext(null);

const ACCENT = "var(--lw-accent)";
const BORDER = "var(--lw-border)";

// ─── Wizard chrome (header + step pills + progress) ──────────
function WizardHeader({ step }) {
  const nav = useContext(WizardNavContext);
  const jump = nav?.onJumpToStep;
  const steps = [
    "Plantilla", "Portada", "Sobre nosotros", "Galería",
    "Horarios", "Ubicación", "Plan", "Publicar",
  ];
  const pct = (step / steps.length) * 100;
  return (
    <div style={{
      borderBottom: `1px solid ${BORDER}`, background: "var(--lw-bg-elev)",
      padding: "16px 32px",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <Logo size={20}/>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <span style={{ fontSize: 12, color: "var(--lw-text-3)", fontWeight: 500 }}>
            Paso <span style={{ color: "var(--lw-text)", fontVariantNumeric: "tabular-nums" }}>{step}</span> de 8
          </span>
          <Btn kind="ghost" size="sm">Guardar y salir</Btn>
        </div>
      </div>
      {/* progress bar */}
      <div style={{ height: 3, background: "var(--lw-surface)", borderRadius: 2, overflow: "hidden", marginBottom: 14 }}>
        <div style={{ width: `${pct}%`, height: "100%", background: ACCENT,
          transition: "width .3s" }}/>
      </div>
      {/* step pills */}
      <div style={{ display: "flex", gap: 6, overflow: "hidden" }}>
        {steps.map((s, i) => {
          const n = i + 1;
          const state = n < step ? "done" : n === step ? "active" : "todo";
          const styles = {
            done:   { bg: "var(--lw-accent-soft)",  color: "var(--lw-accent-hover)", border: "transparent" },
            active: { bg: "var(--lw-text)",         color: "#fff",                   border: "transparent" },
            todo:   { bg: "transparent",            color: "var(--lw-text-4)",       border: "var(--lw-border)" },
          }[state];
          const clickable = typeof jump === "function";
          return (
            <span
              key={s}
              role={clickable ? "button" : undefined}
              tabIndex={clickable ? 0 : undefined}
              title={clickable ? `Ir al paso ${n}: ${s}` : undefined}
              onClick={clickable ? () => jump(n) : undefined}
              onKeyDown={clickable ? (e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  jump(n);
                }
              } : undefined}
              style={{
              flex: 1, minWidth: 0, padding: "6px 10px",
              fontSize: 11.5, fontWeight: 500,
              borderRadius: 6, textAlign: "center", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
              background: styles.bg, color: styles.color,
              border: `1px solid ${styles.border}`,
              display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 5,
              cursor: clickable ? "pointer" : "default",
              userSelect: "none",
            }}>
              {state === "done" ? <Icon name="check" size={11}/> : <span style={{ opacity: state === "todo" ? .6 : 1, fontVariantNumeric: "tabular-nums" }}>{n}</span>}
              {s}
            </span>
          );
        })}
      </div>
    </div>
  );
}

// ─── Wizard layout: split 52 / 48 ────────────────────────────
function WizardLayout({ step, children, preview, footer }) {
  const nav = useContext(WizardNavContext);
  const [device, setDevice] = useState("desktop");

  const staticFooter = (
    <>
      <Btn kind="ghost" icon="chevronLeft" size="md">Atrás</Btn>
      <Btn kind="primary" iconRight="arrowRight" size="md">Continuar</Btn>
    </>
  );

  const resolvedFooter = footer !== undefined && footer !== null ? footer : (nav?.footer ?? staticFooter);

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: "var(--lw-bg)" }}>
      <WizardHeader step={step}/>
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* form */}
        <div className="lw-scroll" style={{
          flexBasis: "52%", overflow: "auto",
          padding: "32px 40px 100px", display: "flex", flexDirection: "column", gap: 24,
        }}>{children}</div>
        {/* preview */}
        <div style={{
          flexBasis: "48%", borderLeft: `1px solid ${BORDER}`,
          background: "var(--lw-surface)", padding: 32,
          display: "flex", flexDirection: "column", gap: 14,
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span className="lw-small" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <Icon name="eye" size={13}/> Vista previa en tiempo real
            </span>
            <Segmented size="sm" value={device} onChange={setDevice} options={[
              { value: "desktop", label: <Icon name="monitor" size={13}/> },
              { value: "mobile",  label: <Icon name="smartphone" size={13}/> },
            ]}/>
          </div>
          <div style={{
            flex: 1, minHeight: 0,
            display: "flex",
            justifyContent: device === "mobile" ? "center" : "stretch",
            alignItems: "flex-start",
            overflow: "hidden",
          }}>
            <div style={{
              width: device === "mobile" ? 320 : "100%",
              maxWidth: "100%",
              height: "100%",
              minHeight: 0,
            }}>{preview}</div>
          </div>
        </div>
      </div>
      {/* footer */}
      <div style={{
        borderTop: `1px solid ${BORDER}`, background: "var(--lw-bg-elev)",
        padding: "14px 32px", display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        {resolvedFooter}
      </div>
    </div>
  );
}

// ─── Step 1 · Plantilla ──────────────────────────────────────
function Step1Plantilla() {
  const tpls = [
    { name: "Soft", tone: "Estudio Marta", plan: "FREE" },
    { name: "Aurora", tone: "Bienestar", plan: "FREE" },
    { name: "Negocio", tone: "Servicios", plan: "FREE" },
    { name: "Sabor", tone: "Restaurante", plan: "PRO" },
    { name: "Editorial", tone: "Tienda", plan: "PRO" },
    { name: "Trazo", tone: "Boutique", plan: "PRO" },
  ];
  const [selected, setSelected] = useState("Soft");

  return (
    <WizardLayout step={1} preview={<TplPreview/>}>
      <div>
        <h1 className="lw-h2">Elige tu plantilla</h1>
        <p className="lw-body" style={{ marginTop: 6, maxWidth: 540 }}>
          Empieza con un diseño hecho para tu sector. Podrás cambiarlo en cualquier momento, sin perder lo que ya hayas escrito.
        </p>
        <p className="lw-small" style={{ marginTop: 8, color: "var(--lw-text-3)" }}>
          En esta demo puedes elegir <strong>cualquier</strong> plantilla, incluidas las marcadas como PRO.
        </p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {tpls.map((t) => {
          const isSel = t.name === selected;
          return (
            <Card key={t.name} padding={0}
              style={{
                overflow: "hidden", padding: 0,
                borderColor: isSel ? ACCENT : BORDER,
                boxShadow: isSel ? "0 0 0 3px var(--lw-accent-ring), var(--lw-shadow-1)" : "var(--lw-shadow-1)",
              }}>
              <div style={{ position: "relative", height: 140, borderBottom: `1px solid ${BORDER}` }}>
                <Placeholder ratio="16:9" h={140} style={{ borderRadius: 0 }}
                  label={`${t.name} preview`}/>
                <div style={{ position: "absolute", top: 8, left: 8 }}>
                  <Badge tone={t.plan === "PRO" ? "pro" : "ghost"} size="sm">{t.plan}</Badge>
                </div>
                {isSel && (
                  <div style={{ position: "absolute", top: 8, right: 8,
                    width: 22, height: 22, background: ACCENT, borderRadius: 999,
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                    color: "#fff", boxShadow: "0 0 0 3px #fff",
                  }}><Icon name="check" size={13}/></div>
                )}
              </div>
              <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{t.name}</div>
                  <div className="lw-small">{t.tone}</div>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <Btn size="sm" kind="outline" fullWidth type="button">Ver</Btn>
                  <Btn size="sm" kind={isSel ? "dark" : "primary"} fullWidth type="button" onClick={() => setSelected(t.name)}>
                    {isSel ? "Elegida" : "Elegir"}
                  </Btn>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </WizardLayout>
  );
}

// Preview rail used across most steps — small fake browser
function PreviewBrowser({ children, url = "estudio-marta.localweb.es" }) {
  return (
    <BrowserChrome url={url} style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <div className="lw-scroll" style={{ flex: 1, overflow: "auto", background: "#fff" }}>
        {children}
      </div>
    </BrowserChrome>
  );
}

function TplPreview() {
  return (
    <PreviewBrowser>
      <div style={{ position: "relative", height: 220 }}>
        <Placeholder ratio="16:9" h={220} dark style={{ borderRadius: 0 }} label="portada · 16:9"/>
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, transparent 40%, rgba(0,0,0,.55))" }}/>
        <div style={{ position: "absolute", left: 18, bottom: 16, color: "#fff" }}>
          <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: "-0.02em" }}>Estudio Marta</div>
          <div style={{ fontSize: 12, opacity: .85 }}>Peluquería de barrio · Madrid</div>
        </div>
      </div>
      <div style={{ padding: 18 }}>
        <div className="lw-shimmer" style={{ height: 10, borderRadius: 4, marginBottom: 10, width: "75%" }}/>
        <div className="lw-shimmer" style={{ height: 10, borderRadius: 4, marginBottom: 10, width: "92%" }}/>
        <div className="lw-shimmer" style={{ height: 10, borderRadius: 4, marginBottom: 18, width: "60%" }}/>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
          <Placeholder ratio="1:1"/><Placeholder ratio="1:1"/><Placeholder ratio="1:1"/>
        </div>
      </div>
    </PreviewBrowser>
  );
}

// ─── Step 2 · Portada ────────────────────────────────────────
function Step2Portada() {
  return (
    <WizardLayout step={2} preview={<PortadaPreview/>}>
      <div>
        <h1 className="lw-h2">Tu portada</h1>
        <p className="lw-body" style={{ marginTop: 6 }}>
          La primera impresión: una foto, tu nombre y un mensaje breve que diga a qué te dedicas.
        </p>
      </div>
      <Field label="Nombre del negocio" counter="13 / 60">
        <Input value="Estudio Marta"/>
      </Field>
      <Field label="Tagline" hint="Una frase corta que aparece bajo el nombre." counter="46 / 80">
        <Input value="Cortes con criterio en el corazón de Lavapiés"/>
      </Field>
      <Field label="Foto de portada">
        <div style={{
          border: `1.5px dashed var(--lw-border-2)`, borderRadius: "var(--lw-r)",
          padding: 28, background: "var(--lw-bg-elev)",
          display: "flex", flexDirection: "column", alignItems: "center", gap: 10, textAlign: "center",
        }}>
          <div style={{ width: 40, height: 40, borderRadius: 999, background: "var(--lw-accent-soft)",
            display: "inline-flex", alignItems: "center", justifyContent: "center", color: "var(--lw-accent)" }}>
            <Icon name="upload" size={18}/>
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 500 }}>Arrastra una foto o <span style={{ color: ACCENT, textDecoration: "underline" }}>elígela desde tu móvil</span></div>
            <div className="lw-small" style={{ marginTop: 4 }}>JPG o PNG, hasta 8 MB</div>
          </div>
          <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
            <Badge tone="neutral" size="sm">1920 × 1080</Badge>
            <Badge tone="neutral" size="sm">16:9</Badge>
            <Badge tone="neutral" size="sm">Horizontal</Badge>
          </div>
        </div>
      </Field>
    </WizardLayout>
  );
}
function PortadaPreview() {
  return (
    <PreviewBrowser>
      <div style={{ position: "relative", height: 240 }}>
        <Placeholder ratio="16:9" h={240} dark style={{ borderRadius: 0 }} label="portada · 16:9"/>
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, transparent 35%, rgba(0,0,0,.6))" }}/>
        <div style={{ position: "absolute", left: 22, bottom: 22, color: "#fff" }}>
          <div style={{ fontSize: 26, fontWeight: 600, letterSpacing: "-0.02em" }}>Estudio Marta</div>
          <div style={{ fontSize: 13, opacity: .9, marginTop: 4 }}>Cortes con criterio en el corazón de Lavapiés</div>
        </div>
      </div>
      <div style={{ padding: 18, display: "flex", flexDirection: "column", gap: 10 }}>
        <div className="lw-shimmer" style={{ height: 8, borderRadius: 4, width: "70%" }}/>
        <div className="lw-shimmer" style={{ height: 8, borderRadius: 4, width: "90%" }}/>
        <div className="lw-shimmer" style={{ height: 8, borderRadius: 4, width: "55%" }}/>
      </div>
    </PreviewBrowser>
  );
}

// ─── Step 3 · Sobre nosotros ─────────────────────────────────
function Step3Sobre() {
  return (
    <WizardLayout step={3} preview={<SobrePreview/>}>
      <div>
        <h1 className="lw-h2">Sobre vosotros</h1>
        <p className="lw-body" style={{ marginTop: 6 }}>
          Cuenta brevemente a qué os dedicáis y qué os hace especiales. Funciona mejor si suena a vosotros, no a folleto.
        </p>
      </div>
      <Field label="Descripción" counter="184 / 300">
        <Textarea rows={5} value="Marta abrió el estudio en 2014 y desde entonces somos cinco peluqueros enamorados del oficio. Trabajamos con cita previa, productos cuidados y conversaciones tranquilas. Te recibimos con un café de la torrefactora de la esquina."/>
      </Field>
      <Field label="Teléfono de contacto" hint="Aparecerá como botón clicable en tu web.">
        <Input value="+34 911 234 567" prefix={<Icon name="phone" size={14}/>}/>
      </Field>
      <Field label="Foto del equipo" hint="Vertical, mejor con luz natural.">
        <div style={{ display: "flex", gap: 14, alignItems: "stretch" }}>
          <Placeholder ratio="3:4" w={120} label="3:4 · vertical"/>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8, justifyContent: "center" }}>
            <Btn kind="outline" size="sm" icon="refresh">Cambiar foto</Btn>
            <Btn kind="ghost" size="sm" icon="trash" style={{ color: "var(--lw-danger)" }}>Eliminar</Btn>
            <div className="lw-small">team.jpg · 1.4 MB</div>
          </div>
        </div>
      </Field>
    </WizardLayout>
  );
}
function SobrePreview() {
  return (
    <PreviewBrowser>
      <div style={{ padding: 24 }}>
        <div className="lw-mono" style={{ fontSize: 10, color: ACCENT, letterSpacing: ".1em", marginBottom: 8 }}>SOBRE NOSOTROS</div>
        <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: "-0.02em", marginBottom: 14 }}>Cinco peluqueros y un café</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 130px", gap: 16, alignItems: "start" }}>
          <div style={{ fontSize: 13, lineHeight: 1.6, color: "var(--lw-text-2)" }}>
            Marta abrió el estudio en 2014 y desde entonces somos cinco peluqueros enamorados del oficio. Trabajamos con cita previa, productos cuidados y conversaciones tranquilas. Te recibimos con un café de la torrefactora de la esquina.
          </div>
          <Placeholder ratio="3:4" label="3:4"/>
        </div>
      </div>
    </PreviewBrowser>
  );
}

// ─── Step 4 · Galería (con upsell Free → Pro) ────────────────
function Step4Galeria({ pro = false }) {
  const slots = pro ? 20 : 3;
  const filled = pro ? 12 : 3;
  const items = Array.from({ length: slots }, (_, i) => {
    if (i < filled) {
      const q = i % 3 === 0 ? "Óptima" : i % 3 === 1 ? "Buena" : "Aceptable";
      return { kind: "filled", q };
    }
    return { kind: "empty" };
  });
  return (
    <WizardLayout step={4} preview={<GaleriaPreview pro={pro} count={filled}/>}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 16 }}>
        <div>
          <h1 className="lw-h2">Tu galería</h1>
          <p className="lw-body" style={{ marginTop: 6 }}>
            Sube fotos de tu local, tu equipo o tu trabajo. Te decimos en qué calidad quedan en cada pantalla.
          </p>
        </div>
        <div className="lw-small" style={{ whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }}>
          <span style={{ color: "var(--lw-text)", fontWeight: 600 }}>{filled}</span>
          <span> de {slots} fotos</span>
        </div>
      </div>

      {!pro && (
        <div style={{
          padding: 12, paddingLeft: 14,
          background: "var(--lw-pro-soft)",
          border: "1px solid #FCD34D",
          borderRadius: "var(--lw-r-sm)",
          display: "flex", alignItems: "center", gap: 12,
        }}>
          <Icon name="sparkle" size={18} color="var(--lw-pro)"/>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#78350F" }}>Pro incluye hasta 17 fotos más</div>
            <div className="lw-small" style={{ color: "#92400E" }}>Una galería más rica convierte mejor las visitas.</div>
          </div>
          <Btn size="sm" kind="dark" iconRight="arrowRight">Mejorar a Pro</Btn>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
        {items.map((it, i) => (
          it.kind === "filled" ? (
            <div key={i} style={{ position: "relative" }}>
              <Placeholder ratio="1:1" label={`foto ${i + 1}`}/>
              <button style={{
                position: "absolute", top: 6, right: 6,
                width: 24, height: 24, borderRadius: 999,
                background: "rgba(15,23,42,.7)", color: "#fff", border: "none",
                display: "inline-flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
              }}><Icon name="x" size={12}/></button>
              <div style={{ position: "absolute", left: 6, bottom: 6 }}>
                <Badge tone={it.q === "Óptima" ? "success" : it.q === "Buena" ? "accent" : "warn"} size="sm">
                  {it.q}
                </Badge>
              </div>
            </div>
          ) : (
            <div key={i} style={{
              aspectRatio: "1/1",
              border: `1.5px dashed var(--lw-border-2)`, borderRadius: "var(--lw-r-sm)",
              background: "var(--lw-bg-elev)",
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4,
              color: "var(--lw-text-3)",
            }}>
              <Icon name="plus" size={18}/>
              <span style={{ fontSize: 11, fontWeight: 500 }}>Añadir</span>
            </div>
          )
        ))}
      </div>
    </WizardLayout>
  );
}
function GaleriaPreview({ pro, count }) {
  return (
    <PreviewBrowser>
      <div style={{ padding: 18 }}>
        <div className="lw-mono" style={{ fontSize: 10, color: ACCENT, letterSpacing: ".1em", marginBottom: 8 }}>GALERÍA</div>
        <div style={{ fontSize: 18, fontWeight: 600, letterSpacing: "-0.02em", marginBottom: 14 }}>Nuestro estudio</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
          {Array.from({ length: Math.min(count, 9) }).map((_, i) => (
            <Placeholder key={i} ratio="1:1" style={{ borderRadius: 4 }}/>
          ))}
        </div>
      </div>
    </PreviewBrowser>
  );
}

// ─── Step 5 · Horarios ───────────────────────────────────────
function Step5Horarios() {
  const days = [
    { d: "Lunes",     o: "10:00", c: "20:00" },
    { d: "Martes",    o: "10:00", c: "20:00" },
    { d: "Miércoles", o: "10:00", c: "20:00" },
    { d: "Jueves",    o: "10:00", c: "20:00" },
    { d: "Viernes",   o: "10:00", c: "21:00" },
    { d: "Sábado",    o: "10:00", c: "14:00" },
    { d: "Domingo",   closed: true },
  ];
  const presets = ["Lun – Vie", "Lun – Sáb", "Todos los días", "Solo fines de semana", "Personalizado"];
  return (
    <WizardLayout step={5} preview={<HorariosPreview days={days}/>}>
      <div>
        <h1 className="lw-h2">Vuestros horarios</h1>
        <p className="lw-body" style={{ marginTop: 6 }}>
          Empieza con una plantilla y ajusta lo que haga falta. Mostraremos &quot;Abierto ahora&quot; en directo.
        </p>
      </div>

      <div>
        <div className="lw-small" style={{ marginBottom: 8, color: "var(--lw-text-2)", fontWeight: 500 }}>Plantillas rápidas</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {presets.map((p, i) => (
            <span key={p} style={{
              padding: "8px 12px", borderRadius: "var(--lw-r-sm)", fontSize: 13,
              border: i === 1 ? `1px solid ${ACCENT}` : `1px solid ${BORDER}`,
              background: i === 1 ? "var(--lw-accent-soft)" : "var(--lw-bg-elev)",
              color: i === 1 ? "var(--lw-accent-hover)" : "var(--lw-text-2)",
              fontWeight: 500, cursor: "pointer",
            }}>{p}</span>
          ))}
        </div>
      </div>

      <Card padding={0}>
        {days.map((row, i) => (
          <div key={row.d} style={{
            display: "grid", gridTemplateColumns: "120px 1fr auto",
            alignItems: "center", gap: 12,
            padding: "12px 16px",
            borderBottom: i < days.length - 1 ? `1px solid ${BORDER}` : "none",
          }}>
            <div style={{ fontSize: 14, fontWeight: 500 }}>{row.d}</div>
            {row.closed ? (
              <div className="lw-small" style={{ color: "var(--lw-text-4)" }}>Cerrado</div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Input value={row.o} style={{ height: 32, width: 90, fontSize: 13 }}/>
                <span className="lw-small">a</span>
                <Input value={row.c} style={{ height: 32, width: 90, fontSize: 13 }}/>
              </div>
            )}
            <Switch checked={!row.closed} size="sm"/>
          </div>
        ))}
      </Card>
    </WizardLayout>
  );
}
function HorariosPreview({ days }) {
  return (
    <PreviewBrowser>
      <div style={{ padding: 18 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <div>
            <div className="lw-mono" style={{ fontSize: 10, color: ACCENT, letterSpacing: ".1em" }}>HORARIO</div>
            <div style={{ fontSize: 18, fontWeight: 600, letterSpacing: "-0.02em" }}>Cuándo nos encuentras</div>
          </div>
          <Badge tone="success" dot>Abierto ahora</Badge>
        </div>
        <div style={{ borderTop: `1px solid ${BORDER}` }}>
          {days.map((r) => (
            <div key={r.d} style={{
              display: "flex", justifyContent: "space-between",
              padding: "9px 0", borderBottom: `1px solid ${BORDER}`,
              fontSize: 13,
            }}>
              <span style={{ color: "var(--lw-text-2)" }}>{r.d}</span>
              <span style={{ color: r.closed ? "var(--lw-text-4)" : "var(--lw-text)", fontVariantNumeric: "tabular-nums" }}>
                {r.closed ? "Cerrado" : `${r.o} – ${r.c}`}
              </span>
            </div>
          ))}
        </div>
      </div>
    </PreviewBrowser>
  );
}

// ─── Step 6 · Ubicación ──────────────────────────────────────
function Step6Ubicacion() {
  return (
    <WizardLayout step={6} preview={<UbicacionPreview/>}>
      <div>
        <h1 className="lw-h2">Dónde os encuentran</h1>
        <p className="lw-body" style={{ marginTop: 6 }}>
          Tu dirección aparece con un mapa para que llegar sea fácil.
        </p>
      </div>
      <Field label="Dirección">
        <div style={{ display: "flex", gap: 8 }}>
          <Input value="Calle del Olmo 23, 28012 Madrid" prefix={<Icon name="search" size={14}/>}
            style={{ flex: 1 }}/>
          <Btn kind="outline">Buscar</Btn>
        </div>
      </Field>
      <Card padding={14} style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 999, background: "var(--lw-success-soft)",
          color: "var(--lw-success)", display: "inline-flex", alignItems: "center", justifyContent: "center",
        }}><Icon name="check" size={16}/></div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 500 }}>Encontrada · Calle del Olmo 23, Lavapiés, Madrid</div>
          <div className="lw-small">40.4108° N, 3.7034° W · OpenStreetMap</div>
        </div>
        <MiniMap h={70} style={{ width: 110 }}/>
      </Card>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Field label="Teléfono">
          <Input value="+34 911 234 567" prefix={<Icon name="phone" size={14}/>}/>
        </Field>
        <Field label="Email">
          <Input value="hola@estudiomarta.es" prefix={<Icon name="mail" size={14}/>}/>
        </Field>
      </div>
    </WizardLayout>
  );
}
function UbicacionPreview() {
  return (
    <PreviewBrowser>
      <div style={{ padding: 18 }}>
        <div className="lw-mono" style={{ fontSize: 10, color: ACCENT, letterSpacing: ".1em", marginBottom: 8 }}>VISÍTANOS</div>
        <div style={{ fontSize: 18, fontWeight: 600, letterSpacing: "-0.02em", marginBottom: 14 }}>Calle del Olmo 23, Madrid</div>
        <MiniMap h={180}/>
        <div style={{ marginTop: 14, display: "flex", gap: 10 }}>
          <div style={{ flex: 1, padding: 10, border: `1px solid ${BORDER}`, borderRadius: "var(--lw-r-sm)" }}>
            <div className="lw-small" style={{ marginBottom: 2 }}>Teléfono</div>
            <div style={{ fontSize: 13, fontWeight: 500, color: ACCENT }}>+34 911 234 567</div>
          </div>
          <div style={{ flex: 1, padding: 10, border: `1px solid ${BORDER}`, borderRadius: "var(--lw-r-sm)" }}>
            <div className="lw-small" style={{ marginBottom: 2 }}>Email</div>
            <div style={{ fontSize: 13, fontWeight: 500, color: ACCENT }}>hola@estudiomarta.es</div>
          </div>
        </div>
      </div>
    </PreviewBrowser>
  );
}

// ─── Step 7 · Plan ───────────────────────────────────────────
function Step7Plan() {
  return (
    <WizardLayout step={7} preview={<PlanPreview/>}>
      <div>
        <h1 className="lw-h2">Elige tu plan</h1>
        <p className="lw-body" style={{ marginTop: 6 }}>
          Empieza gratis. Pasa a Pro cuando quieras más fotos, estadísticas y tu propio dominio.
        </p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <PlanCard plan="free"/>
        <PlanCard plan="pro" recommended/>
      </div>
      <p className="lw-small" style={{ textAlign: "center", marginTop: 8 }}>
        Pago seguro con Stripe. Cancela cuando quieras, sin permanencia.
      </p>
    </WizardLayout>
  );
}
function PlanCard({ plan, recommended, current, detailed }) {
  const isPro = plan === "pro";
  const features = isPro
    ? [
        { ok: true, t: "Carrusel de portada (3 fotos)" },
        { ok: true, t: "Hasta 20 fotos en galería" },
        { ok: true, t: "Estadísticas 90 días" },
        { ok: true, t: "Subdominio personalizado" },
        { ok: true, t: "Sin marca \"Creado con LocalWeb\"" },
        { ok: true, t: "Soporte por email en 24 h" },
      ]
    : [
        { ok: true, t: "1 foto de portada" },
        { ok: true, t: "Hasta 3 fotos en galería" },
        { ok: true, t: "Estadísticas básicas (7 días)" },
        { ok: true, t: "Subdominio aleatorio" },
        { ok: false, t: "Subdominio personalizado" },
        { ok: false, t: "Sin marca \"Creado con LocalWeb\"" },
      ];
  return (
    <div style={{
      padding: 22,
      background: "var(--lw-bg-elev)",
      borderRadius: "var(--lw-r-lg)",
      border: isPro ? `1.5px solid ${ACCENT}` : `1px solid ${BORDER}`,
      boxShadow: isPro ? "0 0 0 4px var(--lw-accent-ring), var(--lw-shadow-2)" : "var(--lw-shadow-1)",
      position: "relative",
      display: "flex", flexDirection: "column", gap: 16,
    }}>
      {recommended && (
        <div style={{
          position: "absolute", top: -10, right: 16,
          background: ACCENT, color: "#fff",
          fontSize: 10, fontWeight: 600, letterSpacing: ".05em",
          padding: "4px 10px", borderRadius: 999,
        }}>RECOMENDADO</div>
      )}
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 14, fontWeight: 600 }}>{isPro ? "Pro" : "Gratis"}</span>
          {isPro && <Badge tone="pro" size="sm" icon="sparkle">PRO</Badge>}
        </div>
        <div style={{ marginTop: 8, display: "flex", alignItems: "baseline", gap: 4 }}>
          <span style={{ fontSize: 32, fontWeight: 600, letterSpacing: "-0.03em" }}>
            {isPro ? "19€" : "0€"}
          </span>
          <span className="lw-small">{isPro ? "/ mes" : "para siempre"}</span>
        </div>
      </div>
      <div style={{ height: 1, background: "var(--lw-border)" }}/>
      <ul style={{ display: "flex", flexDirection: "column", gap: 9, padding: 0, margin: 0, listStyle: "none" }}>
        {features.map((f, i) => (
          <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 13,
            color: f.ok ? "var(--lw-text-2)" : "var(--lw-text-4)" }}>
            <Icon name={f.ok ? "check" : "x"} size={14}
              color={f.ok ? "var(--lw-success)" : "var(--lw-text-4)"} style={{ marginTop: 2 }}/>
            <span style={{ textDecoration: f.ok ? "none" : "line-through" }}>{f.t}</span>
          </li>
        ))}
      </ul>
      <Btn kind={isPro ? "primary" : "outline"} size="lg" fullWidth>
        {current ? "Plan actual" : isPro ? "Mejorar a Pro" : "Continuar gratis"}
      </Btn>
      {isPro && <p className="lw-small" style={{ textAlign: "center" }}>Cancela cuando quieras.</p>}
    </div>
  );
}
function PlanPreview() {
  return (
    <div style={{
      height: "100%", display: "flex", alignItems: "center", justifyContent: "center",
      background: "var(--lw-bg-elev)", border: `1px solid ${BORDER}`, borderRadius: "var(--lw-r)",
      padding: 32,
    }}>
      <div style={{ textAlign: "center", maxWidth: 280 }}>
        <div style={{ width: 56, height: 56, borderRadius: "var(--lw-r)", background: "var(--lw-pro-soft)",
          color: "var(--lw-pro)", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
          <Icon name="sparkle" size={26}/>
        </div>
        <div style={{ fontSize: 18, fontWeight: 600, letterSpacing: "-0.02em" }}>Casi listo</div>
        <p className="lw-body" style={{ marginTop: 6 }}>
          Cualquiera de los planes te permite publicar tu web ahora. Si dudas, empieza gratis.
        </p>
      </div>
    </div>
  );
}

// ─── Step 8 · Publicar ───────────────────────────────────────
function Step8Publicar() {
  const checklist = [
    { t: "Plantilla elegida", ok: true },
    { t: "Foto de portada subida", ok: true },
    { t: "Sobre nosotros completo", ok: true },
    { t: "Galería con 3 fotos", ok: true },
    { t: "Horarios configurados", ok: true },
    { t: "Dirección y contacto", ok: true },
    { t: "Plan elegido (Gratis)", ok: true },
    { t: "Tagline (opcional)", warn: true, hint: "Vamos a publicar sin tagline" },
  ];
  return (
    <WizardLayout step={8}
      preview={<PublicarPreview/>}
      footer={
        <>
          <Btn kind="ghost" icon="chevronLeft">Atrás</Btn>
          <div style={{ display: "flex", gap: 8 }}>
            <Btn kind="outline" icon="eye">Ver página completa</Btn>
            <Btn kind="outline" icon="smartphone">Ver en móvil</Btn>
            <Btn kind="primary" size="lg" iconRight="arrowUpRight">¡Publicar mi web!</Btn>
          </div>
        </>
      }
    >
      <div>
        <h1 className="lw-h2">Listo para publicar</h1>
        <p className="lw-body" style={{ marginTop: 6 }}>
          Repasamos lo que has hecho. Cuando le des al botón, tu web estará en línea en segundos.
        </p>
      </div>

      <Card padding={18} style={{ background: "var(--lw-accent-soft)", borderColor: "transparent" }}>
        <div className="lw-small" style={{ color: "var(--lw-accent-hover)", marginBottom: 6, letterSpacing: ".05em" }}>TU URL</div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span className="lw-mono" style={{ fontSize: 14, color: "var(--lw-text)" }}>
            estudio-marta.localweb.es
          </span>
          <Badge tone="ghost" size="sm">Subdominio gratis</Badge>
          <div style={{ flex: 1 }}/>
          <Btn size="sm" kind="ghost" icon="edit">Cambiar</Btn>
        </div>
      </Card>

      <Card padding={0}>
        {checklist.map((c, i) => (
          <div key={c.t} style={{
            padding: "12px 16px", display: "flex", alignItems: "center", gap: 12,
            borderBottom: i < checklist.length - 1 ? `1px solid ${BORDER}` : "none",
          }}>
            <span style={{
              width: 22, height: 22, borderRadius: 999,
              background: c.ok ? "var(--lw-success-soft)" : "var(--lw-warning-soft)",
              color: c.ok ? "var(--lw-success)" : "var(--lw-warning)",
              display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <Icon name={c.ok ? "check" : "alert"} size={12}/>
            </span>
            <span style={{ flex: 1, fontSize: 13.5, fontWeight: 500 }}>{c.t}</span>
            {c.hint && <span className="lw-small" style={{ color: "var(--lw-warning)" }}>{c.hint}</span>}
          </div>
        ))}
      </Card>
    </WizardLayout>
  );
}
function PublicarPreview() {
  return (
    <PreviewBrowser url="estudio-marta.localweb.es">
      <div style={{ position: "relative", height: 220 }}>
        <Placeholder ratio="16:9" h={220} dark style={{ borderRadius: 0 }} label="portada"/>
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, transparent 35%, rgba(0,0,0,.6))" }}/>
        <div style={{ position: "absolute", left: 18, bottom: 16, color: "#fff" }}>
          <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: "-0.02em" }}>Estudio Marta</div>
          <div style={{ fontSize: 12, opacity: .9, marginTop: 2 }}>Cortes con criterio en Lavapiés</div>
        </div>
      </div>
      <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
        <Badge tone="success" dot>Abierto ahora · cierra a las 20:00</Badge>
        <div className="lw-shimmer" style={{ height: 8, borderRadius: 4, width: "70%" }}/>
        <div className="lw-shimmer" style={{ height: 8, borderRadius: 4, width: "85%" }}/>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginTop: 6 }}>
          <Placeholder ratio="1:1"/><Placeholder ratio="1:1"/><Placeholder ratio="1:1"/>
        </div>
      </div>
    </PreviewBrowser>
  );
}

export {
  Step1Plantilla, Step2Portada, Step3Sobre, Step4Galeria,
  Step5Horarios, Step6Ubicacion, Step7Plan, Step8Publicar,
  PlanCard, PreviewBrowser,
};
