import { useCallback, useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getBusiness, getStats } from '../../api/dashboard'
import { keys } from '../../api/queryKeys'
import type { Business, StatsData } from '../../types/api'
import { useAuthStore } from '../../store/authStore'
import { Dashboard } from './dashboard'
import { DashboardContext, EMPTY_STATS } from './context/DashboardContext'
import {
  TourProvider,
  TourRunner,
  TourAutoStart,
  useTour,
  completeDashboardTour,
  completeDashboardProTour,
} from './tour'
import { SubdomainSetupModal } from './sections/SubdomainSetupModal'
import { SubdomainTourPause } from './sections/SubdomainTourPause'

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

function TourRunnerWithComplete({ business }: { business: Business }) {
  const { proOnlyMode } = useTour()

  return (
    <TourRunner
      isPro={business.is_pro}
      overlayVariant="soft-veil"
      editRoute="/dashboard/editor"
      onComplete={() => {
        if (proOnlyMode) {
          completeDashboardProTour().catch(() => {
            /* fire-and-forget */
          })
          return
        }
        completeDashboardTour().catch(() => {
          /* fire-and-forget */
        })
        if (business.is_pro) {
          completeDashboardProTour().catch(() => {
            /* fire-and-forget */
          })
        }
      }}
    />
  )
}

export default function DashboardPage() {
  const qc = useQueryClient()
  const [subdomainDeferred, setSubdomainDeferred] = useState(false)
  const authBusiness = useAuthStore((s) => s.business)

  const { data: business, isLoading, isError } = useQuery({
    queryKey: keys.dashboard.business,
    queryFn: getBusiness,
  })

  /** La query se precarga en onboarding (paso 8+) y puede quedar sin `onboarding_completed_at`. */
  useEffect(() => {
    const authDone = authBusiness?.onboarding_completed_at
    if (!authDone || !business || business.onboarding_completed_at != null) return
    qc.setQueryData(keys.dashboard.business, {
      ...business,
      onboarding_completed_at: authDone,
    })
  }, [authBusiness?.onboarding_completed_at, business, qc])

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

  const needsSubdomainSetup = business.is_pro && business.subdomain_type === 'random'
  const showSubdomainModal = needsSubdomainSetup && !subdomainDeferred
  const subdomainSetupBlocking = needsSubdomainSetup && !subdomainDeferred
  const onboardingCompletedAt =
    business.onboarding_completed_at ?? authBusiness?.onboarding_completed_at ?? null

  return (
    <DashboardContext.Provider value={{ business, stats, refetch }}>
      {showSubdomainModal ? (
        <SubdomainSetupModal
          business={business}
          onDone={() => {
            void qc.invalidateQueries({ queryKey: keys.dashboard.business })
          }}
          onLater={() => setSubdomainDeferred(true)}
        />
      ) : null}
      <TourProvider
        businessId={business.id}
        onboardingCompletedAt={onboardingCompletedAt}
        isPro={business.is_pro}
        backendCompletedAt={business.dashboard_tour_completed_at}
        backendProCompletedAt={business.dashboard_pro_tour_completed_at ?? null}
        subdomainSetupBlocking={subdomainSetupBlocking}
      >
        <Dashboard pro={business.is_pro} business={business}>
          <Outlet />
        </Dashboard>
        <TourRunnerWithComplete business={business} />
        <TourAutoStart />
        {subdomainDeferred && needsSubdomainSetup ? <SubdomainTourPause /> : null}
      </TourProvider>
    </DashboardContext.Provider>
  )
}
