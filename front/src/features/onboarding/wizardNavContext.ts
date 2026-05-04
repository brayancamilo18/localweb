import { createContext, type ReactNode } from 'react'

export type WizardNavValue = {
  onJumpToStep?: (step: number, opts?: { allowForward?: boolean }) => void
  footer?: ReactNode
  registerContinueHandler?: (handler: (() => unknown) | null) => void
  registerContinueEnabled?: (enabled: boolean) => void
}

export const WizardNavContext = createContext<WizardNavValue | null>(null)

export type WizardStepProps = {
  onSubmit?: (data: unknown) => void
  errors?: Record<string, string>
  isLoading?: boolean
}
