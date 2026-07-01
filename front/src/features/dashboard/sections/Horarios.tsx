import { useCallback, useEffect, useRef, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import Icon from '../../../components/primitives/Icon'
import type { Schedule } from '../../../types/api'
import { DEFAULT_SCHEDULE } from '../../../lib/schedule/scheduleDefaults'
import ScheduleEditor from '../../shared/ScheduleEditor'
import { updateBusiness } from '../../../api/dashboard'
import { keys } from '../../../api/queryKeys'
import { useDashboard } from '../context/DashboardContext'
import DashboardSectionHeader from '../components/DashboardSectionHeader'
import '../components/dashboardSectionHeader.css'
import '../../shared/scheduleEditor.css'

function serializeHorariosPayload(schedule: Schedule, hideClosed: boolean): string {
  return JSON.stringify({ schedule, hideClosed })
}

function scheduleFromBusiness(business: { schedule: Schedule | null; hide_closed_days?: boolean }) {
  return {
    schedule: business.schedule ?? DEFAULT_SCHEDULE,
    hideClosed: Boolean(business.hide_closed_days),
  }
}

export default function Horarios() {
  const queryClient = useQueryClient()
  const { business } = useDashboard()
  const boot = scheduleFromBusiness(business)

  const [schedule, setSchedule] = useState<Schedule>(boot.schedule)
  const [hideClosed, setHideClosed] = useState(boot.hideClosed)
  const lastSavedRef = useRef(serializeHorariosPayload(boot.schedule, boot.hideClosed))
  const scheduleRef = useRef(schedule)
  const hideClosedRef = useRef(hideClosed)
  scheduleRef.current = schedule
  hideClosedRef.current = hideClosed

  const hydratedBusinessIdRef = useRef<number | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [savedAt, setSavedAt] = useState<Date | null>(new Date())

  const applyServerSnapshot = useCallback((next: { schedule: Schedule; hideClosed: boolean }) => {
    const serialized = serializeHorariosPayload(next.schedule, next.hideClosed)
    if (serialized === lastSavedRef.current) return
    setSchedule(next.schedule)
    setHideClosed(next.hideClosed)
    lastSavedRef.current = serialized
    setSavedAt(new Date())
    setSaveError(null)
  }, [])

  // Hidratar solo al entrar en otro negocio (mismo patrón que Editor.tsx).
  useEffect(() => {
    if (hydratedBusinessIdRef.current === business.id) return
    hydratedBusinessIdRef.current = business.id
    applyServerSnapshot(scheduleFromBusiness(business))
  }, [business, business.id, applyServerSnapshot])

  // Al montar la sección, pedir datos frescos al servidor (la caché puede quedar atrás tras navegar).
  useEffect(() => {
    void queryClient.invalidateQueries({ queryKey: keys.dashboard.business })
  }, [queryClient])

  // Si llega un refetch y no hay edición pendiente, alinear con el servidor.
  useEffect(() => {
    const dirty =
      serializeHorariosPayload(scheduleRef.current, hideClosedRef.current) !== lastSavedRef.current
    if (dirty) return
    applyServerSnapshot(scheduleFromBusiness(business))
  }, [business.schedule, business.hide_closed_days, business, applyServerSnapshot])

  const saveMutation = useMutation({
    mutationFn: (payload: { schedule: Schedule; hide_closed_days: boolean }) => updateBusiness(payload),
    onSuccess: (updated) => {
      queryClient.setQueryData(keys.dashboard.business, updated)
      applyServerSnapshot(scheduleFromBusiness(updated))
    },
    onError: () => {
      setSaveError('No se pudo guardar. Comprueba tu conexión e inténtalo de nuevo.')
    },
  })

  const persistNow = useCallback(
    (nextSchedule: Schedule, nextHideClosed: boolean) => {
      const serialized = serializeHorariosPayload(nextSchedule, nextHideClosed)
      if (serialized === lastSavedRef.current) return Promise.resolve()
      setSaveError(null)
      return saveMutation.mutateAsync({
        schedule: nextSchedule,
        hide_closed_days: nextHideClosed,
      })
    },
    [saveMutation],
  )

  const handleHideClosedChange = useCallback(
    (value: boolean) => {
      setHideClosed(value)
      void persistNow(scheduleRef.current, value)
    },
    [persistNow],
  )

  useEffect(() => {
    const serialized = serializeHorariosPayload(schedule, hideClosed)
    if (serialized === lastSavedRef.current) return

    const t = window.setTimeout(() => {
      void persistNow(schedule, hideClosed)
    }, 800)

    return () => {
      window.clearTimeout(t)
    }
  }, [schedule, hideClosed, persistNow])

  useEffect(() => {
    return () => {
      const nextSchedule = scheduleRef.current
      const nextHideClosed = hideClosedRef.current
      const serialized = serializeHorariosPayload(nextSchedule, nextHideClosed)
      if (serialized === lastSavedRef.current) return
      void updateBusiness({ schedule: nextSchedule, hide_closed_days: nextHideClosed })
        .then((updated) => {
          queryClient.setQueryData(keys.dashboard.business, updated)
        })
        .catch(() => undefined)
    }
  }, [queryClient])

  const saving = saveMutation.isPending
  const isDirty = serializeHorariosPayload(schedule, hideClosed) !== lastSavedRef.current
  const savedLabel = saving
    ? 'Guardando…'
    : saveError
      ? 'Error al guardar'
      : isDirty
        ? 'Cambios pendientes…'
        : 'Guardado'
  const displaySavedAt = savedAt ?? new Date()

  return (
    <div className="lw-dash-section-page lw-dash-section-page--wide" data-tour="horarios-main">
      <DashboardSectionHeader
        badgeIcon="clock"
        badgeLabel="Disponibilidad"
        title="Horarios"
        subtitle="Define cuándo está abierto tu negocio. Se guarda automáticamente al dejar de editar durante un segundo."
        aside={
          <div className="lw-schedule-editor__saved" aria-live="polite">
            {!saving && !saveError && !isDirty ? (
              <span className="lw-schedule-editor__saved-dot" aria-hidden />
            ) : (
              <Icon
                name={saveError ? 'alert' : 'refresh'}
                size={14}
                color={saveError ? 'var(--lw-danger)' : 'var(--lw-dash-accent)'}
              />
            )}
            <span style={{ fontWeight: 600 }}>{savedLabel}</span>
            {!saving && !saveError && !isDirty ? (
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
      {saveError ? (
        <p className="lw-schedule-editor__error" style={{ marginBottom: '1rem' }}>
          {saveError}
        </p>
      ) : null}
      <ScheduleEditor
        hideHeader
        schedule={schedule}
        onChange={setSchedule}
        hideClosedDays={hideClosed}
        onHideClosedDaysChange={handleHideClosedChange}
        showSavedStatus={false}
        saving={saving}
        savedAt={savedAt}
      />
    </div>
  )
}
