import type { CSSProperties } from 'react'
import {
  legalEntityName,
  legalEntityNif,
  legalPrivacyEmail,
} from '../../lib/legal'
import { LegalCheckbox } from './LegalCheckbox'
import { LegalInlineLink } from './LegalInlineLink'

const noticeStyle: CSSProperties = {
  fontSize: 12,
  color: 'var(--lw-text-3)',
  lineHeight: 1.55,
  margin: 0,
}

export function RegisterTermsCheckbox({
  checked,
  onChange,
  error,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  error?: string
}) {
  return (
    <LegalCheckbox
      id="register-accept-terms"
      checked={checked}
      onChange={onChange}
      ariaLabel="Acepto los Términos y Condiciones y la Política de Privacidad"
      error={error}
    >
      Acepto los <LegalInlineLink kind="terminos">Términos y Condiciones</LegalInlineLink> y la{' '}
      <LegalInlineLink kind="privacidad">Política de Privacidad</LegalInlineLink>.
    </LegalCheckbox>
  )
}

/** Casilla independiente, desmarcada por defecto (Art. 7 RGPD / AEPD). */
export function RegisterMarketingCheckbox({
  checked,
  onChange,
}: {
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <LegalCheckbox
      id="register-accept-marketing"
      checked={checked}
      onChange={onChange}
      ariaLabel="Acepto recibir emails de marketing de ONEZ"
    >
      Acepto recibir emails de ONEZ con novedades, mejoras del servicio y ofertas. Puedo darme de baja en
      cualquier momento desde el propio email o escribiendo a{' '}
      <a href={`mailto:${legalPrivacyEmail}`} style={{ color: 'var(--lw-accent)' }}>
        {legalPrivacyEmail}
      </a>
      . <span style={{ color: 'var(--lw-text-3)' }}>(Opcional — no es necesario para usar el servicio.)</span>
    </LegalCheckbox>
  )
}

/** Cláusula informativa al pie del formulario de registro (paso 2). */
export function RegisterFormFooterNotice() {
  return (
    <p style={noticeStyle}>
      Al registrarte aceptas nuestros <LegalInlineLink kind="terminos">Términos y Condiciones</LegalInlineLink>, el{' '}
      <LegalInlineLink kind="avisoLegal">Aviso Legal</LegalInlineLink> y la{' '}
      <LegalInlineLink kind="privacidad">Política de Privacidad</LegalInlineLink>. Los datos que nos facilitas se
      utilizarán para crear tu cuenta, prestarte el servicio ONEZ y enviarte avisos esenciales sobre tu cuenta.
      Responsable: {legalEntityName}, {legalEntityNif}. Puedes ejercer tus derechos escribiendo a{' '}
      <a href={`mailto:${legalPrivacyEmail}`} style={{ color: 'var(--lw-accent)' }}>
        {legalPrivacyEmail}
      </a>
      .
    </p>
  )
}

/** Cláusula C — formulario de contacto / soporte. */
export function ContactFormFooterNotice() {
  return (
    <p style={noticeStyle}>
      Los datos que nos facilites en este formulario se utilizarán únicamente para atender tu consulta.
      Responsable: {legalEntityName}. Base legal: tu consentimiento al enviar el formulario. Plazo: 3 años. Puedes
      ejercer tus derechos en{' '}
      <a href={`mailto:${legalPrivacyEmail}`} style={{ color: 'var(--lw-accent)' }}>
        {legalPrivacyEmail}
      </a>
      . Más información en nuestra <LegalInlineLink kind="privacidad">Política de Privacidad</LegalInlineLink>.
    </p>
  )
}

/** Cláusula D — checkout plan Pro (onboarding o cuenta). */
export function ProCheckoutLegalNotice() {
  return (
    <p style={{ ...noticeStyle, textAlign: 'left' }}>
      Al pulsar «Pagar» contratas el plan Pro de ONEZ por 8,99 € / mes con renovación automática, hasta que lo
      canceles desde tu panel. Solicito expresamente que el servicio comience de inmediato y soy consciente de que,
      una vez plenamente prestado el periodo en curso, no podré desistir del mismo. He leído y acepto los{' '}
      <LegalInlineLink kind="terminos">Términos</LegalInlineLink> y la{' '}
      <LegalInlineLink kind="privacidad">Política de Privacidad</LegalInlineLink>. El pago se procesa a través de
      Stripe.
    </p>
  )
}

export function ProCheckoutTermsCheckbox({
  checked,
  onChange,
  error,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  error?: string
}) {
  return (
    <LegalCheckbox
      id="pro-checkout-accept"
      checked={checked}
      onChange={onChange}
      ariaLabel="Acepto las condiciones del plan Pro y el inicio inmediato del servicio"
      error={error}
    >
      He leído y acepto las condiciones del plan Pro indicadas arriba (precio, renovación, inicio inmediato y
      desistimiento).
    </LegalCheckbox>
  )
}
