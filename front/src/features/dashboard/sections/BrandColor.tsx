import { Link } from 'react-router-dom'
import BrandColorSection from './BrandColorSection'
import { useDashboard } from '../context/DashboardContext'
import DashboardSectionHeader from '../components/DashboardSectionHeader'
import '../components/dashboardSectionHeader.css'

export default function BrandColor() {
  const { business } = useDashboard()
  const templateName = business.template?.name ?? 'tu plantilla'

  return (
    <div className="lw-dash-section-page" data-tour="brand-color-main">
      <DashboardSectionHeader
        badgeIcon="palette"
        badgeLabel="Identidad visual"
        title="Color de marca"
        subtitle={
          <>
            Personaliza el color principal de tu web. Los colores disponibles corresponden a tu plantilla actual (
            <strong style={{ color: 'var(--lw-dash-ink)' }}>{templateName}</strong>
            ): si cambias de plantilla en{' '}
            <Link to="/dashboard/diseno" style={{ color: 'var(--lw-dash-accent)', fontWeight: 600 }}>
              Diseño
            </Link>
            , la paleta y las opciones serán otras.
          </>
        }
      />

      <BrandColorSection />
    </div>
  )
}
