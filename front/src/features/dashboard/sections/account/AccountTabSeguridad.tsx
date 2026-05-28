import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { AxiosError } from 'axios'
import { Badge, Btn, Card, Field, Icon, Input } from '../../../../components/primitives/primitives'
import { Modal } from '../../../../components/ui/Modal'
import { useToast } from '../../../../components/ui/Toast'
import { getSecurityEvents, getSessions, revokeOtherSessions } from '../../../../api/account'
import type { SecurityEventType } from '../../../../api/account'
import { keys } from '../../../../api/queryKeys'
import type { ApiError } from '../../../../types/api'

function formatRelativeActivity(iso: string): string {
  const date = new Date(iso)
  const diffSec = Math.round((date.getTime() - Date.now()) / 1000)
  const abs = Math.abs(diffSec)
  const rtf = new Intl.RelativeTimeFormat('es', { numeric: 'auto' })

  if (abs < 60) return rtf.format(diffSec, 'second')
  if (abs < 3600) return rtf.format(Math.round(diffSec / 60), 'minute')
  if (abs < 86400) return rtf.format(Math.round(diffSec / 3600), 'hour')
  return rtf.format(Math.round(diffSec / 86400), 'day')
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

const SECURITY_EVENT_LABELS: Record<SecurityEventType, string> = {
  login: 'Inicio de sesión',
  password_changed: 'Contraseña cambiada',
  email_changed: 'Email de acceso cambiado',
  sessions_revoked: 'Otras sesiones cerradas',
}

const SECURITY_EVENT_ICONS: Record<SecurityEventType, 'user' | 'lock' | 'mail' | 'logOut'> = {
  login: 'user',
  password_changed: 'lock',
  email_changed: 'mail',
  sessions_revoked: 'logOut',
}

export default function AccountTabSeguridad() {
  const { showToast } = useToast()
  const qc = useQueryClient()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [passwordError, setPasswordError] = useState<string | undefined>()

  const sessionsQ = useQuery({
    queryKey: keys.account.sessions,
    queryFn: getSessions,
  })

  const eventsQ = useQuery({
    queryKey: keys.account.securityEvents,
    queryFn: getSecurityEvents,
  })

  const sessions = sessionsQ.data ?? []
  const otherSessionsCount = sessions.filter((s) => !s.isCurrent).length

  const revokeM = useMutation({
    mutationFn: () => revokeOtherSessions(currentPassword),
    onSuccess: async (data) => {
      setConfirmOpen(false)
      setCurrentPassword('')
      setPasswordError(undefined)
      await qc.invalidateQueries({ queryKey: keys.account.sessions })
      await qc.invalidateQueries({ queryKey: keys.account.securityEvents })
      showToast({
        type: 'success',
        title: 'Sesiones cerradas',
        description:
          data.revoked === 1
            ? 'Se cerró 1 sesión en otro dispositivo.'
            : `Se cerraron ${data.revoked} sesiones en otros dispositivos.`,
      })
    },
    onError: (err) => {
      const fieldErrors = getFieldErrors(err)
      if (fieldErrors.current_password) {
        setPasswordError(fieldErrors.current_password)
        return
      }
      showToast({ type: 'error', title: 'No se pudieron cerrar las sesiones' })
    },
  })

  const openConfirm = () => {
    setCurrentPassword('')
    setPasswordError(undefined)
    setConfirmOpen(true)
  }

  const closeConfirm = () => {
    if (revokeM.isPending) return
    setConfirmOpen(false)
    setCurrentPassword('')
    setPasswordError(undefined)
  }

  return (
    <>
      <Card padding={20} className="lw-account-section-card" style={{ marginBottom: 16 }}>
        <div style={{ marginBottom: 16 }}>
          <h2 className="lw-h3" style={{ margin: '0 0 4px', fontSize: 16 }}>
            Actividad reciente
          </h2>
          <p className="lw-small" style={{ margin: 0, lineHeight: 1.55 }}>
            Últimos accesos y cambios de seguridad en tu cuenta.
          </p>
        </div>

        {eventsQ.isLoading ? (
          <p className="lw-small" style={{ margin: 0 }}>
            Cargando actividad…
          </p>
        ) : eventsQ.isError ? (
          <p className="lw-small" style={{ margin: 0, color: 'var(--lw-danger)' }}>
            No se pudo cargar la actividad. Inténtalo de nuevo.
          </p>
        ) : (eventsQ.data ?? []).length === 0 ? (
          <p className="lw-small" style={{ margin: 0 }}>
            Aún no hay actividad registrada.
          </p>
        ) : (
          <ul
            style={{
              margin: 0,
              padding: 0,
              listStyle: 'none',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
          >
            {(eventsQ.data ?? []).map((event) => (
              <li
                key={`${event.type}-${event.createdAt}`}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 12,
                  padding: '12px 14px',
                  borderRadius: 12,
                  border: '1px solid var(--lw-border)',
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'var(--lw-surface-2)',
                    flexShrink: 0,
                  }}
                  aria-hidden
                >
                  <Icon
                    name={SECURITY_EVENT_ICONS[event.type]}
                    size={18}
                    color="var(--lw-text-3)"
                  />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--lw-text)', marginBottom: 4 }}>
                    {SECURITY_EVENT_LABELS[event.type]}
                  </div>
                  <div className="lw-small" style={{ fontSize: 12, lineHeight: 1.5 }}>
                    {event.userAgentLabel}
                    {' · '}
                    {event.ipAddress ? `IP ${event.ipAddress}` : 'IP desconocida'}
                    {' · '}
                    {formatRelativeActivity(event.createdAt)}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card padding={20} className="lw-account-section-card">
        <div style={{ marginBottom: 16 }}>
          <h2 className="lw-h3" style={{ margin: '0 0 4px', fontSize: 16 }}>
            Sesiones activas
          </h2>
          <p className="lw-small" style={{ margin: 0, lineHeight: 1.55 }}>
            Dispositivos y navegadores donde has iniciado sesión. Puedes cerrar el resto y mantener solo esta sesión.
          </p>
        </div>

        {sessionsQ.isLoading ? (
          <p className="lw-small" style={{ margin: 0 }}>
            Cargando sesiones…
          </p>
        ) : sessionsQ.isError ? (
          <p className="lw-small" style={{ margin: 0, color: 'var(--lw-danger)' }}>
            No se pudieron cargar las sesiones. Inténtalo de nuevo.
          </p>
        ) : sessions.length === 0 ? (
          <p className="lw-small" style={{ margin: 0 }}>
            No hay otras sesiones registradas.
          </p>
        ) : (
          <ul
            style={{
              margin: 0,
              padding: 0,
              listStyle: 'none',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
          >
            {sessions.map((session) => (
              <li
                key={`${session.id}-${session.lastActivity}`}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 12,
                  padding: '12px 14px',
                  borderRadius: 12,
                  border: '1px solid var(--lw-border)',
                  background: session.isCurrent ? 'var(--lw-surface-2)' : 'transparent',
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'var(--lw-surface-2)',
                    flexShrink: 0,
                  }}
                  aria-hidden
                >
                  <Icon name="monitor" size={18} color="var(--lw-text-3)" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      flexWrap: 'wrap',
                      marginBottom: 4,
                    }}
                  >
                    <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--lw-text)' }}>
                      {session.userAgentLabel}
                    </span>
                    {session.isCurrent ? (
                      <Badge tone="success" size="sm">
                        Sesión actual
                      </Badge>
                    ) : null}
                  </div>
                  <div className="lw-small" style={{ fontSize: 12, lineHeight: 1.5 }}>
                    {session.ipAddress ? `IP ${session.ipAddress}` : 'IP desconocida'}
                    {' · '}
                    {formatRelativeActivity(session.lastActivity)}
                    {' · '}
                    ID …{session.id}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}

        <div className="lw-account-actions-row" style={{ marginTop: 16 }}>
          <Btn
            kind="outline"
            type="button"
            icon="logOut"
            disabled={sessionsQ.isLoading || otherSessionsCount === 0 || revokeM.isPending}
            onClick={openConfirm}
          >
            Cerrar el resto de sesiones
          </Btn>
        </div>
      </Card>

      <Modal
        open={confirmOpen}
        onClose={closeConfirm}
        title="Cerrar otras sesiones"
        closeOnBackdrop={!revokeM.isPending}
        footer={
          <>
            <Btn kind="ghost" type="button" disabled={revokeM.isPending} onClick={closeConfirm}>
              Cancelar
            </Btn>
            <Btn
              kind="primary"
              type="button"
              loading={revokeM.isPending}
              disabled={!currentPassword.trim() || revokeM.isPending}
              onClick={() => revokeM.mutate()}
            >
              Confirmar
            </Btn>
          </>
        }
      >
        <p className="lw-small" style={{ margin: '0 0 16px', lineHeight: 1.55 }}>
          Se cerrará la sesión en {otherSessionsCount === 1 ? '1 dispositivo' : `${otherSessionsCount} dispositivos`}.
          Esta sesión no se verá afectada. Introduce tu contraseña actual para confirmar.
        </p>
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
      </Modal>
    </>
  )
}
