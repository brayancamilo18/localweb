import { Icon } from '../primitives/primitives'
import { ConfirmModalShell } from './ConfirmModalShell'
import type { BusinessService } from '../../types/api'

export type RemoveServiceDialogProps = {
  open: boolean
  service: BusinessService | null
  onCancel: () => void
  onConfirm: () => void
  loading?: boolean
}

function formatPrice(price: BusinessService['price']): string {
  if (price === null || price === undefined) return 'Consultar'
  const n = typeof price === 'string' ? Number.parseFloat(price) : price
  if (Number.isNaN(n)) return 'Consultar'
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(n)
}

export function RemoveServiceDialog({
  open,
  service,
  onCancel,
  onConfirm,
  loading = false,
}: RemoveServiceDialogProps) {
  return (
    <ConfirmModalShell
      open={open}
      onClose={onCancel}
      loading={loading}
      eyebrow="Acción destructiva"
      title="Eliminar servicio"
      eyebrowTone="danger"
      headerIconVariant="danger"
      headerIcon={<Icon name="alert" size={20} color="#B23A2E" stroke={2.2} />}
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
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="lw-cmd-spinner" aria-hidden />
                Eliminando…
              </>
            ) : (
              <>
                <Icon name="alert" size={16} color="#fff" stroke={2.4} />
                Eliminar servicio
              </>
            )}
          </button>
        </>
      }
    >
      {service ? (
        <div className="lw-cmd-card lw-cmd-service-card">
          <div className="lw-cmd-service-card__icon" aria-hidden>
            <Icon name="scissors" size={20} color="var(--lw-accent, #0F6E56)" />
          </div>
          <div className="lw-cmd-service-card__body">
            <div className="lw-cmd-service-card__name">{service.name}</div>
            <div className="lw-cmd-service-card__meta">{formatPrice(service.price)}</div>
          </div>
          <span className="lw-cmd-tag lw-cmd-tag--danger">A eliminar</span>
        </div>
      ) : null}

      <p className="lw-cmd-desc">
        ¿Seguro que quieres eliminar este servicio? Dejará de aparecer en tu web pública inmediatamente.
      </p>

      <div className="lw-cmd-hint lw-cmd-hint--danger">
        <span className="lw-cmd-hint__icon" aria-hidden>
          <Icon name="shield" size={14} color="#B23A2E" />
        </span>
        <span>
          Esta acción <strong>no se puede deshacer</strong>.
        </span>
      </div>
    </ConfirmModalShell>
  )
}

export default RemoveServiceDialog
