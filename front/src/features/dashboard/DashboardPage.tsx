import { useCallback } from 'react'
import { Outlet } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getBusiness, getStats } from '../../api/dashboard'
import { keys } from '../../api/queryKeys'
import type { Business, StatsData } from '../../types/api'
import { Dashboard } from './dashboard'
import { DashboardContext, EMPTY_STATS } from './context/DashboardContext'

function DashboardSkeleton() {
  return (
    <div
      style={{
        display: 'flex',
        flex: 1,
        minHeight: 0,
        width: '100%',
        background: 'var(--lw-bg)',
        alignItems: 'stretch',
      }}
    >
      <aside
        style={{
          width: 240,
          flexShrink: 0,
          alignSelf: 'stretch',
          background: 'var(--lw-bg-elev)',
          borderRight: '1px solid var(--lw-border)',
          padding: 20,
          minHeight: 0,
        }}
      >
        <div className="lw-shimmer" style={{ height: 22, borderRadius: 6, marginBottom: 20 }} />
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="lw-shimmer" style={{ height: 36, borderRadius: 8, marginBottom: 8 }} />
        ))}
      </aside>
      <main style={{ flex: 1, padding: 32 }}>
        <div className="lw-shimmer" style={{ height: 36, borderRadius: 8, maxWidth: 280, marginBottom: 24 }} />
        <div className="lw-shimmer" style={{ height: 120, borderRadius: 12, marginBottom: 16 }} />
        <div className="lw-shimmer" style={{ height: 14, borderRadius: 4, maxWidth: '60%', marginBottom: 8 }} />
        <div className="lw-shimmer" style={{ height: 14, borderRadius: 4, maxWidth: '40%' }} />
      </main>
    </div>
  )
}

function fallbackStatsFromBusiness(business: Business): StatsData {
  return {
    ...EMPTY_STATS,
    total: business.stats?.visit ?? 0,
    whatsapp_clicks: business.stats?.whatsapp_click ?? 0,
    phone_clicks: business.stats?.phone_click ?? 0,
  }
}

export default function DashboardPage() {
  const qc = useQueryClient()

  const { data: business, isLoading, isError } = useQuery({
    queryKey: keys.dashboard.business,
    queryFn: getBusiness,
  })

  const statsQuery = useQuery({
    queryKey: keys.dashboard.stats,
    queryFn: () => getStats(),
    enabled: !!business?.is_pro,
    retry: false,
  })

  const refetch = useCallback(() => {
    void qc.invalidateQueries({ queryKey: keys.dashboard.business })
    void qc.invalidateQueries({ queryKey: keys.dashboard.stats })
  }, [qc])

  if (isLoading || !business) {
    return <DashboardSkeleton />
  }

  if (isError) {
    return (
      <div style={{ flex: 1, padding: 32, background: 'var(--lw-bg)' }}>
        <p>No se pudo cargar el panel.</p>
      </div>
    )
  }

  const stats = statsQuery.data ?? fallbackStatsFromBusiness(business)

  return (
    <DashboardContext.Provider value={{ business, stats, refetch }}>
      <Dashboard pro={business.is_pro} business={business}>
        <Outlet />
      </Dashboard>
    </DashboardContext.Provider>
  )
}
