import React from "react";
import { Btn, Badge, Icon, MiniMap, Placeholder } from "./primitives.jsx";

// LocalWeb — Public business pages (3 plantillas)
// Soft (peluquería) · Aurora (bienestar) · Negocio (servicios)

function PubNav({ name, dark }) {
  const c = dark ? "rgba(255,255,255,.92)" : "var(--lw-text)";
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "14px 22px", color: c,
      backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)",
      background: dark ? "rgba(15,23,42,.35)" : "rgba(255,255,255,.7)",
      borderBottom: dark ? "1px solid rgba(255,255,255,.08)" : "1px solid rgba(15,23,42,.06)",
    }}>
      <span style={{ fontWeight: 600, letterSpacing: "-0.02em", fontSize: 16 }}>{name}</span>
      <div style={{ display: "flex", gap: 18, fontSize: 13, fontWeight: 500 }}>
        <span>Sobre nosotros</span>
        <span>Galería</span>
        <span>Horario</span>
        <span>Contacto</span>
      </div>
    </div>
  );
}

// ─── Soft · Peluquería ───────────────────────────────────────
function PubSoft({ pro }) {
  return (
    <div style={{ background: "#FAF8F5", color: "#1A1814", fontFamily: "var(--lw-font)" }}>
      <PubNav name="Estudio Marta"/>
      {/* HERO */}
      <div style={{ position: "relative", height: 360 }}>
        <Placeholder ratio="16:9" h={360} dark style={{ borderRadius: 0 }} label="portada · 1920×1080"/>
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(0,0,0,.15), rgba(0,0,0,.55))" }}/>
        <div style={{ position: "absolute", inset: 0, padding: 32, display: "flex", flexDirection: "column", justifyContent: "flex-end", color: "#fff" }}>
          <Badge tone="success" dot>Abierto ahora</Badge>
          <div style={{ fontSize: 44, fontWeight: 600, letterSpacing: "-0.03em", marginTop: 12, lineHeight: 1.05 }}>Estudio Marta</div>
          <div style={{ fontSize: 16, opacity: .92, maxWidth: 480, marginTop: 6 }}>
            Cortes con criterio en el corazón de Lavapiés.
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 22 }}>
            <Btn kind="primary" size="lg" icon="whatsapp"
              style={{ background: "#25D366", border: "none" }}>WhatsApp</Btn>
            <Btn kind="outline" size="lg"
              style={{ background: "transparent", color: "#fff", borderColor: "rgba(255,255,255,.4)" }}>
              Conocer más
            </Btn>
          </div>
        </div>
      </div>

      {/* SOBRE */}
      <div style={{ padding: "48px 32px", display: "grid", gridTemplateColumns: "1fr 200px", gap: 32, alignItems: "center" }}>
        <div>
          <div className="lw-mono" style={{ color: "#9C7A4D", fontSize: 11, letterSpacing: ".15em", marginBottom: 10 }}>SOBRE NOSOTROS</div>
          <div style={{ fontSize: 28, fontWeight: 600, letterSpacing: "-0.025em", marginBottom: 14 }}>Cinco peluqueros y un café</div>
          <p style={{ fontSize: 14, lineHeight: 1.7, color: "#48433C", maxWidth: 460 }}>
            Marta abrió el estudio en 2014 y desde entonces somos cinco peluqueros enamorados del oficio. Trabajamos con cita previa, productos cuidados y conversaciones tranquilas. Te recibimos con un café de la torrefactora de la esquina.
          </p>
        </div>
        <Placeholder ratio="3:4" label="equipo · 3:4"/>
      </div>

      {/* GALERIA */}
      <div style={{ padding: "0 32px 48px" }}>
        <div className="lw-mono" style={{ color: "#9C7A4D", fontSize: 11, letterSpacing: ".15em", marginBottom: 10 }}>NUESTRO TRABAJO</div>
        <div style={{ fontSize: 24, fontWeight: 600, letterSpacing: "-0.02em", marginBottom: 18 }}>Galería</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8 }}>
          {Array.from({ length: 8 }).map((_, i) => (
            <Placeholder key={i} ratio="1:1"/>
          ))}
        </div>
      </div>

      {/* HORARIO + CONTACTO */}
      <div style={{ padding: "48px 32px", background: "#F1ECE3", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32 }}>
        <div>
          <div className="lw-mono" style={{ color: "#9C7A4D", fontSize: 11, letterSpacing: ".15em", marginBottom: 10 }}>HORARIO</div>
          <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: "-0.02em", marginBottom: 14, display: "flex", alignItems: "center", gap: 10 }}>
            Cuándo nos encuentras
            <Badge tone="success" dot size="sm">Abierto</Badge>
          </div>
          {[
            ["Lunes", "10:00 – 20:00"],
            ["Martes", "10:00 – 20:00"],
            ["Miércoles", "10:00 – 20:00"],
            ["Jueves", "10:00 – 20:00"],
            ["Viernes", "10:00 – 21:00", true],
            ["Sábado", "10:00 – 14:00"],
            ["Domingo", "Cerrado", false, true],
          ].map(([d, h, today, closed]) => (
            <div key={d} style={{
              display: "flex", justifyContent: "space-between",
              padding: "10px 0", borderBottom: "1px solid rgba(0,0,0,.08)",
              fontSize: 14, fontWeight: today ? 600 : 400,
              color: closed ? "#9A938A" : "#1A1814",
            }}>
              <span>{d}{today && <span style={{ marginLeft: 8, fontSize: 10, color: "#9C7A4D", fontWeight: 600, letterSpacing: ".1em" }}>HOY</span>}</span>
              <span style={{ fontVariantNumeric: "tabular-nums" }}>{h}</span>
            </div>
          ))}
        </div>
        <div>
          <div className="lw-mono" style={{ color: "#9C7A4D", fontSize: 11, letterSpacing: ".15em", marginBottom: 10 }}>VISÍTANOS</div>
          <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: "-0.02em", marginBottom: 14 }}>Calle del Olmo 23</div>
          <MiniMap h={170} style={{ borderColor: "rgba(0,0,0,.08)" }}/>
          <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8, fontSize: 14 }}>
            <span style={{ display: "flex", alignItems: "center", gap: 8, color: "#1A1814" }}>
              <Icon name="phone" size={14} color="#9C7A4D"/> +34 911 234 567
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 8, color: "#1A1814" }}>
              <Icon name="mail" size={14} color="#9C7A4D"/> hola@estudiomarta.es
            </span>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <div style={{ padding: "20px 32px", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12, color: "#7A7268" }}>
        <span>© 2026 Estudio Marta</span>
        {!pro && <span>Creado con <span style={{ fontWeight: 600, color: "var(--lw-accent)" }}>LocalWeb</span></span>}
      </div>
    </div>
  );
}

// ─── Aurora · Bienestar ──────────────────────────────────────
function PubAurora() {
  return (
    <div style={{ background: "#0F1A1F", color: "#E8EFF1", fontFamily: "var(--lw-font)" }}>
      <PubNav name="Centro Aurora" dark/>
      <div style={{ padding: "60px 32px 48px", textAlign: "center" }}>
        <Badge tone="ghost" size="sm" style={{ background: "rgba(255,255,255,.08)", borderColor: "rgba(255,255,255,.15)", color: "rgba(255,255,255,.8)" }}>
          Yoga · Meditación · Reiki
        </Badge>
        <div style={{ fontSize: 52, fontWeight: 600, letterSpacing: "-0.04em", marginTop: 18, lineHeight: 1.05 }}>
          Espacio para<br/>volver a ti.
        </div>
        <p style={{ fontSize: 16, color: "rgba(232,239,241,.7)", marginTop: 16, maxWidth: 420, marginInline: "auto", lineHeight: 1.6 }}>
          Un centro de bienestar pequeño en Malasaña con clases en grupos reducidos.
        </p>
        <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 26 }}>
          <Btn size="lg" style={{ background: "#A8C7B8", color: "#0F1A1F", border: "none" }}>Reservar clase</Btn>
          <Btn kind="outline" size="lg" style={{ background: "transparent", color: "#fff", borderColor: "rgba(255,255,255,.25)" }}>
            Ver horarios
          </Btn>
        </div>
      </div>
      <Placeholder ratio="16:9" h={300} dark style={{ borderRadius: 0, margin: "0 32px" }} label="hero · 16:9"/>
      <div style={{ padding: "48px 32px", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 18 }}>
        {[
          { t: "Yoga matinal", d: "Hatha · todos los niveles" },
          { t: "Meditación", d: "Atención plena guiada" },
          { t: "Reiki", d: "Sesiones de 60 min" },
        ].map((c) => (
          <div key={c.t} style={{ padding: 22, border: "1px solid rgba(255,255,255,.08)", borderRadius: 12 }}>
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>{c.t}</div>
            <div style={{ fontSize: 13, color: "rgba(232,239,241,.6)" }}>{c.d}</div>
          </div>
        ))}
      </div>
      <div style={{ padding: "20px 32px", borderTop: "1px solid rgba(255,255,255,.08)", fontSize: 12, color: "rgba(232,239,241,.5)", textAlign: "center" }}>
        © 2026 Centro Aurora
      </div>
    </div>
  );
}

// ─── Negocio · Servicios ─────────────────────────────────────
function PubNegocio() {
  return (
    <div style={{ background: "#fff", color: "#0F172A", fontFamily: "var(--lw-font)" }}>
      <PubNav name="Talleres Vega"/>
      <div style={{ padding: "44px 32px 32px", display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: 32, alignItems: "center" }}>
        <div>
          <Badge tone="accent" size="sm">Reparación · Pre-ITV · Diagnóstico</Badge>
          <div style={{ fontSize: 40, fontWeight: 600, letterSpacing: "-0.03em", marginTop: 16, lineHeight: 1.1 }}>
            Tu coche, en buenas manos.
          </div>
          <p style={{ fontSize: 15, color: "var(--lw-text-2)", marginTop: 14, maxWidth: 420, lineHeight: 1.6 }}>
            Tres generaciones reparando coches en Vallecas. Presupuesto sin compromiso, recogida y entrega en el barrio.
          </p>
          <div style={{ display: "flex", gap: 8, marginTop: 22 }}>
            <Btn kind="primary" size="lg" icon="phone">911 555 040</Btn>
            <Btn kind="outline" size="lg">Pedir presupuesto</Btn>
          </div>
          <div style={{ display: "flex", gap: 18, marginTop: 26, fontSize: 13, color: "var(--lw-text-3)" }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Icon name="check" size={14} color="var(--lw-success)"/> Pre-ITV gratis</span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Icon name="check" size={14} color="var(--lw-success)"/> Recogida en 24 h</span>
          </div>
        </div>
        <Placeholder ratio="4:3" label="taller · 4:3"/>
      </div>

      <div style={{ padding: "32px", background: "var(--lw-surface)", borderTop: "1px solid var(--lw-border)" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 32 }}>
          <div>
            <div className="lw-mono" style={{ color: "var(--lw-accent)", fontSize: 11, letterSpacing: ".15em", marginBottom: 10 }}>HORARIO</div>
            <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: "-0.02em", marginBottom: 14, display: "flex", alignItems: "center", gap: 10 }}>
              Cuándo abrimos
              <Badge tone="danger" dot>Cerrado · abre mañana 8:00</Badge>
            </div>
            {[
              ["Lunes a Viernes", "08:00 – 19:00"],
              ["Sábado", "09:00 – 13:00"],
              ["Domingo", "Cerrado", true],
            ].map(([d, h, closed]) => (
              <div key={d} style={{
                display: "flex", justifyContent: "space-between",
                padding: "10px 0", borderBottom: "1px solid var(--lw-border)",
                fontSize: 14, color: closed ? "var(--lw-text-4)" : "var(--lw-text)",
              }}>
                <span>{d}</span>
                <span style={{ fontVariantNumeric: "tabular-nums" }}>{h}</span>
              </div>
            ))}
          </div>
          <MiniMap h={220}/>
        </div>
      </div>
      <div style={{ padding: "20px 32px", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12, color: "var(--lw-text-3)" }}>
        <span>© 2026 Talleres Vega · Avda. de la Albufera 142</span>
        <span>Creado con <span style={{ fontWeight: 600, color: "var(--lw-accent)" }}>LocalWeb</span></span>
      </div>
    </div>
  );
}

export { PubSoft, PubAurora, PubNegocio };
