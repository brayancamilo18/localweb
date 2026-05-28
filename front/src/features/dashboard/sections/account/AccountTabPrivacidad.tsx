import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import type { AxiosError } from 'axios'
import { Badge, Btn, Card, Field, Input } from '../../../../components/primitives/primitives'
import { Modal } from '../../../../components/ui/Modal'
import { useToast } from '../../../../components/ui/Toast'
import { useCookieConsent } from '../../../../hooks/useCookieConsent'
import { deleteAccount } from '../../../../api/account'
import { resetConsent } from '../../../../lib/cookieConsent'
import { legalEntityName, legalEntityNif } from '../../../../lib/legal'
import { useAuthStore } from '../../../../store/authStore'
import type { ApiError } from '../../../../types/api'
import './account.css'

function formatLegalDate(iso: string | null | undefined): string | null {
  if (!iso) return null
  try {
    return new Intl.DateTimeFormat('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(iso))
  } catch {
    return null
  }
}

function getFieldErrors(err: unknown): Record<string, string> {
  const ax = err as AxiosError<ApiError> | undefined
  const errs = ax?.response?.data?.errors
  if (!errs) return {}
  const out: Record<string, string> = {}
  for (const [k, v] of Object.entries(errs)) {
    if (Array.isArray(v) && v.length > 0) out[k] = String(v[0])
  }
  return out
}

const CATEGORY_LABELS = [
  { key: 'necessary' as const, label: 'Necesarias' },
  { key: 'analytics' as const, label: 'Analíticas' },
  { key: 'marketing' as const, label: 'Marketing' },
  { key: 'preferences' as const, label: 'Preferencias' },
]

export default function AccountTabPrivacidad() {
  const { showToast } = useToast()
  const { consent } = useCookieConsent()
  const user = useAuthStore((s) => s.user)
  const clearAuth = useAuthStore((s) => s.clearAuth)
  const termsWhen = formatLegalDate(user?.terms_accepted_at)

  const [confirmOpen, setConfirmOpen] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [passwordError, setPasswordError] = useState<string | undefined>()
  const [confirmationError, setConfirmationError] = useState<string | undefined>()

  const deleteM = useMutation({
    mutationFn: () => deleteAccount(currentPassword, confirmation),
    onSuccess: () => {
      clearAuth()
      window.location.href = '/'
    },
    onError: (err) => {
      const fieldErrors = getFieldErrors(err)
      if (fieldErrors.current_password) {
        setPasswordError(fieldErrors.current_password)
        return
      }
      if (fieldErrors.confirmation) {
        setConfirmationError(fieldErrors.confirmation)
        return
      }
      const ax = err as AxiosError<ApiError> | undefined
      const message = ax?.response?.data?.message
      showToast({
        type: 'error',
        title: 'No se pudo eliminar la cuenta',
        description: message ?? 'Inténtalo de nuevo o contacta con soporte.',
      })
    },
  })

  const handleChangePreferences = () => {
    resetConsent()
  }

  const openConfirm = () => {
    setCurrentPassword('')
    setConfirmation('')
    setPasswordError(undefined)
    setConfirmationError(undefined)
    setConfirmOpen(true)
  }

  const closeConfirm = () => {
    if (deleteM.isPending) return
    setConfirmOpen(false)
    setCurrentPassword('')
    setConfirmation('')
    setPasswordError(undefined)
    setConfirmationError(undefined)
  }

  const canConfirm =
    currentPassword.trim().length > 0 && confirmation === 'ELIMINAR' && !deleteM.isPending

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Card padding={20}>
        <h2 className="lw-h3" style={{ margin: '0 0 12px', fontSize: 16 }}>
          Tus datos
        </h2>
        <p className="lw-small" style={{ margin: 0, lineHeight: 1.6, fontSize: 13 }}>
          Recogemos tu nombre, email y los datos de tu negocio para prestar el servicio ONEZ.
          Registramos analíticas de visitas a tu página pública con direcciones IP anonimizadas
          (hash irreversible). No vendemos tus datos a terceros. Conservamos la información mientras
          mantengas tu cuenta activa y el tiempo necesario para obligaciones legales.
        </p>
        <p className="lw-small" style={{ margin: '12px 0 0', lineHeight: 1.6, fontSize: 13 }}>
          Puedes ejercer tus derechos de acceso, rectificación, supresión, limitación, oposición y
          portabilidad contactando con{' '}
          <a href="mailto:privacidad@onez.es" style={{ color: 'var(--lw-accent)' }}>
            privacidad@onez.es
          </a>
          . Responsable del tratamiento: {legalEntityName}
          {legalEntityNif ? `, ${legalEntityNif}` : ''}.
        </p>
      </Card>

      <Card padding={20}>
        <h2 className="lw-h3" style={{ margin: '0 0 12px', fontSize: 16 }}>
          Consentimientos registrados
        </h2>
        <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13 }}>
          <li>
            <strong>Términos y Política de Privacidad</strong>
            <div className="lw-small" style={{ marginTop: 4, color: 'var(--lw-text-2)' }}>
              {termsWhen ? (
                <>
                  Aceptados el {termsWhen}
                  {user?.terms_version ? ` (Términos v.${user.terms_version}` : ''}
                  {user?.privacy_policy_version
                    ? `${user?.terms_version ? ', ' : ' ('}Privacidad v.${user.privacy_policy_version})`
                    : user?.terms_version
                      ? ')'
                      : ''}
                </>
              ) : (
                'Sin registro en base de datos (cuenta anterior a esta función).'
              )}
            </div>
          </li>
          <li>
            <strong>Emails de marketing</strong>
            <div style={{ marginTop: 6 }}>
              <Badge tone={user?.marketing_consent_at ? 'success' : 'default'} size="sm">
                {user?.marketing_consent_at
                  ? `Aceptado el ${formatLegalDate(user.marketing_consent_at) ?? '—'}`
                  : 'No activado'}
              </Badge>
            </div>
          </li>
        </ul>
      </Card>

      <Card padding={20}>
        <h2 className="lw-h3" style={{ margin: '0 0 12px', fontSize: 16 }}>
          Preferencias de cookies
        </h2>
        {!consent ? (
          <p className="lw-small" style={{ margin: 0, fontSize: 13 }}>
            Aún no has guardado preferencias de cookies en este navegador.
          </p>
        ) : (
          <ul style={{ margin: '0 0 16px', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {CATEGORY_LABELS.map(({ key, label }) => {
              const active = key === 'necessary' ? true : Boolean(consent[key])
              return (
                <li
                  key={key}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                    fontSize: 13,
                  }}
                >
                  <span>{label}</span>
                  <Badge tone={active ? 'success' : 'default'} size="sm">
                    {active ? 'Activadas' : 'Desactivadas'}
                  </Badge>
                </li>
              )
            })}
          </ul>
        )}
        <Btn kind="outline" size="md" type="button" onClick={handleChangePreferences}>
          Cambiar preferencias
        </Btn>
      </Card>

      <Card padding={20} className="lw-account-danger-zone">
        <h2 className="lw-h3" style={{ margin: '0 0 12px', fontSize: 16, color: 'var(--lw-danger)' }}>
          Zona de peligro
        </h2>
        <p className="lw-small" style={{ margin: '0 0 12px', lineHeight: 1.6, fontSize: 13 }}>
          Eliminar tu cuenta es <strong>irreversible</strong>. Se suprimirán tus datos personales,
          tu página dejará de estar publicada y, si tienes plan Pro, se cancelará la suscripción
          de inmediato para evitar nuevos cargos.
        </p>
        <p className="lw-small" style={{ margin: '0 0 16px', lineHeight: 1.6, fontSize: 13, color: 'var(--lw-text-2)' }}>
          Conservaremos únicamente la información exigida por obligaciones legales y fiscales
          (p. ej. facturas).
        </p>
        <Btn kind="danger" size="md" type="button" onClick={openConfirm}>
          Eliminar mi cuenta y datos
        </Btn>
      </Card>

      <Modal
        open={confirmOpen}
        onClose={closeConfirm}
        title="Eliminar cuenta permanentemente"
        closeOnBackdrop={!deleteM.isPending}
        footer={
          <>
            <Btn kind="ghost" type="button" disabled={deleteM.isPending} onClick={closeConfirm}>
              Cancelar
            </Btn>
            <Btn
              kind="danger"
              type="button"
              loading={deleteM.isPending}
              disabled={!canConfirm}
              onClick={() => deleteM.mutate()}
            >
              Eliminar para siempre
            </Btn>
          </>
        }
      >
        <p className="lw-small" style={{ margin: '0 0 16px', lineHeight: 1.55 }}>
          Esta acción no se puede deshacer. Tu página se despublicará, se cerrarán todas tus
          sesiones y, si tienes suscripción Pro, se cancelará al instante.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Field label="Contraseña actual" error={passwordError}>
            <Input
              type="password"
              value={currentPassword}
              onChange={(e) => {
                setCurrentPassword(e.target.value)
                setPasswordError(undefined)
              }}
              autoComplete="current-password"
              placeholder="Tu contraseña"
            />
          </Field>
          <Field
            label='Escribe "ELIMINAR" para confirmar'
            error={confirmationError}
            hint="Debe coincidir exactamente, en mayúsculas."
          >
            <Input
              type="text"
              value={confirmation}
              onChange={(e) => {
                setConfirmation(e.target.value)
                setConfirmationError(undefined)
              }}
              autoComplete="off"
              placeholder="ELIMINAR"
              spellCheck={false}
            />
          </Field>
        </div>
      </Modal>
    </div>
  )
}
