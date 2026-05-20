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
import type { WizardStepProps } from '../wizardNavContext'

export type Step9ProSetupProps = WizardStepProps & {
  onFinishToDashboard?: () => void
  setupPhase: 'services' | 'extras'
  onSetupPhaseChange: (phase: 'services' | 'extras') => void
  offersServices: boolean
  onOffersServicesChange: (v: boolean) => void
}

export default function Step9ProSetup({
  onFinishToDashboard,
  setupPhase,
  onSetupPhaseChange,
  offersServices,
  onOffersServicesChange,
}: Step9ProSetupProps) {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { showToast } = useToast()
  const userId = useAuthStore((s) => s.user?.id)
  const setAuth = useAuthStore((s) => s.setAuth)
  const [finishing, setFinishing] = useState(false)

  // Tras los extras Pro: cerramos el onboarding en backend (set onboarding_completed_at),
  // sincronizamos /auth/me en cache + store y navegamos. Sin la sincronización de la cache,
  // ProtectedRoute en /dashboard rehidrata con el business previo y reaparece el bucle.
  const onDashboard = useCallback(async () => {
    if (finishing) return
    setFinishing(true)
    try {
      try {
        await finalizeOnboarding()
      } catch {
        // Si ya estaba cerrado o falla puntualmente seguimos: el usuario ya pulsó publicar.
      }
      try {
        const fresh = await me()
        qc.setQueryData(keys.auth.me, fresh)
        if (fresh.business) {
          qc.setQueryData(keys.dashboard.business, fresh.business)
        }
        setAuth(fresh.user, fresh.business)
      } catch {
        // /auth/me caído: dejamos que ProtectedRoute decida con la cache que haya.
      }
      if (userId != null) clearOnboardingPersistForUser(userId)
      onFinishToDashboard?.()
      navigate('/dashboard')
    } finally {
      setFinishing(false)
    }
  }, [finishing, qc, setAuth, userId, navigate, onFinishToDashboard])

  return (
    <div style={{ maxWidth: 640 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 className="lw-h2" style={{ marginBottom: 10 }}>
          {setupPhase === 'services' ? 'Servicios en tu web' : 'Enlaces y contacto'}
        </h1>
        <p className="lw-body" style={{ margin: 0, fontSize: 14, color: 'var(--lw-text-2)' }}>
          {setupPhase === 'services'
            ? 'Indica si publicas servicios con precios. La vista previa muestra la sección Servicios de tu plantilla.'
            : 'Google Business, redes sociales en el pie y vCard. «Cómo llegar» usa la dirección y el mapa que ya configuraste.'}
        </p>
      </div>

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
              <ProServicesEditor isPro onboarding />
            </Card>
          ) : null}

          <Btn type="button" kind="primary" size="lg" iconRight="arrowRight" onClick={() => onSetupPhaseChange('extras')}>
            Continuar a enlaces
          </Btn>
        </>
      ) : (
        <>
          <Card padding={20} style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <Icon name="arrowUpRight" size={20} color="var(--lw-accent)" />
              <h2 className="lw-h2" style={{ margin: 0, fontSize: 17 }}>
                Conecta tus enlaces
              </h2>
            </div>
            <ProIntegrationsForm
              enabled
              compact
              saveLabel="Guardar"
              onSaved={() => {
                showToast({
                  type: 'success',
                  title: 'Enlaces guardados',
                  description: 'Ya están conectados a tu web pública.',
                })
                void qc.invalidateQueries({ queryKey: keys.dashboard.business })
              }}
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
