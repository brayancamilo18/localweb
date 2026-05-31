import { useState } from 'react'
import { Icon, Input } from '../primitives/primitives'
import { ConfirmModalShell } from './ConfirmModalShell'

export type DeleteAccountDialogProps = {
  open: boolean
  onCancel: () => void
  onConfirm: () => void
  loading?: boolean
  currentPassword: string
  onCurrentPasswordChange: (value: string) => void
  confirmation: string
  onConfirmationChange: (value: string) => void
  passwordError?: string
  confirmationError?: string
  canConfirm: boolean
}

const CONSEQUENCES = [
  { icon: 'image' as const, label: 'Tu página se despublicará' },
  { icon: 'shield' as const, label: 'Se cerrarán todas tus sesiones' },
  { icon: 'star' as const, label: 'Si tienes Pro, se cancelará al instante' },
]

export function DeleteAccountDialog({
  open,
  onCancel,
  onConfirm,
  loading = false,
  currentPassword,
  onCurrentPasswordChange,
  confirmation,
  onConfirmationChange,
  passwordError,
  confirmationError,
  canConfirm,
}: DeleteAccountDialogProps) {
  const [showPassword, setShowPassword] = useState(false)

  return (
    <ConfirmModalShell
      open={open}
      onClose={onCancel}
      loading={loading}
      wide
      eyebrow="Acción permanente"
      title="Eliminar cuenta permanentemente"
      eyebrowTone="danger"
      headerIconVariant="danger"
      headerIcon={<Icon name="shield" size={20} color="#B23A2E" stroke={2.2} />}
      footer={
        <>
          <button
            type="button"
            className="lw-cmd-btn lw-cmd-btn--ghost"
            onClick={onCancel}
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="lw-cmd-btn lw-cmd-btn--danger"
            onClick={onConfirm}
            disabled={!canConfirm || loading}
            style={
              !canConfirm && !loading
                ? { background: 'rgba(178, 58, 46, 0.45)', boxShadow: 'none' }
                : undefined
            }
          >
            {loading ? (
              <>
                <span className="lw-cmd-spinner" aria-hidden />
                Eliminando…
              </>
            ) : (
              <>
                <Icon name="shield" size={16} color="#fff" stroke={2.4} />
                Eliminar para siempre
              </>
            )}
          </button>
        </>
      }
    >
      <div className="lw-cmd-card">
        <div className="lw-cmd-card__eyebrow">Qué pasará</div>
        <ul className="lw-cmd-list">
          {CONSEQUENCES.map((item) => (
            <li key={item.label} className="lw-cmd-list__item">
              <span className="lw-cmd-list__icon" aria-hidden>
                <Icon name={item.icon} size={14} color="#B23A2E" stroke={2.2} />
              </span>
              <span>{item.label}</span>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <div className="lw-cmd-field-label">
          <span>Contraseña actual</span>
          <span className="lw-cmd-field-label__badge">Requerida</span>
        </div>
        <div className="lw-cmd-input-wrap">
          <Input
            type={showPassword ? 'text' : 'password'}
            value={currentPassword}
            onChange={(e) => onCurrentPasswordChange(e.target.value)}
            autoComplete="current-password"
            placeholder="Tu contraseña"
            disabled={loading}
            style={{ paddingRight: 44 }}
          />
          <button
            type="button"
            className="lw-cmd-input-toggle"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            disabled={loading}
          >
            <Icon name="eye" size={16} />
          </button>
        </div>
        {passwordError ? <p className="lw-cmd-field-error">{passwordError}</p> : null}
      </div>

      <div>
        <div className="lw-cmd-field-label">
          <span>
            Escribe <span style={{ color: '#B23A2E' }}>&quot;ELIMINAR&quot;</span> para confirmar
          </span>
        </div>
        <div className="lw-cmd-input-wrap">
          <Input
            type="text"
            value={confirmation}
            onChange={(e) => onConfirmationChange(e.target.value)}
            autoComplete="off"
            placeholder="ELIMINAR"
            spellCheck={false}
            disabled={loading}
            style={{
              paddingRight: confirmation === 'ELIMINAR' ? 44 : undefined,
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
              letterSpacing: '0.06em',
            }}
          />
          {confirmation === 'ELIMINAR' ? (
            <span className="lw-cmd-input-check" aria-hidden>
              <Icon name="check" size={14} color="#fff" stroke={3} />
            </span>
          ) : null}
        </div>
        {confirmationError ? (
          <p className="lw-cmd-field-error">{confirmationError}</p>
        ) : (
          <p className="lw-cmd-field-hint">Debe coincidir exactamente, en mayúsculas.</p>
        )}
      </div>
    </ConfirmModalShell>
  )
}

export default DeleteAccountDialog
