import { Icon } from '../../components/primitives'

type Props = {
  currentStep: number
}

export default function WizardHeader({ currentStep }: Props) {
  const progress = Math.round((currentStep / 8) * 100)

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 30,
        background: 'var(--lw-bg)',
        borderBottom: '1px solid var(--lw-border)',
        padding: '14px 20px',
      }}
    >
      <div style={{ fontWeight: 600 }}>Paso {currentStep} de 8</div>

      <div style={{ marginTop: 10, height: 6, background: 'var(--lw-surface)', borderRadius: 999, overflow: 'hidden' }}>
        <div style={{ width: `${progress}%`, height: '100%', background: 'var(--lw-accent)', transition: 'width .25s' }} />
      </div>

      <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {Array.from({ length: 8 }).map((_, index) => {
          const step = index + 1
          const done = step < currentStep
          const active = step === currentStep
          return (
            <span
              key={step}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                borderRadius: 999,
                padding: '5px 10px',
                fontSize: 12,
                border: `1px solid ${active ? '#111' : 'var(--lw-border)'}`,
                background: done ? 'var(--lw-success-soft)' : active ? '#111' : 'var(--lw-bg-elev)',
                color: done ? '#166534' : active ? '#fff' : 'var(--lw-text-3)',
              }}
            >
              {done ? <Icon name="check" size={12} /> : step}
              Paso {step}
            </span>
          )
        })}
      </div>
    </header>
  )
}
