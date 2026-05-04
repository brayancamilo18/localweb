import React from "react";
import { Icon, Btn, Badge, Card, Logo, Placeholder, Segmented } from "./primitives.jsx";

// LocalWeb — Dashboard (Free vs Pro)

function DashSidebar({ pro }) {
  const items = [
    { icon: "home",       t: "Mi página",     active: true },
    { icon: "edit",       t: "Editar" },
    { icon: "image",      t: "Imágenes" },
    { icon: "clock",      t: "Horarios" },
    { icon: "barChart",   t: "Estadísticas", locked: !pro },
    { icon: "creditCard", t: "Suscripción" },
    { icon: "shield",     t: "Seguridad" },
  ];
  return (
    <aside style={{
      width: 240, flexShrink: 0,
      background: "var(--lw-bg-elev)",
      borderRight: "1px solid var(--lw-border)",
      display: "flex", flexDirection: "column",
      padding: "20px 12px",
    }}>
      <div style={{ padding: "0 8px 18px" }}><Logo size={20}/></div>
      <nav style={{ display: "flex", flexDirection: "column", gap: 2, flex: 1 }}>
        {items.map((it) => (
          <span key={it.t} style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "8px 10px", borderRadius: "var(--lw-r-sm)",
            fontSize: 13.5, fontWeight: 500,
            background: it.active ? "var(--lw-surface)" : "transparent",
            color: it.active ? "var(--lw-text)" : "var(--lw-text-2)",
          }}>
            <Icon name={it.icon} size={16}
              color={it.active ? "var(--lw-accent)" : "var(--lw-text-3)"}/>
            <span style={{ flex: 1 }}>{it.t}</span>
            {it.locked && <Icon name="lock" size={12} color="var(--lw-text-4)"/>}
          </span>
        ))}
      </nav>
      {pro ? (
        <div style={{
          padding: 12, borderRadius: "var(--lw-r-sm)",
          background: "var(--lw-pro-soft)", border: "1px solid #FCD34D",
          display: "flex", alignItems: "center", gap: 8,
        }}>
          <Icon name="sparkle" size={14} color="var(--lw-pro)"/>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#78350F" }}>Plan Pro</div>
            <div style={{ fontSize: 11, color: "#92400E" }}>Renueva 12 nov</div>
          </div>
        </div>
      ) : (
        <Card padding={12} style={{ background: "var(--lw-surface)", border: "none" }}>
          <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Plan Gratis</div>
          <div className="lw-small" style={{ marginBottom: 10, fontSize: 11.5 }}>
            Más fotos, dominio propio y estadísticas.
          </div>
          <Btn size="sm" kind="primary" fullWidth iconRight="arrowRight">Pasa a Pro</Btn>
        </Card>
      )}
    </aside>
  );
}

function StatCard({ label, value, delta, deltaTone = "success", icon, locked }) {
  return (
    <Card padding={16} style={{
      display: "flex", flexDirection: "column", gap: 14,
      opacity: locked ? .6 : 1,
      position: "relative",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span className="lw-small">{label}</span>
        <Icon name={icon} size={14} color="var(--lw-text-4)"/>
      </div>
      <div style={{ fontSize: 26, fontWeight: 600, letterSpacing: "-0.02em", fontVariantNumeric: "tabular-nums" }}>
        {locked ? "—" : value}
      </div>
      {!locked && delta && (
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <Icon name="trending" size={12} color={deltaTone === "success" ? "var(--lw-success)" : "var(--lw-danger)"}/>
          <span style={{ fontSize: 11.5, color: deltaTone === "success" ? "var(--lw-success)" : "var(--lw-danger)", fontWeight: 600 }}>{delta}</span>
          <span className="lw-small">vs. semana anterior</span>
        </div>
      )}
    </Card>
  );
}

// Mini line chart
function MiniLine({ data, color = "var(--lw-accent)", h = 80 }) {
  const max = Math.max(...data);
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * 100},${100 - (v / max) * 90 - 5}`).join(" ");
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ width: "100%", height: h }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke"/>
      <polyline points={`0,100 ${pts} 100,100`} fill={color} opacity=".08" stroke="none"/>
    </svg>
  );
}

function Dashboard({ pro }) {
  return (
    <div style={{ display: "flex", height: "100%", background: "var(--lw-bg)" }}>
      <DashSidebar pro={pro}/>
      <main className="lw-scroll" style={{ flex: 1, overflow: "auto", padding: "24px 32px 60px" }}>
        {/* Top header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
          <div>
            <h1 className="lw-h2">Mi página</h1>
            <p className="lw-small" style={{ marginTop: 4, fontSize: 13 }}>Bienvenida de vuelta, Marta.</p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <Btn kind="outline" icon="bell" size="md" style={{ width: 38, padding: 0 }}/>
            <Btn kind="outline" icon="user" size="md">Marta R.</Btn>
          </div>
        </div>

        {/* Hero card */}
        <Card padding={18} style={{ marginBottom: 20, display: "flex", alignItems: "center", gap: 16 }}>
          <Placeholder ratio="1:1" w={56} h={56} label=""/>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 16, fontWeight: 600 }}>Estudio Marta</span>
              <Badge tone="success" dot>Publicado</Badge>
              {pro && <Badge tone="pro" icon="sparkle">PRO</Badge>}
            </div>
            <span className="lw-mono" style={{ fontSize: 12, color: "var(--lw-text-3)" }}>
              {pro ? "estudiomarta.es" : "estudio-marta.localweb.es"}
            </span>
          </div>
          <Btn kind="outline" iconRight="arrowUpRight">Ver mi página</Btn>
        </Card>

        {/* Stats area */}
        {pro ? (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 14 }}>
              <StatCard label="Visitas hoy" value="84" delta="+12%" icon="eye"/>
              <StatCard label="Visitas (7 días)" value="612" delta="+8%" icon="trending"/>
              <StatCard label="Clics WhatsApp" value="47" delta="+22%" icon="whatsapp"/>
              <StatCard label="Clics teléfono" value="29" delta="−4%" deltaTone="danger" icon="phone"/>
            </div>
            <Card padding={20} style={{ marginBottom: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <div>
                  <div className="lw-small">Visitas diarias</div>
                  <div style={{ fontSize: 22, fontWeight: 600, fontVariantNumeric: "tabular-nums", letterSpacing: "-0.02em" }}>612</div>
                </div>
                <Segmented size="sm" value="7d" options={["7d", "30d", "90d"]}/>
              </div>
              <MiniLine h={120} data={[42, 51, 38, 62, 71, 84, 76, 92, 88, 97, 84, 102, 98, 110]}/>
            </Card>
          </>
        ) : (
          <Card padding={24} style={{
            marginBottom: 20, display: "flex", alignItems: "center", gap: 18,
            background: "linear-gradient(180deg, var(--lw-bg-elev), var(--lw-surface))",
          }}>
            <div style={{
              width: 48, height: 48, borderRadius: "var(--lw-r)",
              background: "var(--lw-pro-soft)", color: "var(--lw-pro)",
              display: "inline-flex", alignItems: "center", justifyContent: "center",
            }}><Icon name="lock" size={20}/></div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 600 }}>Estadísticas detalladas en Pro</div>
              <p className="lw-small" style={{ fontSize: 13, marginTop: 2 }}>
                Mira cuántas personas visitan tu web, de dónde llegan y qué les interesa más.
              </p>
            </div>
            <Btn kind="primary" iconRight="sparkle">Mejorar a Pro</Btn>
          </Card>
        )}

        {/* Quick actions */}
        <div style={{ marginBottom: 12 }}>
          <h2 className="lw-h4" style={{ marginBottom: 10 }}>Accesos rápidos</h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
          {[
            { icon: "edit",     t: "Editar contenido", d: "Nombre, tagline, descripción" },
            { icon: "image",    t: "Imágenes",         d: pro ? "12 / 20 fotos" : "3 / 3 fotos" },
            { icon: "barChart", t: "Estadísticas",     d: pro ? "612 visitas (7d)" : "Disponible en Pro", locked: !pro },
          ].map((q) => (
            <Card key={q.t} padding={16} style={{ display: "flex", alignItems: "center", gap: 12, opacity: q.locked ? .65 : 1 }}>
              <div style={{
                width: 36, height: 36, borderRadius: "var(--lw-r-sm)",
                background: "var(--lw-accent-soft)", color: "var(--lw-accent)",
                display: "inline-flex", alignItems: "center", justifyContent: "center",
              }}>
                <Icon name={q.icon} size={16}/>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 600 }}>{q.t}</div>
                <div className="lw-small" style={{ fontSize: 12, marginTop: 2 }}>{q.d}</div>
              </div>
              <Icon name={q.locked ? "lock" : "chevronRight"} size={14} color="var(--lw-text-4)"/>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}

export { Dashboard, DashSidebar, StatCard, MiniLine };
