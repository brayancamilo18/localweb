import DashboardSectionHeader from '../components/DashboardSectionHeader'
import '../components/dashboardSectionHeader.css'

export default function Seguridad() {
  return (
    <div className="lw-dash-section-page" data-tour="seguridad-main">
      <DashboardSectionHeader
        badgeIcon="shield"
        badgeLabel="Protección"
        title="Seguridad"
        subtitle="Seguridad — próximamente"
      />
    </div>
  )
}
