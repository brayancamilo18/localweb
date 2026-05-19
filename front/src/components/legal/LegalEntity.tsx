import type { ReactNode } from 'react'
import {
  legalEntityAddress,
  legalEntityName,
  legalEntityNif,
} from '../../lib/legal'

function isUnset(value: string): boolean {
  return value.startsWith('[') && value.includes(']')
}

function Field({ value }: { value: string }) {
  if (isUnset(value)) {
    return <span className="placeholder">{value}</span>
  }
  return <>{value}</>
}

export function LegalEntityName() {
  return <Field value={legalEntityName} />
}

export function LegalEntityNif() {
  return <Field value={legalEntityNif} />
}

export function LegalEntityAddress() {
  return <Field value={legalEntityAddress} />
}

/** Sustituye <Placeholder>[...]</Placeholder> del diseño de referencia. */
export function LegalPlaceholder({ children }: { children: ReactNode }) {
  const text = typeof children === 'string' ? children : ''
  const map: Record<string, ReactNode> = {
    '[NOMBRE_TITULAR]': <LegalEntityName />,
    '[NIF_TITULAR]': <LegalEntityNif />,
    '[DIRECCION_TITULAR]': <LegalEntityAddress />,
  }
  if (text && map[text]) {
    return <>{map[text]}</>
  }
  if (isUnset(text)) {
    return <span className="placeholder">{children}</span>
  }
  return <>{children}</>
}
