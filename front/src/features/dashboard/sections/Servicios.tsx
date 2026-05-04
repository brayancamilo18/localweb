import ProServicesEditor from '../../shared/ProServicesEditor'
import { useDashboard } from '../context/DashboardContext'

export default function Servicios() {
  const { business } = useDashboard()

  const servicesAsPro = business.is_pro || business.plan === 'pending'

  return (
    <div style={{ maxWidth: 720 }}>
      <ProServicesEditor
        title="Servicios"
        subtitle="Lista de servicios que ofreces a tus clientes"
        isPro={servicesAsPro}
      />
    </div>
  )
}
