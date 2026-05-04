import type { ReactNode } from 'react'
import { Icon, Logo } from '../components/primitives/primitives'

export type AuthHeroVariant = 'login' | 'signup'

function LoginHero() {
  return (
    <>
      <div
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          fontSize: 13,
          fontWeight: 500,
          color: 'rgba(255,255,255,0.96)',
        }}
      >
        <Icon name="sparkle" size={14} color="rgba(255,255,255,0.96)" />
        +12.000 negocios confían en LocalWeb
      </div>
      <div style={{ position: 'relative' }}>
        <h2
          style={{
            fontSize: 'clamp(26px, 4vw, 36px)',
            fontWeight: 600,
            lineHeight: 1.1,
            letterSpacing: '-0.02em',
            marginBottom: 16,
            margin: '0 0 16px',
            color: '#fff',
          }}
        >
          Tu web profesional en menos de 10 minutos.
        </h2>
        <p style={{ fontSize: 15, lineHeight: 1.6, maxWidth: 380, color: 'rgba(255,255,255,0.94)' }}>
          Sin saber programar. Sin diseñador. Solo responde unas preguntas y LocalWeb hace el resto.
        </p>
      </div>
      <div
        style={{
          position: 'relative',
          display: 'flex',
          gap: 28,
          flexWrap: 'wrap',
          fontSize: 12,
          color: 'rgba(255,255,255,0.9)',
        }}
      >
        <div>
          <div style={{ fontSize: 28, fontWeight: 600, marginBottom: 2, color: '#fff' }}>10 min</div>
          tiempo medio
        </div>
        <div>
          <div style={{ fontSize: 28, fontWeight: 600, marginBottom: 2, color: '#fff' }}>4.9★</div>
          en App Store
        </div>
        <div>
          <div style={{ fontSize: 28, fontWeight: 600, marginBottom: 2, color: '#fff' }}>0€</div>
          para empezar
        </div>
      </div>
    </>
  )
}

function SignupHero() {
  const features = [
    { i: 'check' as const, t: 'Plantilla profesional, lista en minutos' },
    { i: 'image' as const, t: 'Galería, horarios y mapa integrados' },
    { i: 'whatsapp' as const, t: 'Reservas por WhatsApp con un clic' },
    { i: 'smartphone' as const, t: 'Adaptada al móvil automáticamente' },
  ]
  return (
    <>
      <div
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          fontSize: 13,
          fontWeight: 500,
          color: 'rgba(255,255,255,0.96)',
        }}
      >
        <Icon name="sparkle" size={14} color="rgba(255,255,255,0.96)" /> Empieza gratis · sin tarjeta
      </div>
      <div style={{ position: 'relative' }}>
        <h2
          style={{
            fontSize: 'clamp(26px, 4vw, 36px)',
            fontWeight: 600,
            lineHeight: 1.1,
            letterSpacing: '-0.02em',
            margin: '0 0 20px',
            color: '#fff',
          }}
        >
          Tu web profesional, lista para abrir.
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 380 }}>
          {features.map((f) => (
            <div
              key={f.t}
              style={{
                display: 'flex',
                gap: 10,
                alignItems: 'center',
                fontSize: 14,
                color: 'rgba(255,255,255,0.94)',
              }}
            >
              <span
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 999,
                  background: 'rgba(255,255,255,.22)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Icon name={f.i} size={12} color="#fff" />
              </span>
              {f.t}
            </div>
          ))}
        </div>
      </div>
      <div
        style={{
          position: 'relative',
          padding: '16px 18px',
          background: 'rgba(15,23,42,0.28)',
          borderRadius: 'var(--lw-r)',
          border: '1px solid rgba(255,255,255,0.2)',
          backdropFilter: 'blur(8px)',
        }}
      >
        <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
          {[1, 2, 3, 4, 5].map((i) => (
            <Icon key={i} name="star" size={13} color="#FCD34D" />
          ))}
        </div>
        <p style={{ fontSize: 13.5, lineHeight: 1.5, margin: '0 0 10px', color: 'rgba(255,255,255,0.98)' }}>
          &quot;Tenía mi web publicada en una tarde. Ahora recibo reservas todos los días por WhatsApp.&quot;
        </p>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.88)' }}>
          Carmen · Floristería La Rosa, Sevilla
        </div>
      </div>
    </>
  )
}

type AuthSplitLayoutProps = {
  hero: AuthHeroVariant
  /** Contenido a la derecha del logo (p. ej. enlace a login) */
  headerExtra?: ReactNode
  children: ReactNode
}

export function AuthSplitLayout({ hero, headerExtra, children }: AuthSplitLayoutProps) {
  return (
    <div className="lw-auth-split">
      <div
        style={{
          padding: 'clamp(24px, 5vw, 48px) clamp(20px, 5vw, 64px)',
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          color: 'var(--lw-text)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: headerExtra ? 'space-between' : 'flex-start',
            alignItems: 'center',
            gap: 16,
            marginBottom: 24,
            flexWrap: 'wrap',
          }}
        >
          <Logo size={26} />
          {headerExtra}
        </div>
        {children}
        <span className="lw-small" style={{ marginTop: 'auto', paddingTop: 24 }}>
          © {new Date().getFullYear()} LocalWeb · Hecho en Madrid
        </span>
      </div>
      <div
        className="lw-auth-split-hero"
        style={{
          background: 'linear-gradient(135deg, var(--lw-accent), #7C3AED)',
          padding: 'clamp(24px, 5vw, 64px)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          color: '#fff',
          position: 'relative',
          overflow: 'hidden',
          minHeight: 280,
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(circle at 80% 20%, rgba(255,255,255,.15), transparent 50%)',
          }}
        />
        {hero === 'login' ? <LoginHero /> : <SignupHero />}
      </div>
    </div>
  )
}
