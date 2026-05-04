import { useContext, useLayoutEffect, useState, type ReactNode } from 'react'
import { Badge, Btn, Card, Field, Icon, Input } from '../../../components/primitives/primitives'
import { WizardNavContext, type WizardStepProps } from '../wizardNavContext'

const ACCENT = 'var(--lw-accent)'

const FREE_FEATURES: { ok: boolean; label: string }[] = [
  { ok: true, label: 'Página web publicada' },
  { ok: true, label: 'Subdominio aleatorio (ej: xyz-abc.tuapp.com)' },
  { ok: true, label: 'Hasta 3 fotos' },
  { ok: true, label: 'Horarios y ubicación' },
  { ok: false, label: 'Subdominio personalizado' },
  { ok: false, label: 'Más de 3 fotos (hasta 20)' },
  { ok: false, label: 'Sección de servicios con precios' },
  { ok: false, label: 'Enlace a Google Maps integrado' },
  { ok: false, label: 'Perfil de Google Business' },
  { ok: false, label: 'Descarga de contacto (vCard)' },
  { ok: false, label: 'Analytics (90 días)' },
  { ok: false, label: 'Sin branding de la plataforma' },
]

const PRO_FEATURES: { label: string }[] = [
  { label: 'Página web publicada' },
  { label: 'Subdominio personalizado (tu-marca.tuapp.com)' },
  { label: 'Hasta 20 fotos en galería' },
  { label: 'Horarios y ubicación' },
  { label: 'Sección de servicios con precios' },
  { label: 'Enlace a Google Maps integrado' },
  { label: 'Perfil de Google Business' },
  { label: 'Descarga de contacto (vCard)' },
  { label: 'Analytics (90 días)' },
  { label: 'Sin branding de la plataforma' },
]

function FeatureRow({ ok, children }: { ok: boolean; children: ReactNode }) {
  return (
    <li
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 10,
        fontSize: 13,
        lineHeight: 1.35,
        margin: 0,
        listStyle: 'none',
      }}
    >
      <Icon
        name={ok ? 'check' : 'x'}
        size={15}
        color={ok ? 'var(--lw-success)' : 'var(--lw-text-4)'}
        style={{ marginTop: 2, flexShrink: 0 }}
      />
      <span
        style={{
          color: ok ? 'var(--lw-text-2)' : 'var(--lw-text-4)',
          textDecoration: ok ? 'none' : 'line-through',
        }}
      >
        {children}
      </span>
    </li>
  )
}

function ProFeatureRow({ children }: { children: ReactNode }) {
  return (
    <li
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 10,
        fontSize: 13,
        lineHeight: 1.35,
        margin: 0,
        listStyle: 'none',
        color: 'var(--lw-text-2)',
      }}
    >
      <Icon name="check" size={15} color="var(--lw-success)" style={{ marginTop: 2, flexShrink: 0 }} />
      <span>{children}</span>
    </li>
  )
}

export default function Step7Plan({ errors, isLoading: busy }: WizardStepProps) {
  const nav = useContext(WizardNavContext)
  const [plan, setPlan] = useState<'free' | 'pro' | null>(null)
  const [subdomain, setSubdomain] = useState('')

  useLayoutEffect(() => {
    nav?.registerContinueEnabled?.(plan !== null)
  }, [nav, plan])

  useLayoutEffect(() => {
    nav?.registerContinueHandler?.(() => ({
      plan,
      subdomain: plan === 'pro' ? subdomain.trim() || undefined : undefined,
    }))
    return () => nav?.registerContinueHandler?.(null)
  }, [nav, plan, subdomain])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <header>
        <h1 className="lw-h2" style={{ margin: 0 }}>
          Elige tu plan
        </h1>
        <p className="lw-body" style={{ margin: '10px 0 0', fontSize: 15, color: 'var(--lw-text-2)', maxWidth: 520 }}>
          Empieza gratis o desbloquea todo el potencial de tu página
        </p>
      </header>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
          gap: 20,
          alignItems: 'stretch',
        }}
      >
        {/* Free */}
        <Card
          padding={22}
          style={{
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            gap: 18,
            border:
              plan === 'free'
                ? `2px solid ${ACCENT}`
                : '1px solid var(--lw-border)',
            boxShadow:
              plan === 'free'
                ? '0 0 0 4px var(--lw-accent-ring), var(--lw-shadow-2)'
                : 'var(--lw-shadow-1)',
          }}
        >
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', color: 'var(--lw-text-3)' }}>
              FREE
            </div>
            <div style={{ marginTop: 8, display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span style={{ fontSize: 30, fontWeight: 700, letterSpacing: '-0.03em' }}>Gratis</span>
            </div>
          </div>

          <ul style={{ margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {FREE_FEATURES.map((f) => (
              <FeatureRow key={f.label} ok={f.ok}>
                {f.label}
              </FeatureRow>
            ))}
          </ul>

          <Btn
            kind="outline"
            size="lg"
            fullWidth
            type="button"
            disabled={busy}
            onClick={() => setPlan('free')}
          >
            Continuar gratis
          </Btn>
        </Card>

        {/* Pro */}
        <Card
          padding={22}
          style={{
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            gap: 18,
            border:
              plan === 'pro'
                ? `2px solid ${ACCENT}`
                : '1px solid var(--lw-border)',
            boxShadow:
              plan === 'pro'
                ? '0 0 0 4px var(--lw-accent-ring), var(--lw-shadow-2)'
                : 'var(--lw-shadow-1)',
            background: plan === 'pro' ? 'var(--lw-bg-elev)' : 'linear-gradient(180deg, var(--lw-pro-soft) 0%, var(--lw-bg-elev) 48%)',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: -11,
              left: '50%',
              transform: 'translateX(-50%)',
              whiteSpace: 'nowrap',
            }}
          >
            <Badge tone="pro" size="sm" icon="sparkle">
              Más popular
            </Badge>
          </div>

          <div style={{ paddingTop: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', color: 'var(--lw-text-3)' }}>
                PRO
              </span>
            </div>
            <div style={{ marginTop: 8, display: 'flex', alignItems: 'baseline', gap: 4, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 30, fontWeight: 700, letterSpacing: '-0.03em' }}>8,99€</span>
              <span className="lw-small" style={{ color: 'var(--lw-text-3)' }}>
                /mes
              </span>
            </div>
          </div>

          <ul style={{ margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {PRO_FEATURES.map((f) => (
              <ProFeatureRow key={f.label}>{f.label}</ProFeatureRow>
            ))}
          </ul>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 'auto' }}>
            <Btn kind="primary" size="lg" fullWidth type="button" disabled={busy} onClick={() => setPlan('pro')}>
              Empezar con Pro
            </Btn>
            <p
              className="lw-small"
              style={{ margin: 0, textAlign: 'center', fontSize: 12, color: 'var(--lw-text-3)', lineHeight: 1.4 }}
            >
              Pago seguro con Stripe. Cancela cuando quieras.
            </p>
          </div>
        </Card>
      </div>

      {plan === 'pro' ? (
        <Field
          label="Subdominio Pro (obligatorio)"
          hint="Será la dirección de tu web: tu-subdominio.localhost. Debe estar libre."
          error={errors?.subdomain}
        >
          <Input
            value={subdomain}
            disabled={busy}
            onChange={(e) => setSubdomain(e.target.value.replace(/\s+/g, '').toLowerCase())}
            placeholder="mi-negocio"
          />
        </Field>
      ) : null}

      <p className="lw-small" style={{ margin: 0, textAlign: 'center', color: 'var(--lw-text-3)' }}>
        {plan === null
          ? 'Elige Gratis o Pro para poder continuar.'
          : plan === 'pro'
            ? 'Pulsa «Continuar» para ir a la pasarela de pago de Stripe.'
            : 'Plan gratis: sin tarjeta. Puedes mejorar a Pro cuando quieras.'}
      </p>

      {errors?.message ? (
        <div className="lw-small" style={{ color: 'var(--lw-danger)', textAlign: 'center' }}>
          {errors.message}
        </div>
      ) : null}
    </div>
  )
}
