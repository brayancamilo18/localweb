import { Icon } from '../primitives/primitives'
import { ConfirmModalShell } from './ConfirmModalShell'

export type CancelProDialogProps = {
  open: boolean
  onKeepPro: () => void
  onConfirmCancel: () => void
  loading?: boolean
  renewalDateLabel: string
}

const LOSES = [
  { icon: 'image' as const, label: 'Máx. 3 fotos en tu galería' },
  { icon: 'settings' as const, label: 'Máx. 3 servicios visibles' },
  { icon: 'star' as const, label: 'Sin color de marca personalizable' },
]

export function CancelProDialog({
  open,
  onKeepPro,
  onConfirmCancel,
  loading = false,
  renewalDateLabel,
}: CancelProDialogProps) {
  return (
    <ConfirmModalShell
      open={open}
      onClose={onKeepPro}
      loading={loading}
      wide
      eyebrow="Suscripción Pro"
      title="¿Cancelar tu plan Pro?"
      eyebrowTone="gold"
      headerIconVariant="gold"
      headerIcon={<Icon name="star" size={20} color="#fff" stroke={2.2} />}
      footerClassName="lw-cmd-footer--split"
      footer={
        <>
          <button
            type="button"
            className="lw-cmd-btn lw-cmd-btn--primary"
            onClick={onKeepPro}
            disabled={loading}
          >
            Mantener Pro
            <Icon name="arrowRight" size={16} color="#fff" />
          </button>
          <button
            type="button"
            className="lw-cmd-btn lw-cmd-btn--danger-muted"
            onClick={onConfirmCancel}
            disabled={loading}
          >
            {loading ? 'Cancelando…' : 'Sí, cancelar plan'}
          </button>
        </>
      }
    >
      <div className="lw-cmd-card lw-cmd-pro-active">
        <div className="lw-cmd-pro-active__stripe" aria-hidden />
        <div className="lw-cmd-pro-active__icon" aria-hidden>
          <Icon name="clock" size={20} color="#C9A227" />
        </div>
        <div className="lw-cmd-pro-active__body">
          <div className="lw-cmd-card__eyebrow" style={{ marginBottom: 4 }}>
            Pro activo hasta
          </div>
          <div className="lw-cmd-pro-active__date">{renewalDateLabel}</div>
          <div className="lw-cmd-pro-active__sub">
            Mantendrás todas las ventajas hasta esa fecha.
          </div>
        </div>
      </div>

      <div>
        <div className="lw-cmd-card__eyebrow">Después volverás al plan Gratis</div>
        <div className="lw-cmd-card lw-cmd-lose-card">
          <ul className="lw-cmd-list">
            {LOSES.map((item) => (
              <li key={item.label} className="lw-cmd-list__item">
                <span className="lw-cmd-list__icon lw-cmd-list__icon--sm" aria-hidden>
                  <Icon name={item.icon} size={14} color="#B23A2E" stroke={2.2} />
                </span>
                <span>{item.label}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </ConfirmModalShell>
  )
}

export default CancelProDialog
