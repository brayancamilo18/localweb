import type { ReactNode } from 'react'
import { Btn } from '../../components/primitives'
import WizardHeader from './WizardHeader'

type Props = {
  currentStep: number
  children: ReactNode
  preview: ReactNode
  onPrev: () => void
  onNext: () => void
  disablePrev?: boolean
  disableNext?: boolean
  nextLabel?: string
}

export default function WizardLayout({
  currentStep,
  children,
  preview,
  onPrev,
  onNext,
  disablePrev,
  disableNext,
  nextLabel = 'Continuar',
}: Props) {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--lw-bg)' }}>
      <WizardHeader currentStep={currentStep} />

      <main style={{ display: 'grid', gridTemplateColumns: '52% 48%', minHeight: 'calc(100vh - 160px)' }}>
        <section style={{ padding: 24, borderRight: '1px solid var(--lw-border)' }}>{children}</section>
        <aside style={{ padding: 24, background: 'var(--lw-surface)' }}>{preview}</aside>
      </main>

      <footer
        style={{
          position: 'sticky',
          bottom: 0,
          zIndex: 20,
          display: 'flex',
          justifyContent: 'space-between',
          padding: 16,
          borderTop: '1px solid var(--lw-border)',
          background: 'var(--lw-bg)',
        }}
      >
        <Btn kind="outline" onClick={onPrev} disabled={disablePrev}>
          Atrás
        </Btn>
        <Btn onClick={onNext} disabled={disableNext}>
          {nextLabel}
        </Btn>
      </footer>
    </div>
  )
}
