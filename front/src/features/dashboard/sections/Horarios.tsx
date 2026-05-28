import { useEffect, useRef, useState } from 'react'
import Icon from '../../../components/primitives/Icon'
import type { Schedule } from '../../../types/api'
import { DEFAULT_SCHEDULE } from '../../../lib/schedule/scheduleDefaults'
import ScheduleEditor from '../../shared/ScheduleEditor'
import { updateBusiness } from '../../../api/dashboard'
import { useDashboard } from '../context/DashboardContext'
import DashboardSectionHeader from '../components/DashboardSectionHeader'
import '../components/dashboardSectionHeader.css'
import '../../shared/scheduleEditor.css'

export default function Horarios() {
  const { business, refetch } = useDashboard()
  const [schedule, setSchedule] = useState<Schedule>(business.schedule ?? DEFAULT_SCHEDULE)
  const lastSaved = useRef(JSON.stringify(business.schedule ?? DEFAULT_SCHEDULE))
  const [saving, setSaving] = useState(false)
  const [savedAt, setSavedAt] = useState<Date | null>(new Date())

  const scheduleKey = JSON.stringify(business.schedule ?? null)
  useEffect(() => {
    const initial = business.schedule ?? DEFAULT_SCHEDULE
    setSchedule(initial)
    lastSaved.current = JSON.stringify(initial)
    setSavedAt(new Date())
  }, [business.id, scheduleKey])

  useEffect(() => {
    const serialized = JSON.stringify(schedule)
    if (serialized === lastSaved.current) return
    const t = window.setTimeout(() => {
      setSaving(true)
      void updateBusiness({ schedule })
        .then(() => {
          lastSaved.current = serialized
          setSavedAt(new Date())
          refetch()
        })
        .finally(() => setSaving(false))
    }, 1000)
    return () => window.clearTimeout(t)
  }, [schedule, refetch])

  const displaySavedAt = savedAt ?? new Date()
  const savedLabel = saving ? 'Guardando…' : 'Guardado'

  return (
    <div className="lw-dash-section-page lw-dash-section-page--wide" data-tour="horarios-main">
      <DashboardSectionHeader
        badgeIcon="clock"
        badgeLabel="Disponibilidad"
        title="Horarios"
        subtitle="Define cuándo está abierto tu negocio. Se guarda automáticamente al dejar de editar durante un segundo."
        aside={
          <div className="lw-schedule-editor__saved" aria-live="polite">
            {!saving ? (
              <span className="lw-schedule-editor__saved-dot" aria-hidden />
            ) : (
              <Icon name="refresh" size={14} color="var(--lw-dash-accent)" />
            )}
            <span style={{ fontWeight: 600 }}>{savedLabel}</span>
            {!saving ? (
              <span style={{ color: 'var(--lw-dash-muted)' }}>
                ·{' '}
                {displaySavedAt.toLocaleTimeString('es-ES', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            ) : null}
          </div>
        }
      />
      <ScheduleEditor
        hideHeader
        schedule={schedule}
        onChange={setSchedule}
        showSavedStatus={false}
        saving={saving}
        savedAt={savedAt}
      />
    </div>
  )
}
