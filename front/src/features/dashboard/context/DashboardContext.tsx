import { createContext, useContext } from 'react'
import type { Business, StatsData } from '../../../types/api'

export const EMPTY_STATS: StatsData = {
  daily_visits: [],
  daily_whatsapp_clicks: [],
  daily_phone_clicks: [],
  total: 0,
  days_limit: 0,
  whatsapp_clicks: 0,
  phone_clicks: 0,
  from: '',
  to: '',
  granularity: 'day',
}

export interface DashboardContextValue {
  business: Business
  stats: StatsData
  refetch: () => void
}

export const DashboardContext = createContext<DashboardContextValue | null>(null)

export function useDashboard(): DashboardContextValue {
  const v = useContext(DashboardContext)
  if (!v) throw new Error('useDashboard must be used within DashboardContext.Provider')
  return v
}
