import { useState, type ReactNode } from 'react'
import { Modal } from './Modal'
import { Btn, Field, Icon, Input } from '../primitives/primitives'

export type ConfirmDialogProps = {
  /** Controla la visibilidad. */
  open: boolean
  /** Llamado cuando el usuario cancela o cierra (Escape, botón cancelar, backdrop). */
  onCancel: () => void
  /** Llamado cuando el usuario confirma. */
  onConfirm: () => void
  /** Título del diálogo (corto, una línea). */
  title: string
  /** Cuerpo: puede ser string o ReactNode si necesitas <strong>, listas, etc. */
  description: ReactNode
  /** Texto del botón de confirmar. Por defecto "Confirmar". */
  confirmLabel?: string
  /** Texto del botón de cancelar. Por defecto "Cancelar". */
  cancelLabel?: string
  /** Tono visual:
   *  - 'default' (azul/primary)
   *  - 'danger'  (rojo, icono alert, para acciones destructivas reversibles)
   *  - 'destructive' (rojo, icono alert, exige tipear texto para confirmar)
   */
  tone?: 'default' | 'danger' | 'destructive'
  /** Mientras true, deshabilita cancelar/backdrop y muestra loading en confirmar. */
  loading?: boolean
  /** Solo cuando tone === 'destructive': palabra exacta que el usuario debe tipear. */
  destructiveConfirmWord?: string
}

const DANGER_COLOR = 'var(--lw-danger, #dc2626)'

function DestructiveWordField({
  word,
  loading,
  onMatchChange,
}: {
  word: string
  loading: boolean
  onMatchChange: (matches: boolean) => void
}) {
  const [typedWord, setTypedWord] = useState('')

  return (
    <div style={{ marginTop: 16 }}>
      <Field
        label={`Escribe "${word}" para confirmar`}
        hint="Debe coincidir exactamente, respetando mayúsculas."
      >
        <Input
          type="text"
          value={typedWord}
          onChange={(e) => {
            const next = e.target.value
            setTypedWord(next)
            onMatchChange(next.trim() === word)
          }}
          autoComplete="off"
          spellCheck={false}
          placeholder={word}
          disabled={loading}
        />
      </Field>
    </div>
  )
}

export function ConfirmDialog({
  open,
  onCancel,
  onConfirm,
  title,
  description,
  confirmLabel,
  cancelLabel = 'Cancelar',
  tone = 'default',
  loading = false,
  destructiveConfirmWord,
}: ConfirmDialogProps) {
  const [destructiveMatches, setDestructiveMatches] = useState(false)

  const resolvedConfirmLabel =
    confirmLabel ?? (tone === 'destructive' ? 'Eliminar' : 'Confirmar')

  const destructiveBlocked =
    tone === 'destructive' &&
    !destructiveMatches

  const handleCancel = () => {
    if (loading) return
    setDestructiveMatches(false)
    onCancel()
  }

  const handleClose = loading ? () => {} : handleCancel

  const handleConfirm = () => {
    setDestructiveMatches(false)
    onConfirm()
  }

  const bodyContent =
    typeof description === 'string' ? (
      <p className="lw-small" style={{ margin: 0, lineHeight: 1.55 }}>
        {description}
      </p>
    ) : (
      description
    )

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={title}
      closeOnBackdrop={!loading}
      footer={
        <>
          <Btn kind="ghost" type="button" disabled={loading} onClick={handleCancel}>
            {cancelLabel}
          </Btn>
          <Btn
            kind={tone === 'danger' || tone === 'destructive' ? 'danger' : 'primary'}
            type="button"
            loading={loading}
            disabled={destructiveBlocked}
            onClick={handleConfirm}
          >
            {resolvedConfirmLabel}
          </Btn>
        </>
      }
    >
      {tone !== 'default' ? (
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            background: 'rgba(220, 38, 38, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 14,
          }}
        >
          <Icon name="alert" size={20} color={DANGER_COLOR} />
        </div>
      ) : null}

      {bodyContent}

      {open && tone === 'destructive' && destructiveConfirmWord ? (
        <DestructiveWordField
          key="destructive-word"
          word={destructiveConfirmWord}
          loading={loading}
          onMatchChange={setDestructiveMatches}
        />
      ) : null}
    </Modal>
  )
}

export default ConfirmDialog
