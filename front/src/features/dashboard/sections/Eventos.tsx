import { useCallback, useEffect, useRef, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import Icon from '../../../components/primitives/Icon'
import { Switch } from '../../../components/primitives/primitives'
import { updateBusiness } from '../../../api/dashboard'
import { keys } from '../../../api/queryKeys'
import { useDashboard } from '../context/DashboardContext'
import DashboardSectionHeader from '../components/DashboardSectionHeader'
import ProEventsEditor from '../../shared/ProEventsEditor'
import '../components/dashboardSectionHeader.css'

export default function Eventos() {
  const queryClient = useQueryClient()
  const { business } = useDashboard()
  const eventsAsPro = business.is_pro || business.plan === 'pending'

  const [eventsEnabled, setEventsEnabled] = useState(Boolean(business.events_enabled))
  const lastSavedRef = useRef(Boolean(business.events_enabled))
  const eventsEnabledRef = useRef(eventsEnabled)
  eventsEnabledRef.current = eventsEnabled

  const hydratedBusinessIdRef = useRef<number | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [savedAt, setSavedAt] = useState<Date | null>(new Date())

  useEffect(() => {
    if (hydratedBusinessIdRef.current === business.id) return
    hydratedBusinessIdRef.current = business.id
    const next = Boolean(business.events_enabled)
    setEventsEnabled(next)
    lastSavedRef.current = next
    setSavedAt(new Date())
    setSaveError(null)
  }, [business.id, business.events_enabled])

  useEffect(() => {
    void queryClient.invalidateQueries({ queryKey: keys.dashboard.business })
    void queryClient.invalidateQueries({ queryKey: keys.dashboard.events })
  }, [queryClient])

  const saveMutation = useMutation({
    mutationFn: (enabled: boolean) => updateBusiness({ events_enabled: enabled }),
    onSuccess: (updated) => {
      queryClient.setQueryData(keys.dashboard.business, updated)
      const next = Boolean(updated.events_enabled)
      setEventsEnabled(next)
      lastSavedRef.current = next
      setSavedAt(new Date())
      setSaveError(null)
    },
    onError: () => {
      setSaveError('No se pudo guardar. Comprueba tu conexión e inténtalo de nuevo.')
    },
  })

  const persistEnabled = useCallback(
    (next: boolean) => {
      if (next === lastSavedRef.current) return
      setSaveError(null)
      saveMutation.mutate(next)
    },
    [saveMutation],
  )

  const handleToggle = useCallback(
    (next: boolean) => {
      setEventsEnabled(next)
      persistEnabled(next)
    },
    [persistEnabled],
  )

  useEffect(() => {
    return () => {
      const next = eventsEnabledRef.current
      if (next === lastSavedRef.current) return
      void updateBusiness({ events_enabled: next })
        .then((updated) => {
          queryClient.setQueryData(keys.dashboard.business, updated)
        })
        .catch(() => undefined)
    }
  }, [queryClient])

  const saving = saveMutation.isPending
  const isDirty = eventsEnabled !== lastSavedRef.current
  const savedLabel = saving
    ? 'Guardando…'
    : saveError
      ? 'Error al guardar'
      : isDirty
        ? 'Cambios pendientes…'
        : 'Guardado'
  const displaySavedAt = savedAt ?? new Date()

  return (
    <div className="lw-dash-section-page" data-tour="eventos-main">
      <DashboardSectionHeader
        badgeIcon="calendar"
        badgeLabel="Agenda"
        title="Eventos"
        subtitle="Publica conciertos, actuaciones o fechas especiales en tu web."
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

      <div
        className="lw-schedule-editor__hide-closed"
        style={{
          marginBottom: 24,
          padding: '16px 18px',
          borderRadius: 12,
          border: '1px solid var(--lw-dash-border)',
          background: 'var(--lw-dash-surface)',
        }}
      >
        <div className="lw-schedule-editor__hide-closed-text">
          <div className="lw-schedule-editor__day-name">Mostrar eventos en mi web</div>
          <div className="lw-schedule-editor__day-hours">
            Si lo desactivas, la sección de eventos no aparecerá en tu página pública.
          </div>
        </div>
        <Switch
          checked={eventsEnabled}
          disabled={saving}
          onChange={handleToggle}
          label={eventsEnabled ? 'Activado' : 'Desactivado'}
        />
      </div>

      {eventsEnabled ? (
        <ProEventsEditor isPro={eventsAsPro} />
      ) : (
        <p className="lw-small" style={{ color: 'var(--lw-dash-muted)', margin: 0 }}>
          Activa el interruptor para gestionar tus eventos.
        </p>
      )}
    </div>
  )
}
