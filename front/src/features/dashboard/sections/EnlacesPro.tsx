import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Btn, Icon } from '../../../components/primitives/primitives'
import { useToast } from '../../../components/ui/Toast'
import { getBusiness } from '../../../api/dashboard'
import { keys } from '../../../api/queryKeys'
import { useDashboard } from '../context/DashboardContext'
import ProIntegrationsForm from '../../shared/ProIntegrationsForm'
import DashboardSectionHeader from '../components/DashboardSectionHeader'
import '../components/dashboardSectionHeader.css'

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
      <div className="lw-enlaces-page lw-dash-section-page" data-tour="enlaces-pro-main">
        <div className="lw-shimmer" style={{ height: 32, borderRadius: 8, maxWidth: 280, marginBottom: 16 }} />
        <div className="lw-shimmer" style={{ height: 120, borderRadius: 12 }} />
      </div>
    )
  }

  return (
    <div className="lw-enlaces-page lw-dash-section-page" data-tour="enlaces-pro-main">
      <DashboardSectionHeader
        badgeIcon="arrowUpRight"
        badgeLabel="Contacto y redes"
        title="Enlaces y contacto"
        subtitle="Google Business, redes del pie (Instagram, TikTok, Facebook) y vCard. «Cómo llegar» usa la dirección y el mapa que ya configuraste."
      />

      {!isPro ? (
        <div className="lw-enlaces-lock-banner">
          <Icon name="lock" size={18} color="#92400E" />
          <div style={{ flex: 1, minWidth: 200, fontSize: 13, fontWeight: 600, color: '#78350F' }}>
            Estas funciones están disponibles en el plan Pro
          </div>
          <Link to="/dashboard/account?tab=plan" style={{ textDecoration: 'none' }}>
            <Btn type="button" kind="primary" size="sm">
              Ver planes
            </Btn>
          </Link>
        </div>
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
            description: 'Revisa las URLs e inténtalo de nuevo.',
          })
        }
      />
    </div>
  )
}
