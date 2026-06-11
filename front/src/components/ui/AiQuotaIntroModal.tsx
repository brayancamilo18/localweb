import { Modal } from './Modal'
import { Btn, Icon } from '../primitives/primitives'

export type AiQuotaIntroModalProps = {
  open: boolean
  /** Número de generaciones mensuales (cuota global del usuario). */
  monthlyLimit?: number
  /** Cierra el modal y marca como visto. */
  onClose: () => void
}

const USES: { icon: string; label: string }[] = [
  { icon: 'edit', label: 'Descripciones y títulos de tu negocio' },
  { icon: 'list', label: 'Bloques de «Sobre nosotros»' },
  { icon: 'bolt', label: 'Descripciones de tus servicios' },
  { icon: 'sparkle', label: 'Mejorar y reescribir textos' },
]

/**
 * Modal informativo que aparece UNA sola vez al entrar en el paso Pro del
 * onboarding (configurar servicios, etc.). Solo usuarios Pro.
 * Explica al cliente que dispone de una cuota mensual de generaciones con IA
 * (compartida entre todas las funciones: descripciones, títulos, servicios…)
 * y que se renueva cada mes.
 */
export function AiQuotaIntroModal({ open, monthlyLimit = 50, onClose }: AiQuotaIntroModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Tu asistente de IA"
      closeOnBackdrop={false}
      maxWidth={460}
      footer={
        <Btn kind="primary" size="md" type="button" iconRight="arrowRight" onClick={onClose}>
          Entendido, empezar
        </Btn>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
        <div
          style={{
            position: 'relative',
            width: 96,
            height: 96,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background:
              'radial-gradient(circle at 30% 30%, rgba(15,110,86,0.18), rgba(15,110,86,0.06))',
            border: '1px solid rgba(15,110,86,0.18)',
            marginBottom: 18,
          }}
        >
          <span
            style={{
              fontSize: 34,
              fontWeight: 800,
              letterSpacing: '-0.03em',
              color: 'var(--lw-accent, #0f6e56)',
              lineHeight: 1,
            }}
          >
            {monthlyLimit}
          </span>
          <span
            style={{
              position: 'absolute',
              top: -4,
              right: -4,
              width: 34,
              height: 34,
              borderRadius: '50%',
              background: 'var(--lw-accent, #0f6e56)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 6px 16px rgba(15,110,86,0.35)',
            }}
          >
            <Icon name="sparkle" size={18} color="#fff" />
          </span>
        </div>

        <p style={{ margin: 0, fontSize: 15, lineHeight: 1.55, color: 'var(--lw-text-2, #3a4a45)' }}>
          Tienes <strong>{monthlyLimit} generaciones con IA al mes</strong>. Las puedes usar donde
          quieras: cada texto que generes o mejores descuenta una de tu cuota.
        </p>
      </div>

      <div
        style={{
          marginTop: 20,
          display: 'grid',
          gap: 10,
          padding: '16px',
          borderRadius: 16,
          background: 'var(--lw-surface, #f7faf9)',
          border: '1px solid rgba(11,31,26,0.06)',
        }}
      >
        {USES.map((u) => (
          <div key={u.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span
              style={{
                flexShrink: 0,
                width: 28,
                height: 28,
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(15,110,86,0.1)',
              }}
            >
              <Icon name={u.icon} size={15} color="var(--lw-accent, #0f6e56)" />
            </span>
            <span style={{ fontSize: 14, color: 'var(--lw-text-2, #3a4a45)' }}>{u.label}</span>
          </div>
        ))}
      </div>

      <div
        style={{
          marginTop: 14,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          fontSize: 13,
          color: 'var(--lw-text-3, #6b7a75)',
          justifyContent: 'center',
        }}
      >
        <Icon name="refresh" size={14} color="var(--lw-text-3, #6b7a75)" />
        <span>Tu cuota se renueva automáticamente cada mes.</span>
      </div>
    </Modal>
  )
}

export default AiQuotaIntroModal
