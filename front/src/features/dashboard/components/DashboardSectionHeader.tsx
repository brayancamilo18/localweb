import type { ReactNode } from 'react'
import Icon from '../../../components/primitives/Icon'
import './dashboardSectionHeader.css'

export type DashboardSectionHeaderProps = {
  badgeIcon: string
  badgeLabel: string
  title: string
  subtitle?: ReactNode
  aside?: ReactNode
  className?: string
}

export default function DashboardSectionHeader({
  badgeIcon,
  badgeLabel,
  title,
  subtitle,
  aside,
  className,
}: DashboardSectionHeaderProps) {
  return (
    <header className={['lw-dash-section-header', className].filter(Boolean).join(' ')}>
      <div className="lw-dash-section-header__badge">
        <Icon name={badgeIcon} size={12} color="var(--lw-dash-accent-dark)" />
        {badgeLabel}
      </div>
      <div className="lw-dash-section-header__row">
        <div className="lw-dash-section-header__main">
          <h1 className="lw-dash-section-header__title">{title}</h1>
          {subtitle ? <p className="lw-dash-section-header__subtitle">{subtitle}</p> : null}
        </div>
        {aside ? <div className="lw-dash-section-header__aside">{aside}</div> : null}
      </div>
    </header>
  )
}
