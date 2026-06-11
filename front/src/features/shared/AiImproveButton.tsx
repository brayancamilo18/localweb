import { useEffect, useRef, useState } from 'react'
import { Btn } from '../../components/primitives'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import { improveText, type AiImproveField, type AiImproveTone } from '../../api/ai'
import { useAiQuota, useInvalidateAiQuota } from './useAiQuota'

type Props = {
  value: string
  field: AiImproveField
  /** Llamado con el texto mejorado, ya validado. */
  onResult: (text: string) => void
  /** Para deshabilitar mientras se guarda el formulario, etc. */
  disabled?: boolean
  /** Notifica si la mejora está en curso (para animar el campo, etc.). */
  onLoadingChange?: (loading: boolean) => void
}

const TONE_LABELS: Record<AiImproveTone, { title: string; subtitle: string }> = {
  profesional: { title: 'Profesional', subtitle: 'Serio, claro, sobrio' },
  cercano: { title: 'Cercano', subtitle: 'Cálido, en primera persona del plural' },
  vendedor: { title: 'Vendedor', subtitle: 'Dinámico, orientado a la acción' },
}

export default function AiImproveButton({ value, field, onResult, disabled, onLoadingChange }: Props) {
  const aiQuotaQuery = useAiQuota()
  const invalidateAiQuota = useInvalidateAiQuota()
  const aiEnabled = aiQuotaQuery.data?.enabled === true
  const aiRemaining = aiQuotaQuery.data?.remaining.improve_text

  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState<AiImproveTone | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pendingText, setPendingText] = useState<string | null>(null)
  const popRef = useRef<HTMLDivElement | null>(null)
  const rootRef = useRef<HTMLDivElement | null>(null)

  const trimmedValue = value.trim()
  const empty = trimmedValue.length < 5
  const exhausted = typeof aiRemaining === 'number' && aiRemaining <= 0
  const triggerDisabled = Boolean(disabled) || empty || exhausted || loading !== null

  const triggerTitle = empty
    ? 'Escribe primero algo que mejorar (mínimo 5 caracteres).'
    : exhausted
      ? 'Has alcanzado el límite diario de generaciones con IA. Vuelve mañana.'
      : typeof aiRemaining === 'number'
        ? `Te quedan ${aiRemaining} mejoras hoy`
        : undefined

  useEffect(() => {
    if (!open) return
    const onClickOutside = (e: MouseEvent) => {
      const target = e.target as Node
      if (rootRef.current && !rootRef.current.contains(target)) {
        setOpen(false)
      }
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClickOutside)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const handleSelectTone = async (tone: AiImproveTone) => {
    setOpen(false)
    setError(null)
    setLoading(tone)
    onLoadingChange?.(true)
    try {
      const res = await improveText({ text: trimmedValue, tone, field })
      const newText = res.text.trim()
      if (newText === trimmedValue) {
        onResult(newText)
      } else {
        setPendingText(newText)
      }
      invalidateAiQuota()
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status
      if (status === 429) setError('Has agotado tu cuota mensual de IA. Podrás volver a usarla el mes que viene.')
      else if (status === 503) setError('La generación con IA no está disponible ahora mismo.')
      else if (status === 403) setError('Esta función es solo para el plan Pro.')
      else if (status === 422) setError('No se ha podido procesar la mejora. Revisa el texto.')
      else setError('No hemos podido mejorar el texto. Inténtalo de nuevo.')
      invalidateAiQuota()
    } finally {
      setLoading(null)
      onLoadingChange?.(false)
    }
  }

  const handleConfirm = () => {
    if (pendingText !== null) onResult(pendingText)
    setPendingText(null)
  }

  const handleCancel = () => setPendingText(null)

  if (!aiEnabled) return null

  return (
    <div ref={rootRef} style={{ position: 'relative', display: 'inline-block' }}>
      <span title={triggerTitle} style={{ display: 'inline-flex' }}>
        <Btn
          type="button"
          kind="ghost"
          size="sm"
          icon="sparkle"
          onClick={() => setOpen((v) => !v)}
          disabled={triggerDisabled}
        >
          {loading !== null ? 'Mejorando…' : 'Mejorar con IA'}
        </Btn>
      </span>

      {open ? (
        <div
          ref={popRef}
          role="menu"
          aria-label="Elegir tono"
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            right: 0,
            zIndex: 20,
            minWidth: 220,
            background: 'var(--lw-bg-elev)',
            border: '1px solid var(--lw-border)',
            borderRadius: 'var(--lw-r)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
            padding: 4,
            display: 'grid',
            gap: 2,
          }}
        >
          {(Object.keys(TONE_LABELS) as AiImproveTone[]).map((tone) => {
            const meta = TONE_LABELS[tone]
            return (
              <button
                key={tone}
                type="button"
                role="menuitem"
                onClick={() => void handleSelectTone(tone)}
                style={{
                  textAlign: 'left',
                  background: 'transparent',
                  border: 'none',
                  borderRadius: 'var(--lw-r-sm, 6px)',
                  padding: '8px 10px',
                  cursor: 'pointer',
                  font: 'inherit',
                  color: 'var(--lw-text)',
                  display: 'grid',
                  gap: 2,
                }}
                onMouseEnter={(e) => {
                  ;(e.currentTarget as HTMLElement).style.background =
                    'var(--lw-bg-hover, rgba(0,0,0,0.04))'
                }}
                onMouseLeave={(e) => {
                  ;(e.currentTarget as HTMLElement).style.background = 'transparent'
                }}
              >
                <span style={{ fontSize: 14, fontWeight: 600 }}>{meta.title}</span>
                <span style={{ fontSize: 12, color: 'var(--lw-text-3)' }}>{meta.subtitle}</span>
              </button>
            )
          })}
        </div>
      ) : null}

      {error ? (
        <div
          role="alert"
          style={{
            marginTop: 6,
            fontSize: 12,
            color: 'var(--lw-danger)',
          }}
        >
          {error}
        </div>
      ) : null}

      <ConfirmDialog
        open={pendingText !== null}
        onCancel={handleCancel}
        onConfirm={handleConfirm}
        title="¿Reemplazar el texto actual?"
        description="La IA ha generado una nueva versión. Si continúas, se sustituirá el texto que tenías escrito."
        confirmLabel="Reemplazar"
        cancelLabel="Cancelar"
      />
    </div>
  )
}
