import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Btn, Card, Icon } from '../../../components/primitives/primitives'
import { useToast } from '../../../components/ui/Toast'
import { getBusiness } from '../../../api/dashboard'
import { keys } from '../../../api/queryKeys'
import { useDashboard } from '../context/DashboardContext'
import ProIntegrationsForm from '../../shared/ProIntegrationsForm'

export default function EnlacesPro() {
  const { refetch: refetchDashboard } = useDashboard()
  const { showToast } = useToast()

  const businessQuery = useQuery({
    queryKey: keys.dashboard.business,
    queryFn: getBusiness,
  })

  const business = businessQuery.data
  const isPro = business?.is_pro ?? false

  if (businessQuery.isLoading || !business) {
    return (
      <div style={{ maxWidth: 560 }} data-tour="enlaces-pro-main">
        <div className="lw-shimmer" style={{ height: 32, borderRadius: 8, maxWidth: 280, marginBottom: 16 }} />
        <div className="lw-shimmer" style={{ height: 120, borderRadius: 12 }} />
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 560 }} data-tour="enlaces-pro-main">
      <h1 className="lw-h2" style={{ marginBottom: 8 }}>
        Enlaces y contacto Pro
      </h1>
      <p className="lw-small" style={{ marginBottom: 24, fontSize: 13, color: 'var(--lw-text-2)' }}>
        Google Business, redes del pie (Instagram, TikTok, Facebook) y vCard. «Cómo llegar» usa la dirección y el mapa que ya configuraste.
      </p>

      {!isPro ? (
        <Card
          padding={14}
          style={{
            marginBottom: 20,
            border: '1px solid #FCD34D',
            background: 'var(--lw-pro-soft)',
            display: 'flex',
            gap: 12,
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
        >
          <Icon name="lock" size={18} color="#92400E" />
          <div style={{ flex: 1, minWidth: 200, fontSize: 13, fontWeight: 600, color: '#78350F' }}>
            Estas funciones están disponibles en el plan Pro
          </div>
          <Link to="/dashboard/account?tab=plan" style={{ textDecoration: 'none' }}>
            <Btn type="button" kind="primary" size="sm">
              Ver planes
            </Btn>
          </Link>
        </Card>
      ) : null}

      <ProIntegrationsForm
        enabled={isPro}
        saveLabel="Guardar cambios"
        onSaved={() => {
          refetchDashboard()
          showToast({
            type: 'success',
            title: 'Enlaces guardados',
            description: 'Tus integraciones ya están en tu web pública.',
          })
        }}
        onSaveError={() =>
          showToast({
            type: 'error',
            title: 'No se pudo guardar',
            description: 'Revisa la URL de Google Business y vuelve a intentarlo.',
          })
        }
      />
    </div>
  )
}
