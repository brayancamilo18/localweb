import ProServicesEditor from '../../shared/ProServicesEditor'
import { useDashboard } from '../context/DashboardContext'
import '../components/dashboardSectionHeader.css'

export default function Servicios() {
  const { business } = useDashboard()

  const servicesAsPro = business.is_pro || business.plan === 'pending'

  return (
    <div className="lw-dash-section-page" data-tour="servicios-main">
      <ProServicesEditor
        dashboardHeader={{ badgeIcon: 'list', badgeLabel: 'Tu catálogo' }}
        title="Servicios"
        subtitle="Lista de servicios que ofreces a tus clientes"
        isPro={servicesAsPro}
      />
    </div>
  )
}
