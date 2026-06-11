import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Btn, Card, Icon, Segmented } from '../../../../components/primitives/primitives'
import { useDashboard } from '../../context/DashboardContext'
import AccountTabPerfil from './AccountTabPerfil'
import AccountTabPlan from './AccountTabPlan'
import AccountTabFacturas from './AccountTabFacturas'
import AccountTabPago from './AccountTabPago'
import AccountTabPrivacidad from './AccountTabPrivacidad'
import AccountTabSeguridad from './AccountTabSeguridad'
import AccountTabReferidos from './AccountTabReferidos'
import AccountTabIa from './AccountTabIa'
import DashboardSectionHeader from '../../components/DashboardSectionHeader'
import '../../components/dashboardSectionHeader.css'
import './account.css'

/**
 * Página «Mi cuenta». Contenedor con tabs (Perfil / Plan / Facturas / Pago).
 *
 * El tab activo vive en la query string (`?tab=perfil|plan|facturas|pago`)
 * para que sea linkable, copiable y navegable con back/forward del navegador.
 * Si la query string es inválida o no existe, caemos al tab `perfil`.
 *
 * Los 4 tabs son stubs en este prompt; cada uno se rellena en su propio
 * prompt posterior para mantener cambios pequeños y revisables.
 */

export type AccountTab = 'perfil' | 'plan' | 'facturas' | 'pago' | 'referidos' | 'privacidad' | 'seguridad' | 'ia'

const TABS: Array<{ value: AccountTab; label: string; icon: string }> = [
  { value: 'perfil', label: 'Perfil', icon: 'user' },
  { value: 'plan', label: 'Plan', icon: 'sparkle' },
  { value: 'facturas', label: 'Facturas', icon: 'list' },
  { value: 'pago', label: 'Pago', icon: 'creditCard' },
  { value: 'referidos', label: 'Referidos', icon: 'users' },
  { value: 'ia', label: 'Uso IA', icon: 'sparkle' },
  { value: 'seguridad', label: 'Seguridad', icon: 'shield' },
  { value: 'privacidad', label: 'Privacidad', icon: 'shield' },
]

function isAccountTab(value: string | null): value is AccountTab {
  return (
    value === 'perfil' ||
    value === 'plan' ||
    value === 'facturas' ||
    value === 'pago' ||
    value === 'referidos' ||
    value === 'ia' ||
    value === 'privacidad' ||
    value === 'seguridad'
  )
}

export default function AccountPage() {
  const { business } = useDashboard()
  const [searchParams, setSearchParams] = useSearchParams()

  const activeTab: AccountTab = useMemo(() => {
    const t = searchParams.get('tab')
    return isAccountTab(t) ? t : 'perfil'
  }, [searchParams])

  const setTab = (t: string) => {
    const next = new URLSearchParams(searchParams)
    next.set('tab', t)
    setSearchParams(next, { replace: true })
  }

  return (
    <div className="lw-dash-section-page" data-tour="cuenta-main">
      <DashboardSectionHeader
        badgeIcon="user"
        badgeLabel="Tu cuenta"
        title="Mi cuenta"
        subtitle="Datos personales, plan, facturas y método de pago"
        aside={
          <Btn
            kind="outline"
            icon="arrowRight"
            size="md"
            type="button"
            style={{ flexDirection: 'row-reverse' }}
            onClick={() => {
              window.location.href = '/dashboard'
            }}
          >
            Volver
          </Btn>
        }
      />

      <Card padding={16} className="lw-account-summary-card">
        <div className="lw-account-summary-info">
          <div className="lw-account-summary-avatar" aria-hidden="true">
            <Icon name="user" size={20} color="var(--lw-text-3)" />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--lw-text)' }}>
              {business.name ?? 'Tu negocio'}
            </div>
            <div className="lw-small" style={{ fontSize: 12 }}>
              {business.is_pro ? 'Plan Pro' : 'Plan Gratis'}
            </div>
          </div>
        </div>
      </Card>

      <div className="lw-account-tabs-row">
        <Segmented
          value={activeTab}
          onChange={setTab}
          options={TABS.map((t) => ({ value: t.value, label: t.label }))}
        />
      </div>

      <div className="lw-account-tab-content">
        {activeTab === 'perfil' && <AccountTabPerfil />}
        {activeTab === 'plan' && <AccountTabPlan />}
        {activeTab === 'facturas' && <AccountTabFacturas />}
        {activeTab === 'pago' && <AccountTabPago />}
        {activeTab === 'referidos' && <AccountTabReferidos />}
        {activeTab === 'ia' && <AccountTabIa />}
        {activeTab === 'seguridad' && <AccountTabSeguridad />}
        {activeTab === 'privacidad' && <AccountTabPrivacidad />}
      </div>
    </div>
  )
}
