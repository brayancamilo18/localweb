import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { AxiosError } from 'axios'
import { Badge, Btn, Card, Field, Icon, Input } from '../../../../components/primitives/primitives'
import { useToast } from '../../../../components/ui/Toast'
import {
  getAccountProfile,
  updateAccountPassword,
  updateAccountProfile,
} from '../../../../api/account'
import { keys } from '../../../../api/queryKeys'
import { useAuthStore } from '../../../../store/authStore'
import type { ApiError } from '../../../../types/api'

/**
 * Convierte un error de Axios con respuesta 422 al mapa { campo: primerMensaje }
 * que usamos para pintar errores junto a cada `Field`/`Input`. Si la respuesta no
 * trae `errors`, devuelve un objeto vacío (toast genérico cubre el feedback).
 */
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

export default function AccountTabPerfil() {
  const { showToast } = useToast()
  const qc = useQueryClient()
  const setAuth = useAuthStore((s) => s.setAuth)
  const business = useAuthStore((s) => s.business)

  const profileQ = useQuery({
    queryKey: keys.account.profile,
    queryFn: getAccountProfile,
  })

  // ── Datos personales ──────────────────────────────────────────
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [profileErrors, setProfileErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (profileQ.data) {
      setName(profileQ.data.user.name)
      setEmail(profileQ.data.user.email)
    }
  }, [profileQ.data])

  const initialName = profileQ.data?.user.name ?? ''
  const initialEmail = profileQ.data?.user.email ?? ''
  const profileDirty = name.trim() !== initialName || email.trim() !== initialEmail
  const emailWillChange = email.trim() !== '' && email.trim() !== initialEmail

  const profileM = useMutation({
    mutationFn: () => {
      const payload: { name?: string; email?: string } = {}
      if (name.trim() !== initialName) payload.name = name.trim()
      if (email.trim() !== initialEmail) payload.email = email.trim()
      return updateAccountProfile(payload)
    },
    onSuccess: async (res) => {
      setProfileErrors({})
      await qc.invalidateQueries({ queryKey: keys.account.profile })
      await qc.invalidateQueries({ queryKey: keys.auth.me })
      // Mantener authStore sincronizado para que el resto del dashboard (header,
      // /auth/me cache local) vea el nuevo nombre/email sin esperar refetch.
      setAuth(res.user, business)
      if (res.email_changed) {
        showToast({
          type: 'success',
          title: 'Email actualizado',
          description: 'Te hemos enviado un correo para verificar la nueva dirección.',
        })
      } else {
        showToast({ type: 'success', title: 'Datos actualizados' })
      }
    },
    onError: (err) => {
      setProfileErrors(getFieldErrors(err))
      showToast({
        type: 'error',
        title: 'No se pudieron guardar los cambios',
        description: 'Revisa los datos e inténtalo de nuevo.',
        action: { label: 'Reintentar', onClick: () => profileM.mutate() },
      })
    },
  })

  // ── Cambio de contraseña ──────────────────────────────────────
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('')
  const [pwErrors, setPwErrors] = useState<Record<string, string>>({})

  const passwordValid = useMemo(
    () =>
      currentPassword.length > 0 &&
      newPassword.length >= 8 &&
      newPassword === newPasswordConfirm &&
      newPassword !== currentPassword,
    [currentPassword, newPassword, newPasswordConfirm],
  )

  const passwordM = useMutation({
    mutationFn: () =>
      updateAccountPassword({
        current_password: currentPassword,
        password: newPassword,
        password_confirmation: newPasswordConfirm,
      }),
    onSuccess: () => {
      setPwErrors({})
      setCurrentPassword('')
      setNewPassword('')
      setNewPasswordConfirm('')
      showToast({
        type: 'success',
        title: 'Contraseña actualizada',
        description: 'Usa tu nueva contraseña la próxima vez que inicies sesión.',
      })
    },
    onError: (err) => {
      setPwErrors(getFieldErrors(err))
      showToast({
        type: 'error',
        title: 'No se pudo cambiar la contraseña',
        description: 'Revisa los datos e inténtalo de nuevo.',
      })
    },
  })

  // ── Estados de carga / error de la query principal ────────────
  if (profileQ.isLoading) {
    return (
      <Card padding={20}>
        <p className="lw-small">Cargando datos…</p>
      </Card>
    )
  }

  if (profileQ.isError) {
    return (
      <Card padding={20}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Icon name="alert" size={16} color="var(--lw-danger)" />
          <p className="lw-small" style={{ color: 'var(--lw-danger)' }}>
            No se pudieron cargar tus datos.
          </p>
        </div>
        <Btn
          kind="outline"
          size="sm"
          icon="refresh"
          type="button"
          onClick={() => profileQ.refetch()}
          style={{ marginTop: 10 }}
        >
          Reintentar
        </Btn>
      </Card>
    )
  }

  const verifiedAt = profileQ.data?.user.email_verified_at
  const isVerified = verifiedAt != null

  // Hint de la nueva contraseña: prioriza error de servidor; si no hay, avisa
  // de longitud insuficiente o de igualdad con la actual antes de pulsar Guardar.
  const newPasswordHint = pwErrors.password
    ? undefined
    : newPassword.length > 0 && newPassword.length < 8
      ? 'Mínimo 8 caracteres'
      : newPassword.length >= 8 && newPassword === currentPassword
        ? 'Debe ser distinta de la actual'
        : undefined

  const confirmError =
    newPasswordConfirm.length > 0 && newPassword !== newPasswordConfirm
      ? 'Las contraseñas no coinciden'
      : undefined

  return (
    <>
      {/* Datos personales */}
      <Card padding={20} className="lw-account-section-card">
        <div>
          <h2 className="lw-h3" style={{ marginBottom: 4 }}>
            Datos personales
          </h2>
          <p className="lw-small">Tu nombre y email aparecen en notificaciones y facturas.</p>
        </div>

        <div className="lw-account-form-grid">
          <Field label="Nombre" error={profileErrors.name}>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Tu nombre"
              autoComplete="name"
              maxLength={100}
            />
          </Field>

          <Field
            label="Email"
            error={profileErrors.email}
            hint={
              !profileErrors.email && emailWillChange
                ? 'Tendrás que verificar la nueva dirección desde el correo que te enviaremos.'
                : undefined
            }
          >
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tucorreo@ejemplo.com"
              autoComplete="email"
              maxLength={255}
              suffix={
                isVerified && !emailWillChange ? (
                  <Badge tone="success" dot>
                    Verificado
                  </Badge>
                ) : !isVerified ? (
                  <Badge tone="warning">Sin verificar</Badge>
                ) : null
              }
            />
          </Field>
        </div>

        <div className="lw-account-actions-row">
          <Btn
            kind="primary"
            type="button"
            disabled={!profileDirty || profileM.isPending}
            loading={profileM.isPending}
            onClick={() => profileM.mutate()}
          >
            Guardar cambios
          </Btn>
          {profileDirty && !profileM.isPending && (
            <Btn
              kind="ghost"
              type="button"
              onClick={() => {
                setName(initialName)
                setEmail(initialEmail)
                setProfileErrors({})
              }}
            >
              Descartar
            </Btn>
          )}
        </div>
      </Card>

      {/* Cambiar contraseña */}
      {/*
        Usamos `Input` con `label` directo (no `Field`) en estos tres campos
        para que el `<label>` se asocie al `<input>` vía `htmlFor`/`id`. Esto
        habilita queries accesibles tipo `getByLabelText('Contraseña actual')`
        en los tests; visualmente es idéntico a `Field` (mismo gap, misma
        tipografía).
      */}
      <Card padding={20} className="lw-account-section-card">
        <div>
          <h2 className="lw-h3" style={{ marginBottom: 4 }}>
            Cambiar contraseña
          </h2>
          <p className="lw-small">
            Mínimo 8 caracteres y distinta de la actual. Cerrarás sesión en otros dispositivos.
          </p>
        </div>

        <Input
          label="Contraseña actual"
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          autoComplete="current-password"
          error={pwErrors.current_password}
        />

        <div className="lw-account-form-grid">
          <Input
            label="Nueva contraseña"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            autoComplete="new-password"
            error={pwErrors.password}
            hint={newPasswordHint}
          />

          <Input
            label="Confirmar nueva contraseña"
            type="password"
            value={newPasswordConfirm}
            onChange={(e) => setNewPasswordConfirm(e.target.value)}
            autoComplete="new-password"
            error={confirmError}
          />
        </div>

        <div className="lw-account-actions-row">
          <Btn
            kind="primary"
            type="button"
            disabled={!passwordValid || passwordM.isPending}
            loading={passwordM.isPending}
            onClick={() => passwordM.mutate()}
          >
            Cambiar contraseña
          </Btn>
        </div>
      </Card>
    </>
  )
}
