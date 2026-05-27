import { Link } from 'react-router-dom'
import BrandColorSection from './BrandColorSection'
import { useDashboard } from '../context/DashboardContext'

export default function BrandColor() {
  const { business } = useDashboard()
  const templateName = business.template?.name ?? 'tu plantilla'

  return (
    <div style={{ maxWidth: 720 }} data-tour="brand-color-main">
      <h1 className="lw-h2" style={{ marginBottom: 8 }}>
        Color de marca
      </h1>
      <p className="lw-small" style={{ marginBottom: 24, fontSize: 13, color: 'var(--lw-text-2)', lineHeight: 1.55 }}>
        Personaliza el color principal de tu web. Los colores disponibles corresponden a tu plantilla actual (
        <strong style={{ color: 'var(--lw-text)' }}>{templateName}</strong>
        ): si cambias de plantilla en{' '}
        <Link to="/dashboard/diseno" style={{ color: 'var(--lw-accent)', fontWeight: 600 }}>
          Diseño
        </Link>
        , la paleta y las opciones serán otras.
      </p>

      <BrandColorSection />
    </div>
  )
}
