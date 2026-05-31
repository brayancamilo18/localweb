import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Btn } from '../../../components/primitives/primitives'
import { useToast } from '../../../components/ui/Toast'
import BrandColorPicker from '../../shared/BrandColorPicker'
import {
  BrandColorFooterHint,
  BrandColorLockedBlock,
  BrandColorPanelShell,
  BrandColorProUpsell,
} from '../../shared/BrandColorPanel'
import { useBrandColor } from '../../shared/useBrandColor'
import { useDashboard } from '../context/DashboardContext'

export default function BrandColorSection() {
  const navigate = useNavigate()
  const goToDesignTemplates = useCallback(() => {
    navigate('/dashboard/diseno#plantillas')
  }, [navigate])
  const { business } = useDashboard()
  const templateName = business.template?.name ?? 'tu plantilla'
  const isPro = business.is_pro === true
  const { showToast } = useToast()
  const { data, isLoading, mutate, isPending } = useBrandColor({ enabled: isPro })
  const [draftColor, setDraftColor] = useState<string | null | undefined>(undefined)

  const savedColor = data?.current ?? null

  useEffect(() => {
    if (data) {
      setDraftColor(data.current)
    }
  }, [data?.current, data])

  const pendingColor = draftColor === undefined ? savedColor : draftColor

  const hasPendingChanges = useMemo(() => {
    if (!data) return false
    return pendingColor !== savedColor
  }, [data, pendingColor, savedColor])

  const previewEffective = pendingColor ?? data?.default ?? '#000000'

  const handleConfirm = useCallback(() => {
    if (!hasPendingChanges || isPending) return
    mutate(pendingColor, {
      onSuccess: () => {
        showToast({
          type: 'success',
          title: 'Color actualizado',
          description: 'Tu web se actualizará en breve.',
        })
      },
      onError: () => {
        setDraftColor(savedColor)
        showToast({
          type: 'error',
          title: 'No se pudo guardar el color',
          description: 'Inténtalo de nuevo en unos segundos.',
        })
      },
    })
  }, [hasPendingChanges, isPending, mutate, pendingColor, savedColor, showToast])

  if (!isPro) {
    return (
      <div data-testid="brand-color-section">
        <BrandColorProUpsell />
      </div>
    )
  }

  return (
    <div data-testid="brand-color-section">
      <BrandColorPanelShell>
        {isLoading || !data ? (
          <p className="lw-small" style={{ margin: 0, color: 'var(--lw-text-3)' }}>
            Cargando paleta…
          </p>
        ) : !data.is_supported ? (
          <BrandColorLockedBlock
            palette={data.palette}
            templateName={templateName}
            onGoToTemplates={goToDesignTemplates}
          />
        ) : (
          <>
            <BrandColorPicker
              palette={data.palette}
              templateName={templateName}
              templateMeta={data.template_meta}
              value={pendingColor}
              defaultColor={data.default}
              effective={previewEffective}
              onChange={setDraftColor}
            />
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                marginTop: 20,
              }}
            >
              <Btn
                type="button"
                kind="primary"
                loading={isPending}
                disabled={!hasPendingChanges || isPending}
                onClick={handleConfirm}
              >
                Confirmar color
              </Btn>
            </div>
          </>
        )}

        <BrandColorFooterHint muted={!data?.is_supported} />
      </BrandColorPanelShell>
    </div>
  )
}
