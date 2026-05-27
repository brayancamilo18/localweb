import { useEffect, useRef, useState } from 'react'
import type { Schedule } from '../../../types/api'
import { DEFAULT_SCHEDULE } from '../../../lib/schedule/scheduleDefaults'
import ScheduleEditor from '../../shared/ScheduleEditor'
import { updateBusiness } from '../../../api/dashboard'
import { useDashboard } from '../context/DashboardContext'

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

  return (
    <ScheduleEditor
      schedule={schedule}
      onChange={setSchedule}
      showSavedStatus
      saving={saving}
      savedAt={savedAt}
    />
  )
}
