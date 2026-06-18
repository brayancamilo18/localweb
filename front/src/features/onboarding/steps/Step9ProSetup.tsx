import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { Btn, Card, Icon, Switch } from '../../../components/primitives/primitives'
import { useToast } from '../../../components/ui/Toast'
import { me } from '../../../api/auth'
import { finalizeOnboarding } from '../../../api/onboarding'
import { keys } from '../../../api/queryKeys'
import { useAuthStore } from '../../../store/authStore'
import { clearOnboardingPersistForUser } from '../onboardingPersist'
import ProServicesEditor from '../../shared/ProServicesEditor'
import ProIntegrationsForm from '../../shared/ProIntegrationsForm'
import DashboardSectionHeader from '../../dashboard/components/DashboardSectionHeader'
import FaviconUploader from '../../shared/FaviconUploader'
import BrandColorPicker from '../../shared/BrandColorPicker'
import { useBrandColor } from '../../shared/useBrandColor'
import type { WizardStepProps } from '../wizardNavContext'

export type Step9SetupPhase = 'services' | 'brand' | 'extras'

export type Step9ProSetupProps = WizardStepProps & {
  onFinishToDashboard?: () => void
  setupPhase: Step9SetupPhase
  onSetupPhaseChange: (phase: Step9SetupPhase) => void
  offersServices: boolean
  onOffersServicesChange: (v: boolean) => void
  /** Tras crear/editar/borrar servicios: refrescar la vista previa del iframe. */
  onServicesPreviewMutate?: () => void
  brandColorDefault: string
  brandColorPickerValue?: string | null
  onBrandColorLiveChange: (hex: string) => void
}

export default function Step9ProSetup({
  onFinishToDashboard,
  setupPhase,
  onSetupPhaseChange,
  offersServices,
  onOffersServicesChange,
  onServicesPreviewMutate,
  brandColorDefault,
  brandColorPickerValue = null,
  onBrandColorLiveChange,
}: Step9ProSetupProps) {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { showToast } = useToast()
  const userId = useAuthStore((s) => s.user?.id)
  const setAuth = useAuthStore((s) => s.setAuth)
  const [finishing, setFinishing] = useState(false)
  const { data: brandState, isLoading: brandLoading, mutate: saveBrandColor, isPending: brandSaving } =
    useBrandColor()

  const onDashboard = useCallback(async () => {
    if (finishing) return
    setFinishing(true)
    try {
      await finalizeOnboarding()
      const fresh = await me()
      qc.setQueryData(keys.auth.me, fresh)
      if (fresh.business) {
        qc.setQueryData(keys.dashboard.business, fresh.business)
      }
      setAuth(fresh.user, fresh.business)
      if (userId != null) clearOnboardingPersistForUser(userId)
      onFinishToDashboard?.()
      navigate('/dashboard')
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'No se pudo cerrar el onboarding. Revisa que tu negocio tenga todos los datos guardados.'
      showToast({
        type: 'error',
        title: 'No pudimos ir al panel',
        description: message,
      })
    } finally {
      setFinishing(false)
    }
  }, [finishing, qc, setAuth, userId, navigate, onFinishToDashboard, showToast])

  const handleBrandChange = useCallback(
    (color: string | null) => {
      const previewHex = (color ?? brandColorDefault).toLowerCase()
      onBrandColorLiveChange(previewHex)
      saveBrandColor(color, {
        onError: () => {
          showToast({
            type: 'error',
            title: 'No se pudo guardar el color',
            description: 'Inténtalo de nuevo en unos segundos.',
          })
        },
      })
    },
    [brandColorDefault, onBrandColorLiveChange, saveBrandColor, showToast],
  )

  const phaseTitle =
    setupPhase === 'services'
      ? 'Servicios en tu web'
      : setupPhase === 'brand'
        ? 'Color de tu marca'
        : 'Enlaces y contacto'

  const phaseSubtitle =
    setupPhase === 'services'
      ? 'Indica si publicas servicios con precios. La vista previa muestra la sección Servicios de tu plantilla.'
      : setupPhase === 'brand'
        ? 'Elige el color que mejor representa a tu negocio. Lo puedes cambiar en cualquier momento desde el dashboard.'
        : 'Google Business, redes sociales en el pie y vCard. «Cómo llegar» usa la dirección y el mapa que ya configuraste.'

  return (
    <div className={setupPhase === 'extras' ? 'lw-enlaces-page' : undefined} style={{ maxWidth: 640 }}>
      {setupPhase === 'extras' ? (
        <DashboardSectionHeader
          badgeIcon="arrowUpRight"
          badgeLabel="Contacto y redes"
          title={phaseTitle}
          subtitle={phaseSubtitle}
        />
      ) : (
        <div style={{ marginBottom: 24 }}>
          <h1 className="lw-h2" style={{ marginBottom: 10 }}>
            {phaseTitle}
          </h1>
          <p className="lw-body" style={{ margin: 0, fontSize: 14, color: 'var(--lw-text-2)' }}>
            {phaseSubtitle}
          </p>
        </div>
      )}

      {setupPhase === 'services' ? (
        <>
          <Card padding={20} style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>¿Ofreces servicios o tarifas con precio?</div>
                <p className="lw-small" style={{ margin: 0, color: 'var(--lw-text-2)' }}>
                  Si no activas esta opción, la sección de servicios no se mostrará en la web.
                </p>
              </div>
              <Switch checked={offersServices} onChange={onOffersServicesChange} label={offersServices ? 'Sí' : 'No'} />
            </div>
          </Card>

          {offersServices ? (
            <Card padding={20} style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <Icon name="list" size={20} color="var(--lw-accent)" />
                <h2 className="lw-h2" style={{ margin: 0, fontSize: 17 }}>
                  Añade tus servicios y precios
                </h2>
              </div>
              <ProServicesEditor isPro onboarding onAfterMutate={onServicesPreviewMutate} />
            </Card>
          ) : null}

          <Btn type="button" kind="primary" size="lg" iconRight="arrowRight" onClick={() => onSetupPhaseChange('brand')}>
            Continuar a marca
          </Btn>
        </>
      ) : setupPhase === 'brand' ? (
        <>
          {brandLoading || !brandState ? (
            <p className="lw-body" style={{ color: 'var(--lw-text-2)' }}>
              Cargando paleta de colores…
            </p>
          ) : !brandState.is_supported ? (
            <>
              <Card padding={20} style={{ marginBottom: 20 }}>
                <p className="lw-body" style={{ margin: 0, color: 'var(--lw-text-2)' }}>
                  Tu plantilla actual no permite cambiar el color de marca. Puedes saltar este paso o cambiar de plantilla
                  más tarde.
                </p>
              </Card>
              <Btn type="button" kind="primary" size="lg" iconRight="arrowRight" onClick={() => onSetupPhaseChange('extras')}>
                Continuar a enlaces
              </Btn>
            </>
          ) : (
            <>
              <Card padding={20} style={{ marginBottom: 20 }}>
                <BrandColorPicker
                  palette={brandState.palette}
                  templateMeta={brandState.template_meta}
                  value={brandState.current ?? brandColorPickerValue}
                  defaultColor={brandState.default}
                  effective={brandState.effective}
                  saving={brandSaving}
                  onChange={handleBrandChange}
                />
              </Card>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                <Btn type="button" kind="outline" size="md" icon="chevronLeft" onClick={() => onSetupPhaseChange('services')}>
                  Volver a servicios
                </Btn>
                <Btn
                  type="button"
                  kind="primary"
                  size="lg"
                  iconRight="arrowRight"
                  disabled={brandSaving}
                  onClick={() => onSetupPhaseChange('extras')}
                >
                  Continuar a enlaces
                </Btn>
              </div>
            </>
          )}
        </>
      ) : (
        <>
          <ProIntegrationsForm
            enabled
            compact
            saveLabel="Guardar enlaces"
            onSaved={() => {
              showToast({
                type: 'success',
                title: 'Enlaces guardados',
                description: 'Ya están conectados a tu web pública.',
              })
              void qc.invalidateQueries({ queryKey: keys.dashboard.business })
            }}
          />

          <Card padding={20} style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <Icon name="sparkle" size={20} color="var(--lw-accent)" />
              <h2 className="lw-h2" style={{ margin: 0, fontSize: 17 }}>
                Icono de tu web (favicon)
              </h2>
            </div>
            <FaviconUploader
              enabled
              onSaved={() => {
                showToast({
                  type: 'success',
                  title: 'Favicon guardado',
                  description: 'Ya identifica tu web en la pestaña del navegador.',
                })
                void qc.invalidateQueries({ queryKey: keys.dashboard.business })
              }}
            />
          </Card>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            <Btn type="button" kind="outline" size="md" icon="chevronLeft" onClick={() => onSetupPhaseChange('brand')}>
              Volver a marca
            </Btn>
            <Btn
              type="button"
              kind="primary"
              size="lg"
              iconRight="arrowRight"
              loading={finishing}
              disabled={finishing}
              onClick={() => {
                void onDashboard()
              }}
            >
              Ir a mi dashboard
            </Btn>
          </div>
        </>
      )}
    </div>
  )
}
